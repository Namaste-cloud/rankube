/* =============================================
   Rankube — Video Renderer (ES Module)
   ============================================= */

import { formatViewCount, formatRelativeTime, formatDuration } from './i18n.js';

/**
 * YouTube play icon as inline SVG.
 */
const YT_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z"/>
</svg>`;

/**
 * Verified checkmark icon.
 */
const VERIFIED_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="verified" aria-label="Verified channel">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
</svg>`;

/**
 * Build the YouTube watch URL from a video ID.
 * @param {string} videoId
 * @returns {string}
 */
function getYouTubeURL(videoId) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

/**
 * Resolve the best available thumbnail URL.
 * Invidious provides videoThumbnails array or single thumbnail fields.
 * @param {object} video
 * @returns {string}
 */
function getThumbnailURL(video) {
  // Invidious API: videoThumbnails array with quality levels
  if (Array.isArray(video.videoThumbnails) && video.videoThumbnails.length > 0) {
    // Prefer medium quality for card display
    const medium = video.videoThumbnails.find(
      (t) => t.quality === 'medium' || t.quality === 'sddefault'
    );
    if (medium) return medium.url;

    // Fallback: highest quality available
    const high = video.videoThumbnails.find(
      (t) => t.quality === 'high' || t.quality === 'maxresdefault'
    );
    if (high) return high.url;

    return video.videoThumbnails[0].url;
  }

  // Direct thumbnail fields
  if (video.thumbnail) return video.thumbnail;
  if (video.thumbnailUrl) return video.thumbnailUrl;

  // YouTube default thumbnail
  if (video.videoId) {
    return `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`;
  }

  return '';
}

/**
 * Get the rank badge CSS class.
 * @param {number} rank — 1-indexed
 * @returns {string}
 */
function getRankClass(rank) {
  if (rank === 1) return 'rank-badge rank-1';
  if (rank === 2) return 'rank-badge rank-2';
  if (rank === 3) return 'rank-badge rank-3';
  return 'rank-badge rank-default';
}

/**
 * Create a single video card element.
 * @param {object} video — Video data object
 * @param {number} rank — 1-indexed rank
 * @returns {HTMLElement}
 */
function createVideoCard(video, rank) {
  const card = document.createElement('article');
  card.className = 'video-card';
  card.setAttribute('role', 'listitem');

  const videoId = video.videoId || video.id || '';
  const title = video.title || 'Untitled';
  const channel = video.author || video.channelName || video.channel || '';
  const viewCount = video.viewCount || video.views || video.viewCountText || 0;
  const published = video.published || video.publishedText || video.publishDate || '';
  const duration = video.lengthSeconds || video.duration || 0;
  const isVerified = video.authorVerified || video.isVerified || false;
  const thumbnailURL = getThumbnailURL(video);
  const ytURL = getYouTubeURL(videoId);

  // Build rank badge
  const rankBadgeHTML =
    rank === 1
      ? `<div class="${getRankClass(rank)}" aria-label="Rank ${rank}">
           <span class="crown" aria-hidden="true">👑</span>
           ${rank}
         </div>`
      : `<div class="${getRankClass(rank)}" aria-label="Rank ${rank}">${rank}</div>`;

  // Build duration badge
  const durationHTML =
    duration > 0
      ? `<span class="video-duration" aria-label="Duration: ${formatDuration(duration)}">${formatDuration(duration)}</span>`
      : '';

  // Build verified badge
  const verifiedHTML = isVerified ? VERIFIED_ICON : '';

  // Build view count
  const viewsFormatted =
    typeof viewCount === 'string' ? viewCount : formatViewCount(viewCount);
  const viewsLabel = typeof viewCount === 'number' ? `${viewCount.toLocaleString()} views` : viewCount;

  // Build relative time
  const timeFormatted = published ? formatRelativeTime(published) : '';

  // Meta row
  const metaParts = [];
  if (viewsFormatted && viewsFormatted !== '0') {
    metaParts.push(`<span aria-label="${viewsLabel}">${viewsFormatted} views</span>`);
  }
  if (timeFormatted) {
    metaParts.push(`<span>${timeFormatted}</span>`);
  }

  const metaHTML = metaParts.join('<span class="separator" aria-hidden="true"></span>');

  card.innerHTML = `
    <a href="${ytURL}" target="_blank" rel="noopener noreferrer" class="video-card-link-wrapper">
      <div class="video-thumbnail">
        ${rankBadgeHTML}
        <img
          src="${thumbnailURL}"
          alt="${title}"
          loading="lazy"
          decoding="async"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 180%22><rect fill=%22%23111118%22 width=%22320%22 height=%22180%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2344445a%22 font-size=%2214%22>No Thumbnail</text></svg>'"
        />
        ${durationHTML}
      </div>
    </a>
    <div class="video-info">
      <a href="${ytURL}" target="_blank" rel="noopener noreferrer" class="video-title-link">
        <h3 class="video-title" data-tooltip="${title.replace(/"/g, '&quot;')}">${title}</h3>
      </a>
      <div class="video-channel">
        <span class="truncate">${channel}</span>
        ${verifiedHTML}
      </div>
      <div class="video-meta">
        ${metaHTML}
      </div>
      <div class="video-bottom">
        <div class="video-meta" style="margin-top:0;"></div>
        <a href="${ytURL}"
           target="_blank"
           rel="noopener noreferrer"
           class="video-yt-link"
           aria-label="Watch ${title} on YouTube"
           data-tooltip="Watch on YouTube">
          ${YT_ICON_SVG}
        </a>
      </div>
    </div>
  `;

  return card;
}

