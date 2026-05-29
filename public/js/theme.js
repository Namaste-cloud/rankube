/* =============================================
   Rankube — Theme Manager (ES Module)
   ============================================= */

const STORAGE_KEY = 'rankube-theme';
const THEMES = ['dark', 'light'];

/**
 * Get the user's preferred theme from various sources.
 * Priority: localStorage > system preference > default (dark)
 * @returns {'dark'|'light'}
 */
function getPreferredTheme() {
  // 1. Check localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && THEMES.includes(stored)) {
    return stored;
  }

  // 2. Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  // 3. Default to dark
  return 'dark';
}

/**
 * Apply theme to the document.
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#06060b' : '#f8f9fc');
  }
}

/**
 * Update the theme toggle button icon.
 * @param {'dark'|'light'} theme
 */
function updateToggleIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const icon = btn.querySelector('.theme-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

/**
 * Initialize the theme system.
 */
export function initTheme() {
  const theme = getPreferredTheme();
  applyTheme(theme);
  updateToggleIcon(theme);

  // Watch for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually chosen
      if (!localStorage.getItem(STORAGE_KEY)) {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
        updateToggleIcon(newTheme);
      }
    });
  }
}

/**
 * Toggle between dark and light themes.
 */
export function toggleTheme() {
  const current = getCurrentTheme();
  const next = current === 'dark' ? 'light' : 'dark';

  // Add transition class for smooth switch
  document.documentElement.classList.add('theme-transitioning');

  applyTheme(next);
  updateToggleIcon(next);
  localStorage.setItem(STORAGE_KEY, next);

  // Remove transition class after animation completes
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 450);
}

/**
 * Get the current active theme.
 * @returns {'dark'|'light'}
 */
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}
