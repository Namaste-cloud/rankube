/* =============================================
   Rankube — State Manager (ES Module)
   ============================================= */

import { DEFAULT_STATE, COUNTRIES, CATEGORIES, LIMITS } from './constants.js';

/** @type {Set<Function>} */
const subscribers = new Set();

/** @type {typeof DEFAULT_STATE} */
let state = { ...DEFAULT_STATE };

/**
 * Validate a region code against known countries.
 * @param {string} region
 * @returns {string} validated region code
 */
function validateRegion(region) {
  return COUNTRIES.some((c) => c.code === region) ? region : DEFAULT_STATE.region;
}

/**
 * Validate a category type.
 * @param {string} type
 * @returns {string} validated type
 */
function validateType(type) {
  return CATEGORIES.some((c) => c.id === type) ? type : DEFAULT_STATE.type;
}

/**
 * Validate a limit value.
 * @param {number|string} limit
 * @returns {number} validated limit
 */
function validateLimit(limit) {
  const num = Number(limit);
  return LIMITS.includes(num) ? num : DEFAULT_STATE.limit;
}

/**
 * Read state from URL search params.
 * @returns {typeof DEFAULT_STATE}
 */
export function readFromURL() {
  const params = new URLSearchParams(window.location.search);

  return {
    region: validateRegion(params.get('region') || DEFAULT_STATE.region),
    type: validateType(params.get('type') || DEFAULT_STATE.type),
    limit: validateLimit(params.get('limit') || DEFAULT_STATE.limit),
    autoRefresh: state.autoRefresh, // autoRefresh is not persisted in URL
  };
}

/**
 * Write current state to URL via pushState (no reload).
 * @param {typeof DEFAULT_STATE} s
 */
export function writeToURL(s) {
  const params = new URLSearchParams();
  params.set('region', s.region);
  params.set('type', s.type);
  params.set('limit', String(s.limit));

  const newURL = `${window.location.pathname}?${params.toString()}`;
  if (newURL !== `${window.location.pathname}${window.location.search}`) {
    window.history.pushState(null, '', newURL);
  }
}

/**
 * Subscribe to state changes.
 * @param {(state: typeof DEFAULT_STATE) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers of a state change.
 */
function notifySubscribers() {
  const snapshot = getState();
  subscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch (err) {
      console.error('[State] Subscriber error:', err);
    }
  });
}

/**
 * Update state with a partial object. Notifies subscribers and updates URL.
 * @param {Partial<typeof DEFAULT_STATE>} partial
 */
export function setState(partial) {
  const prev = { ...state };

  state = {
    ...state,
    ...partial,
  };

  // Only update URL and notify if something actually changed
  const changed =
    prev.region !== state.region ||
    prev.type !== state.type ||
    prev.limit !== state.limit ||
    prev.autoRefresh !== state.autoRefresh;

  if (changed) {
    writeToURL(state);
    notifySubscribers();
  }
}

/**
 * Get a copy of the current state.
 * @returns {typeof DEFAULT_STATE}
 */
export function getState() {
  return { ...state };
}

// ── Initialize from URL on module load ──
state = readFromURL();

// ── Handle browser back/forward ──
window.addEventListener('popstate', () => {
  const urlState = readFromURL();
  state = urlState;
  notifySubscribers();
});
