/**
 * Format a number to a readable string (1.9M, 287K, 5K)
 */
export function formatViews(n) {
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return val >= 10 ? `${Math.round(val)}M` : `${val.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const val = n / 1_000;
    return val >= 10 ? `${Math.round(val)}K` : `${val.toFixed(1)}K`;
  }
  return n.toString();
}

/**
 * Get CSS class for view count coloring
 */
export function getViewsClass(views) {
  if (views >= 1_000_000) return 'views-1m';
  if (views >= 500_000) return 'views-500k';
  if (views >= 100_000) return 'views-100k';
  if (views >= 50_000) return 'views-50k';
  return 'views-low';
}

/**
 * Format date to relative time (e.g. "2 years ago")
 */
export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Format ISO date to readable string
 */
export function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Parse YouTube ISO 8601 duration (PT1H2M3S -> "1:02:03")
 */
export function parseDuration(iso) {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = match[1] || '';
  const m = match[2] || '0';
  const s = (match[3] || '0').padStart(2, '0');
  if (h) return `${h}:${m.padStart(2, '0')}:${s}`;
  return `${m}:${s}`;
}

/**
 * Escape HTML
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
