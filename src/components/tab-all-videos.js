import { formatViews, getViewsClass, timeAgo, escapeHtml } from '../utils/format.js';

const PER_PAGE = 30;
let currentPage = 1;
let filteredVideos = [];
let allVideos = [];
let currentSort = 'views-desc';

export function renderAllVideos(container, videos) {
  allVideos = videos;
  filteredVideos = [...videos];
  currentPage = 1;
  currentSort = 'views-desc';
  sortVideos();
  renderPage(container);
}

function sortVideos() {
  switch (currentSort) {
    case 'views-desc': filteredVideos.sort((a, b) => b.views - a.views); break;
    case 'views-asc': filteredVideos.sort((a, b) => a.views - b.views); break;
    case 'date-desc': filteredVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)); break;
    case 'date-asc': filteredVideos.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt)); break;
    case 'likes-desc': filteredVideos.sort((a, b) => b.likes - a.likes); break;
  }
}

function renderPage(container) {
  const totalPages = Math.ceil(filteredVideos.length / PER_PAGE);
  const start = (currentPage - 1) * PER_PAGE;
  const pageVideos = filteredVideos.slice(start, start + PER_PAGE);

  container.innerHTML = `
    <div class="all-videos-header">
      <input class="search-filter" type="text" id="video-search" placeholder="Tìm kiếm tiêu đề..." autocomplete="off">
      <select class="sort-select" id="video-sort">
        <option value="views-desc">Views cao nhất</option>
        <option value="views-asc">Views thấp nhất</option>
        <option value="date-desc">Mới nhất</option>
        <option value="date-asc">Cũ nhất</option>
        <option value="likes-desc">Likes cao nhất</option>
      </select>
    </div>

    <table class="video-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Tiêu Đề</th>
          <th>Views</th>
          <th>Likes</th>
          <th>Comments</th>
          <th>Ngày Đăng</th>
        </tr>
      </thead>
      <tbody>
        ${pageVideos.map((v, i) => `
          <tr>
            <td class="video-rank">${start + i + 1}</td>
            <td class="video-title">
              <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" style="color:inherit;text-decoration:none">
                ${escapeHtml(v.title)}
              </a>
            </td>
            <td class="video-views ${getViewsClass(v.views)}">${formatViews(v.views)}</td>
            <td style="color:var(--text-muted)">${formatViews(v.likes)}</td>
            <td style="color:var(--text-muted)">${formatViews(v.comments)}</td>
            <td class="video-date">${timeAgo(v.publishedAt)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${totalPages > 1 ? `
      <div class="pagination">
        <button class="page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>← Trước</button>
        ${generatePageButtons(totalPages)}
        <button class="page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>Sau →</button>
      </div>
    ` : ''}
  `;

  // Set sort value
  const sortSelect = container.querySelector('#video-sort');
  sortSelect.value = currentSort;

  // Event listeners
  container.querySelector('#video-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    filteredVideos = query
      ? allVideos.filter(v => v.title.toLowerCase().includes(query))
      : [...allVideos];
    sortVideos();
    currentPage = 1;
    renderPage(container);
  });

  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    sortVideos();
    currentPage = 1;
    renderPage(container);
  });

  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.page;
      if (p === 'prev') currentPage = Math.max(1, currentPage - 1);
      else if (p === 'next') currentPage = Math.min(totalPages, currentPage + 1);
      else currentPage = parseInt(p);
      renderPage(container);
      container.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function generatePageButtons(totalPages) {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  if (start > 1) pages.push(`<button class="page-btn" data-page="1">1</button>`);
  if (start > 2) pages.push(`<span style="padding:8px 4px;color:var(--text-light)">...</span>`);

  for (let i = start; i <= end; i++) {
    pages.push(`<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`);
  }

  if (end < totalPages - 1) pages.push(`<span style="padding:8px 4px;color:var(--text-light)">...</span>`);
  if (end < totalPages) pages.push(`<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`);

  return pages.join('');
}
