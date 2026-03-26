import { formatViews, getViewsClass, timeAgo, escapeHtml } from '../utils/format.js';

export function renderOverview(container, data) {
  const top10 = data.videos.slice(0, 10);

  container.innerHTML = `
    <h2 class="section-title">🏆 Top 10 Video Nhiều View Nhất</h2>
    <table class="video-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Tiêu Đề</th>
          <th>Views</th>
          <th>Thời Gian</th>
        </tr>
      </thead>
      <tbody>
        ${top10.map((v, i) => `
          <tr class="animate-slide-up" style="animation-delay:${i * 50}ms">
            <td class="video-rank">${i + 1}</td>
            <td class="video-title">
              <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" style="color:inherit;text-decoration:none">
                ${escapeHtml(v.title)}
              </a>
            </td>
            <td class="video-views ${getViewsClass(v.views)}">${formatViews(v.views)}</td>
            <td class="video-date">${timeAgo(v.publishedAt)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
