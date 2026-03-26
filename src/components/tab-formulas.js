import { formatViews, getViewsClass, escapeHtml } from '../utils/format.js';

const TROPHY_ICONS = ['🥇', '🥈', '🥉', '🏅', '🎯', '💡', '🔑', '📌'];

export function renderFormulas(container, aiResult) {
  const { formulas } = aiResult;

  if (!formulas || formulas.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:40px;text-align:center">Không có dữ liệu formulas</p>';
    return;
  }

  container.innerHTML = `
    <div class="formula-cards">
      ${formulas.map((f, i) => `
        <div class="formula-card animate-slide-up" style="animation-delay:${i * 100}ms">
          <div class="formula-header">
            <span class="formula-icon">${TROPHY_ICONS[i % TROPHY_ICONS.length]}</span>
            <h3 class="formula-name">"${escapeHtml(f.pattern)}"</h3>
          </div>
          <div class="formula-examples">
            ${(f.examples || []).slice(0, 4).map(ex => `
              <div class="formula-example">
                <span class="formula-example-title">${escapeHtml(ex.title)}</span>
                <span class="formula-example-views ${getViewsClass(ex.views)}">${formatViews(ex.views)}</span>
              </div>
            `).join('')}
          </div>
          ${f.description ? `
            <div class="formula-description">${escapeHtml(f.description)}</div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}
