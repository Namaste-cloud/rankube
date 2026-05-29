/* =============================================
   Rankube — Internationalization Helpers (ES Module)
   ============================================= */

/**
 * Format a view count with compact notation.
 * e.g., 1200000 → "1.2M" (en) or "120만" (ko)
 * @param {number|string} count
 * @returns {string}
 */
export function formatViewCount(count) {
  const num = Number(count);
  if (!Number.isFinite(num)) return '0';

  const locale = navigator.language || 'en';
  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(num);
  } catch {
    // Fallback for environments without compact support
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return String(num);
  }
}

/**
 * Format a timestamp into a relative time string.
 * e.g., "2 hours ago", "3일 전"
 * @param {number|string} timestamp — ISO string or Unix timestamp (seconds)
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  let date;
  if (typeof timestamp === 'number') {
    // If the timestamp is in seconds (< year 3000 in seconds), convert to ms
    date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return '';

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const locale = navigator.language || 'en';

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffSec < 60) return rtf.format(-diffSec, 'second');
    if (diffMin < 60) return rtf.format(-diffMin, 'minute');
    if (diffHr < 24) return rtf.format(-diffHr, 'hour');
    if (diffDay < 7) return rtf.format(-diffDay, 'day');
    if (diffWeek < 5) return rtf.format(-diffWeek, 'week');
    if (diffMonth < 12) return rtf.format(-diffMonth, 'month');
    return rtf.format(-diffYear, 'year');
  } catch {
    // Fallback
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return `${diffWeek}w ago`;
  }
}

/**
 * Format duration in seconds to human-readable string.
 * e.g., 222 → "3:42", 3735 → "1:02:15"
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  const num = Math.max(0, Math.floor(Number(seconds) || 0));

  const h = Math.floor(num / 3600);
  const m = Math.floor((num % 3600) / 60);
  const s = num % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format a number with locale-aware separators.
 * e.g., 1234567 → "1,234,567" (en) or "1.234.567" (de)
 * @param {number|string} num
 * @returns {string}
 */
export function formatNumber(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return '0';

  const locale = navigator.language || 'en';
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return String(n);
  }
}
