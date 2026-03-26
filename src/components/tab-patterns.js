import { formatViews } from '../utils/format.js';

export function renderPatterns(container, videos, aiPatterns) {
  if (!videos || videos.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:40px;text-align:center">Không có dữ liệu</p>';
    return;
  }

  // Compute patterns from video data
  const monthMap = {};
  const dayOfWeekMap = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };
  const dayViews = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const quarterViews = {};

  videos.forEach(v => {
    const d = new Date(v.publishedAt);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;

    const dow = d.getDay();
    dayViews[dow].push(v.views);

    const q = `${d.getFullYear()} Q${Math.floor(d.getMonth() / 3) + 1}`;
    if (!quarterViews[q]) quarterViews[q] = [];
    quarterViews[q].push(v.views);
  });

  // Avg videos per month
  const months = Object.keys(monthMap);
  const totalMonths = months.length || 1;
  const avgPerMonth = (videos.length / totalMonths).toFixed(1);

  // Best day of week
  const dayAvgs = Object.entries(dayViews).map(([day, views]) => ({
    day: parseInt(day),
    avg: views.length > 0 ? views.reduce((s, v) => s + v, 0) / views.length : 0,
    count: views.length
  }));
  dayAvgs.sort((a, b) => b.avg - a.avg);
  const bestDay = dayAvgs[0];

  // Monthly publishing chart data
  const sortedMonths = months.sort();
  const last12 = sortedMonths.slice(-12);
  const maxMonthly = Math.max(...last12.map(m => monthMap[m]));

  // Quarterly trend
  const quarters = Object.entries(quarterViews)
    .map(([q, views]) => ({ quarter: q, avg: views.reduce((s,v) => s + v, 0) / views.length }))
    .sort((a, b) => a.quarter.localeCompare(b.quarter));
  const last8Q = quarters.slice(-8);
  const maxQAvg = Math.max(...last8Q.map(q => q.avg));

  let html = `
    <div class="patterns-grid">
      <div class="pattern-card animate-slide-up">
        <h3>📅 Tần suất đăng</h3>
        <div class="pattern-value">${avgPerMonth}</div>
        <div class="pattern-label">video / tháng (trung bình)</div>
        <div class="mini-chart">
          ${last12.map(m => {
            const h = maxMonthly > 0 ? (monthMap[m] / maxMonthly) * 100 : 0;
            return `<div class="mini-bar" style="height:${Math.max(h, 5)}%" title="${m}: ${monthMap[m]} videos"></div>`;
          }).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-light);margin-top:4px">
          <span>${last12[0] || ''}</span>
          <span>${last12[last12.length - 1] || ''}</span>
        </div>
      </div>

      <div class="pattern-card animate-slide-up" style="animation-delay:100ms">
        <h3>📊 Best Day (Ngày tốt nhất)</h3>
        <div class="pattern-value">${dayOfWeekMap[bestDay.day]}</div>
        <div class="pattern-label">Views trung bình: ${formatViews(Math.round(bestDay.avg))} (${bestDay.count} videos)</div>
        <div class="mini-chart" style="margin-top:16px">
          ${[1,2,3,4,5,6,0].map(d => {
            const da = dayAvgs.find(x => x.day === d);
            const h = bestDay.avg > 0 ? ((da?.avg || 0) / bestDay.avg) * 100 : 0;
            const isMax = d === bestDay.day;
            return `<div class="mini-bar" style="height:${Math.max(h, 5)}%;${isMax ? 'opacity:1;background:var(--green)' : ''}" title="${dayOfWeekMap[d]}: avg ${formatViews(Math.round(da?.avg || 0))}"></div>`;
          }).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-light);margin-top:4px">
          ${[1,2,3,4,5,6,0].map(d => `<span>${dayOfWeekMap[d]}</span>`).join('')}
        </div>
      </div>

      <div class="pattern-card animate-slide-up" style="animation-delay:200ms">
        <h3>📈 Trend theo quý</h3>
        ${last8Q.length > 0 ? `
          <div class="pattern-value">${formatViews(Math.round(last8Q[last8Q.length - 1]?.avg || 0))}</div>
          <div class="pattern-label">Views trung bình quý gần nhất</div>
          <div class="mini-chart" style="margin-top:16px">
            ${last8Q.map((q, i) => {
              const h = maxQAvg > 0 ? (q.avg / maxQAvg) * 100 : 0;
              const isLast = i === last8Q.length - 1;
              return `<div class="mini-bar" style="height:${Math.max(h, 5)}%;${isLast ? 'opacity:1;background:var(--blue)' : ''}" title="${q.quarter}: avg ${formatViews(Math.round(q.avg))}"></div>`;
            }).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-light);margin-top:4px">
            <span>${last8Q[0]?.quarter || ''}</span>
            <span>${last8Q[last8Q.length - 1]?.quarter || ''}</span>
          </div>
        ` : '<p style="color:var(--text-muted)">Chưa đủ dữ liệu</p>'}
      </div>

      <div class="pattern-card animate-slide-up" style="animation-delay:300ms">
        <h3>🎯 Performance Overview</h3>
        ${(() => {
          const sorted = [...videos].sort((a, b) => b.views - a.views);
          const top10pct = sorted.slice(0, Math.max(Math.floor(sorted.length * 0.1), 1));
          const bottom50pct = sorted.slice(Math.floor(sorted.length * 0.5));
          const topAvg = top10pct.reduce((s, v) => s + v.views, 0) / top10pct.length;
          const bottomAvg = bottom50pct.length > 0 
            ? bottom50pct.reduce((s, v) => s + v.views, 0) / bottom50pct.length 
            : 0;
          const ratio = bottomAvg > 0 ? (topAvg / bottomAvg).toFixed(1) : '∞';
          return `
            <div class="pattern-value">${ratio}x</div>
            <div class="pattern-label">Top 10% vs Bottom 50% gap</div>
            <div style="margin-top:16px;font-size:13px;color:var(--text-muted)">
              <div style="margin-bottom:4px">Top 10%: avg <strong style="color:var(--green)">${formatViews(Math.round(topAvg))}</strong></div>
              <div>Bottom 50%: avg <strong style="color:var(--text-light)">${formatViews(Math.round(bottomAvg))}</strong></div>
            </div>
          `;
        })()}
      </div>
    </div>

    ${aiPatterns ? `
      <div class="insights-box" style="margin-top:24px">
        <h3>🤖 AI Pattern Analysis</h3>
        <ul>
          <li>Trend: ${aiPatterns.trend || 'N/A'}</li>
          <li>Best performing period: ${aiPatterns.bestPerformingPeriod || 'N/A'}</li>
        </ul>
      </div>
    ` : ''}
  `;

  container.innerHTML = html;
}
