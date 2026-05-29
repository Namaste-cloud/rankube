/* =============================================
   Rankube — Main Application Entry Point (ES Module)
   ============================================= */

import { initTheme, toggleTheme } from './theme.js';
import { getState, setState, subscribe, readFromURL } from './state.js';
import { fetchTrending } from './api.js';
import { renderFilters, updateFilterSelection } from './filters.js';
import { renderVideoGrid, renderSkeleton, renderError } from './renderer.js';
import { AUTO_REFRESH_INTERVAL, COUNTRIES } from './constants.js';

/* ── DOM References ── */
let filterContainer;
let videoContainer;
let lastUpdatedEl;
let refreshBtn;
let autoRefreshToggle;
let themeToggleBtn;
let copyLinkBtn;
let refreshIcon;

/* ── Timers ── */
let autoRefreshTimer = null;

/* ── Toast System ── */
function showToast(message, icon = '✅') {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icon}</span><span>${message}</span>`;

  toastContainer.appendChild(toast);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3000);
}

/* ── Update "last updated" timestamp ── */
function updateLastUpdatedTime() {
  if (!lastUpdatedEl) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString(navigator.language || 'en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  lastUpdatedEl.textContent = `Updated ${timeStr}`;
  lastUpdatedEl.setAttribute('datetime', now.toISOString());
}

/* ── Fetch and Render Trending Data ── */
let isLoading = false;

async function loadTrending(showSkeletons = true) {
  if (isLoading) return;
  isLoading = true;

  const state = getState();

  // Show loading state
  if (showSkeletons) {
    renderSkeleton(videoContainer, state.limit);
  }

  // Spin the refresh icon
  if (refreshIcon) {
    refreshIcon.classList.add('spin');
  }

  try {
    const videos = await fetchTrending(state.region, state.type, state.limit);
    renderVideoGrid(videoContainer, videos);
    updateLastUpdatedTime();

    // Update document title with current region
    const country = COUNTRIES.find((c) => c.code === state.region);
    if (country) {
      document.title = `Rankube — ${country.flag} ${country.name} Trending`;
    }
  } catch (err) {
    console.error('[App] Failed to load trending:', err);
    renderError(videoContainer, err.message || 'Failed to load trending videos.', () =>
      loadTrending(true)
    );
  } finally {
    isLoading = false;
    if (refreshIcon) {
      refreshIcon.classList.remove('spin');
    }
  }
}

/* ── Auto-Refresh Management ── */
function startAutoRefresh() {
  stopAutoRefresh();
  autoRefreshTimer = setInterval(() => {
    loadTrending(false); // Don't show skeletons on auto-refresh
  }, AUTO_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function updateAutoRefreshUI(active) {
  if (!autoRefreshToggle) return;

  if (active) {
    autoRefreshToggle.classList.add('active');
    autoRefreshToggle.setAttribute('aria-pressed', 'true');
  } else {
    autoRefreshToggle.classList.remove('active');
    autoRefreshToggle.setAttribute('aria-pressed', 'false');
  }
}

/* ── Filter Change Handler ── */
function handleFilterChange(partial) {
  setState(partial);
  const newState = getState();
  updateFilterSelection(filterContainer, newState, handleFilterChange);
  loadTrending(true);
}

/* ── Copy Current Link ── */
async function copyCurrentLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard', '🔗');
  } catch {
    // Fallback: select a temporary input
    const tmp = document.createElement('input');
    tmp.value = window.location.href;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    tmp.remove();
    showToast('Link copied to clipboard', '🔗');
  }
}

/* ── Initialize Application ── */
function init() {
  // Cache DOM refs
  filterContainer = document.getElementById('filter-bar');
  videoContainer = document.getElementById('video-grid');
  lastUpdatedEl = document.getElementById('last-updated');
  refreshBtn = document.getElementById('refresh-btn');
  autoRefreshToggle = document.getElementById('auto-refresh-toggle');
  themeToggleBtn = document.getElementById('theme-toggle');
  copyLinkBtn = document.getElementById('copy-link-btn');
  refreshIcon = refreshBtn?.querySelector('.refresh-icon');

  // 1. Initialize theme
  initTheme();

  // 2. Read state from URL
  const state = getState();

  // 3. Render filters
  renderFilters(filterContainer, state, handleFilterChange);

  // 4. Fetch and render trending data
  loadTrending(true);

  // 5. Set up auto-refresh
  if (state.autoRefresh) {
    startAutoRefresh();
  }
  updateAutoRefreshUI(state.autoRefresh);

  // 6. Event Listeners

  // Refresh button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadTrending(true));
  }

  // Auto-refresh toggle
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener('click', () => {
      const current = getState();
      const newAutoRefresh = !current.autoRefresh;
      setState({ autoRefresh: newAutoRefresh });

      if (newAutoRefresh) {
        startAutoRefresh();
        showToast('Auto-refresh enabled (5 min)', '🔄');
      } else {
        stopAutoRefresh();
        showToast('Auto-refresh disabled', '⏸️');
      }
      updateAutoRefreshUI(newAutoRefresh);
    });
  }

  // Theme toggle
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Copy link button
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', copyCurrentLink);
  }

  // Subscribe to state changes (for popstate / back-forward navigation)
  subscribe((newState) => {
    renderFilters(filterContainer, newState, handleFilterChange);
    loadTrending(true);
  });
}

/* ── Bootstrap ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
