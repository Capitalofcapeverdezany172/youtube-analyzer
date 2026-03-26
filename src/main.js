import { formatViews, getViewsClass, timeAgo, formatDate, escapeHtml } from './utils/format.js';
import { renderOverview } from './components/tab-overview.js';
import { renderInsights } from './components/tab-insights.js';
import { renderFormulas } from './components/tab-formulas.js';
import { renderPatterns } from './components/tab-patterns.js';
import { renderAllVideos } from './components/tab-all-videos.js';

// ===== State =====
let appData = null;
let aiData = null;

// ===== DOM =====
const inputPage = document.getElementById('input-page');
const resultPage = document.getElementById('result-page');
const channelInput = document.getElementById('channel-input');
const analyzeBtn = document.getElementById('analyze-btn');
const errorMsg = document.getElementById('error-msg');
const backBtn = document.getElementById('back-btn');
const scrollTopBtn = document.getElementById('scroll-top-btn');

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  checkApiConfig();
  setupEventListeners();
});

function setupEventListeners() {
  // Analyze
  analyzeBtn.addEventListener('click', startAnalysis);
  channelInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startAnalysis();
  });

  // Back button
  backBtn.addEventListener('click', showInputPage);

  // Settings toggle
  document.getElementById('settings-toggle').addEventListener('click', () => {
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  // Save keys
  document.getElementById('save-keys-btn').addEventListener('click', saveApiKeys);

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Scroll to top
  window.addEventListener('scroll', () => {
    scrollTopBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ===== API Config =====
async function checkApiConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.hasYoutubeKey) {
      document.getElementById('yt-key-input').placeholder = '••••••• (configured)';
    }
    if (data.hasGeminiKey) {
      document.getElementById('gemini-key-input').placeholder = '••••••• (configured)';
    }
  } catch (e) {
    // Server not running yet, OK
  }
}

async function saveApiKeys() {
  const ytKey = document.getElementById('yt-key-input').value.trim();
  const geminiKey = document.getElementById('gemini-key-input').value.trim();

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeApiKey: ytKey || undefined, geminiApiKey: geminiKey || undefined })
    });
    const data = await res.json();

    if (data.hasYoutubeKey) {
      document.getElementById('yt-key-input').value = '';
      document.getElementById('yt-key-input').placeholder = '••••••• (configured)';
    }
    if (data.hasGeminiKey) {
      document.getElementById('gemini-key-input').value = '';
      document.getElementById('gemini-key-input').placeholder = '••••••• (configured)';
    }

    showError('API keys saved!', false);
    setTimeout(() => hideError(), 2000);
  } catch (e) {
    showError('Failed to save keys. Is the server running?');
  }
}