/**
 * Render a grid of video cards.
 * @param {HTMLElement} container
 * @param {Array<object>} videos
 */
export function renderVideoGrid(container, videos) {
  container.innerHTML = '';

  if (!videos || videos.length === 0) {
    renderEmptyState(container);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'video-grid stagger-in';
  grid.setAttribute('role', 'list');
  grid.setAttribute('aria-label', 'Trending videos');

  videos.forEach((video, index) => {
    const card = createVideoCard(video, index + 1);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/**
 * Render skeleton loading cards.
 * @param {HTMLElement} container
 * @param {number} count
 */
export function renderSkeleton(container, count = 12) {
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'video-grid';
  grid.setAttribute('aria-label', 'Loading videos...');
  grid.setAttribute('aria-busy', 'true');

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.setAttribute('aria-hidden', 'true');

    card.innerHTML = `
      <div class="skeleton-thumbnail">
        <div class="skeleton-badge"></div>
      </div>
      <div class="skeleton-info">
        <div class="skeleton-text h-lg w-90"></div>
        <div class="skeleton-text w-60"></div>
        <div class="skeleton-meta">
          <div class="skeleton-text w-40" style="flex:1;"></div>
          <div class="skeleton-text w-40" style="flex:1;"></div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  }

  container.appendChild(grid);
}

/**
 * Render an error state with retry button.
 * @param {HTMLElement} container
 * @param {string} message
 * @param {() => void} onRetry
 */
export function renderError(container, message, onRetry) {
  container.innerHTML = '';

  const state = document.createElement('div');
  state.className = 'state-message fade-in';

  state.innerHTML = `
    <span class="state-icon" aria-hidden="true">⚠️</span>
    <h3 class="state-title">Something went wrong</h3>
    <p class="state-desc">${message}</p>
  `;

  const retryBtn = document.createElement('button');
  retryBtn.className = 'btn-primary';
  retryBtn.textContent = 'Try Again';
  retryBtn.setAttribute('aria-label', 'Retry loading videos');
  retryBtn.addEventListener('click', onRetry);

  state.appendChild(retryBtn);
  container.appendChild(state);
}

/**
 * Render an empty state when no videos are found.
 * @param {HTMLElement} container
 */
export function renderEmptyState(container) {
  container.innerHTML = '';

  const state = document.createElement('div');
  state.className = 'state-message fade-in';

  state.innerHTML = `
    <span class="state-icon" aria-hidden="true">📭</span>
    <h3 class="state-title">No videos found</h3>
    <p class="state-desc">Try changing the region or category filters to discover more trending content.</p>
  `;

  container.appendChild(state);
}
