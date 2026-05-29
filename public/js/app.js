/* =============================================
   Rankube — Main Application Entry Point (ES Module)
   ============================================= */

import { initTheme, toggleTheme } from './theme.js';
import { getState, setState, subscribe, readFromURL } from './state.js';
import { fetchTrending, searchVideos } from './api.js';
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

// Search DOM References
let searchForm;
let searchInput;
let searchClearBtn;
let searchStatus;
let searchQueryHighlight;
let searchBackBtn;
let filterSection;

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

/* ── Update Search UI Visibility ── */
function updateSearchUI(state) {
  if (!searchStatus || !filterSection || !searchInput || !searchClearBtn || !searchQueryHighlight) return;

  if (state.searchQuery) {
    searchStatus.style.display = 'flex';
    filterSection.style.display = 'none';
    searchQueryHighlight.textContent = state.searchQuery;
    searchInput.value = state.searchQuery;
    searchClearBtn.style.display = 'flex';
  } else {
    searchStatus.style.display = 'none';
    filterSection.style.display = 'block';
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
  }
}

/* ── Fetch and Render Trending/Search Data ── */
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

  // Update Search UI state
  updateSearchUI(state);

  try {
    let videos;
    if (state.searchQuery) {
      videos = await searchVideos(state.searchQuery, state.limit);
      document.title = `Rankube — Search: "${state.searchQuery}"`;
    } else {
      videos = await fetchTrending(state.region, state.type, state.limit);
      const country = COUNTRIES.find((c) => c.code === state.region);
      if (country) {
        document.title = `Rankube — ${country.flag} ${country.name} Trending`;
      }
    }

    renderVideoGrid(videoContainer, videos);
    updateLastUpdatedTime();
  } catch (err) {
    console.error('[App] Failed to load data:', err);
    renderError(videoContainer, err.message || 'Failed to load videos.', () =>
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

  // Search DOM refs
  searchForm = document.getElementById('search-form');
  searchInput = document.getElementById('search-input');
  searchClearBtn = document.getElementById('search-clear-btn');
  searchStatus = document.getElementById('search-status');
  searchQueryHighlight = document.getElementById('search-query-highlight');
  searchBackBtn = document.getElementById('search-back-btn');
  filterSection = document.getElementById('filter-section');

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

  // Search Submit
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = searchInput.value.trim();
      if (val) {
        setState({ searchQuery: val });
        loadTrending(true);
      }
    });
  }

  // Search Clear & Back Actions
  const clearSearch = () => {
    setState({ searchQuery: '' });
    loadTrending(true);
  };

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', clearSearch);
  }

  if (searchBackBtn) {
    searchBackBtn.addEventListener('click', clearSearch);
  }

  // Search Input change (show/hide clear button)
  if (searchInput && searchClearBtn) {
    searchInput.addEventListener('input', () => {
      searchClearBtn.style.display = searchInput.value ? 'flex' : 'none';
    });
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