// ===== Analysis =====
async function startAnalysis() {
  let handle = channelInput.value.trim();
  if (!handle) {
    showError('Vui lòng nhập channel handle');
    return;
  }

  // Clean handle
  handle = handle.replace(/^https?:\/\/(www\.)?youtube\.com\/@?/, '').replace(/\/.*$/, '').replace('@', '');
  
  hideError();
  setLoading(true);

  try {
    const res = await fetch(`/api/analyze/${encodeURIComponent(handle)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to analyze channel');
    }

    appData = data;
    aiData = null;
    addToHistory(handle, data.channel.title);
    showResultPage(data);

    // Trigger AI analysis in background
    triggerAIAnalysis(data);
  } catch (e) {
    showError(e.message);
  } finally {
    setLoading(false);
  }
}

async function triggerAIAnalysis(data) {
  const insightsTab = document.getElementById('tab-insights');
  insightsTab.innerHTML = `
    <div class="ai-loading">
      <div class="spinner-large"></div>
      <p>Đang phân tích bằng AI...</p>
      <p style="font-size:13px;margin-top:8px;color:var(--text-light)">Gemini đang phân loại ${data.videos.length} video</p>
    </div>
  `;

  try {
    const res = await fetch('/api/ai-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videos: data.videos,
        channelTitle: data.channel.title
      })
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || 'AI analysis failed');
    }

    aiData = result;
    renderInsights(insightsTab, result, data);
    renderFormulas(document.getElementById('tab-formulas'), result);

    // Update patterns with AI data
    if (result.publishingPatterns) {
      renderPatterns(document.getElementById('tab-patterns'), data.videos, result.publishingPatterns);
    }
  } catch (e) {
    insightsTab.innerHTML = `
      <div class="ai-error">
        <p style="color:var(--red)">AI Analysis Error</p>
        <p style="color:var(--text-muted);font-size:14px;margin-top:8px">${escapeHtml(e.message)}</p>
        <button class="btn-retry" onclick="document.querySelector('[data-tab=insights]').click()">Thử lại</button>
      </div>
    `;

    // Still render formulas tab with fallback
    document.getElementById('tab-formulas').innerHTML = `
      <div class="ai-error">
        <p style="color:var(--text-muted)">Cần Gemini API key để phân tích title formulas</p>
      </div>
    `;
  }
}

// ===== Page Navigation =====
function showInputPage() {
  resultPage.classList.remove('active');
  inputPage.classList.add('active');
  window.scrollTo({ top: 0 });
}

function showResultPage(data) {
  inputPage.classList.remove('active');
  resultPage.classList.add('active');
  window.scrollTo({ top: 0 });

  // Channel info
  const avatar = document.getElementById('channel-avatar');
  avatar.src = data.channel.thumbnail || '';
  avatar.alt = data.channel.title;
  document.getElementById('channel-name').textContent = `@${data.channel.handle}`;
  const link = document.getElementById('channel-link');
  link.href = data.channel.url;
  link.textContent = data.channel.url;

  // Analysis meta
  document.getElementById('analysis-date').textContent = `📅 ${formatDate(data.analyzedAt)}`;
  document.getElementById('analysis-time').textContent = `⏱ ${data.elapsedSeconds}s`;

  // Stat cards
  renderStatCards(data.stats);

  // Total count in tab
  document.getElementById('total-count').textContent = data.stats.totalVideos;

  // Render tabs
  renderOverview(document.getElementById('tab-overview'), data);
  renderPatterns(document.getElementById('tab-patterns'), data.videos, null);
  renderAllVideos(document.getElementById('tab-allvideos'), data.videos);

  // Default tab
  switchTab('overview');
}

function renderStatCards(stats) {
  const cards = [
    { value: stats.totalVideos, label: 'Tổng Video', color: 'green' },
    { value: formatViews(stats.totalViews), label: 'Tổng Views', color: 'red' },
    { value: formatViews(stats.avgViews), label: 'Trung Bình', color: 'orange' },
    { value: formatViews(stats.medianViews), label: 'Median', color: 'purple' },
    { value: formatViews(stats.maxViews), label: 'Cao Nhất', color: 'blue' },
    { value: formatViews(stats.minViews), label: 'Thấp Nhất', color: 'yellow' }
  ];

  document.getElementById('stat-cards').innerHTML = cards.map((c, i) => `
    <div class="stat-card animate-slide-up" data-color="${c.color}" style="animation-delay:${i * 80}ms">
      <div class="stat-value">${c.value}</div>
      <div class="stat-label">${c.label}</div>
    </div>
  `).join('');
}

// ===== Tabs =====
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(`tab-${tabId}`).classList.add('active');

  // Retry AI analysis if switching to insights and no data
  if (tabId === 'insights' && !aiData && appData) {
    triggerAIAnalysis(appData);
  }
}

// ===== History =====
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('yt-analyzer-history') || '[]');
  if (history.length === 0) return;

  document.getElementById('history-section').style.display = 'block';
  document.getElementById('history-list').innerHTML = history.map(h => `
    <button class="history-item" data-handle="${escapeHtml(h.handle)}">
      @${escapeHtml(h.handle)}
    </button>
  `).join('');

  document.querySelectorAll('.history-item').forEach(btn => {
    btn.addEventListener('click', () => {
      channelInput.value = btn.dataset.handle;
      startAnalysis();
    });
  });
}

function addToHistory(handle, title) {
  let history = JSON.parse(localStorage.getItem('yt-analyzer-history') || '[]');
  history = history.filter(h => h.handle !== handle);
  history.unshift({ handle, title, date: new Date().toISOString() });
  history = history.slice(0, 10);
  localStorage.setItem('yt-analyzer-history', JSON.stringify(history));
}

// ===== UI Helpers =====
function setLoading(loading) {
  analyzeBtn.disabled = loading;
  analyzeBtn.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
  analyzeBtn.querySelector('.btn-loading').style.display = loading ? 'inline-flex' : 'none';
  channelInput.disabled = loading;
}

function showError(msg, isError = true) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
  if (!isError) {
    errorMsg.style.background = '#f0fdf4';
    errorMsg.style.borderColor = '#bbf7d0';
    errorMsg.style.color = '#16a34a';
  } else {
    errorMsg.style.background = '#fef2f2';
    errorMsg.style.borderColor = '#fecaca';
    errorMsg.style.color = '#ef4444';
  }
}

function hideError() {
  errorMsg.style.display = 'none';
}
