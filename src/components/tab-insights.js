import { formatViews, escapeHtml } from '../utils/format.js';

export function renderInsights(container, aiResult, appData) {
  const { topics, viewerPersona, keyInsights } = aiResult;

  if (!topics || topics.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:40px;text-align:center">Không có dữ liệu AI</p>';
    return;
  }

  // Find max avgViews for bar width scaling
  const maxAvg = Math.max(...topics.map(t => t.avgViews || 0));

  const barColors = ['bar-0', 'bar-1', 'bar-2', 'bar-3', 'bar-4', 'bar-5', 'bar-6', 'bar-7'];

  let html = `
    <h2 class="section-title">📂 Phân Loại Chủ Đề</h2>
    <div class="topic-bars">
      ${topics.map((t, i) => {
        const widthPct = maxAvg > 0 ? Math.max(((t.avgViews || 0) / maxAvg) * 100, 15) : 15;
        const fires = '🔥'.repeat(Math.min(t.fireRating || 1, 3));
        return `
          <div class="topic-bar-item animate-slide-up" style="animation-delay:${i * 80}ms">
            <div class="topic-label">${escapeHtml(t.name)}</div>
            <div class="topic-bar-wrapper">
              <div class="topic-bar ${barColors[i % barColors.length]}" style="width:${widthPct}%">
                <span class="topic-bar-text">${t.videoCount} videos - avg ${formatViews(t.avgViews || 0)}</span>
              </div>
            </div>
            <div class="topic-fire">${fires}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Key Insights
  if (keyInsights && keyInsights.length > 0) {
    html += `
      <div class="insights-box">
        <h3>💡 Nhận xét chiến lược</h3>
        <ul>
          ${keyInsights.map(ins => `<li>${escapeHtml(ins)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Viewer Persona
  if (viewerPersona) {
    html += `
      <div class="persona-card">
        <h3>👤 Chân Dung Người Xem</h3>
        <div class="persona-grid">
          <div class="persona-item">
            <h4>Demographics</h4>
            <p style="font-size:14px">${escapeHtml(viewerPersona.demographics || '')}</p>
          </div>
          <div class="persona-item">
            <h4>Interests (Sở thích)</h4>
            <div class="persona-tags">
              ${(viewerPersona.interests || []).map(i => `<span class="persona-tag">${escapeHtml(i)}</span>`).join('')}
            </div>
          </div>
          <div class="persona-item">
            <h4>Pain Points (Vấn đề)</h4>
            <div class="persona-tags">
              ${(viewerPersona.painPoints || []).map(p => `<span class="persona-tag">${escapeHtml(p)}</span>`).join('')}
            </div>
          </div>
          <div class="persona-item">
            <h4>Motivations (Động lực)</h4>
            <div class="persona-tags">
              ${(viewerPersona.motivations || []).map(m => `<span class="persona-tag">${escapeHtml(m)}</span>`).join('')}
            </div>
          </div>
          ${viewerPersona.description ? `
            <div class="persona-description">
              ${escapeHtml(viewerPersona.description)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}
