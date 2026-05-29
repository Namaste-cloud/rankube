/* =============================================
   Rankube — API Client (ES Module)
   ============================================= */

import { API_BASE } from './constants.js';

/** Default request timeout in milliseconds */
const TIMEOUT_MS = 15000;

/**
 * Fetch trending videos from the API.
 *
 * @param {string} region — Country code (e.g., 'KR', 'US')
 * @param {string} type — Category type (e.g., 'Default', 'Music')
 * @param {number} limit — Number of videos to fetch
 * @returns {Promise<Array<object>>} — Array of video objects
 * @throws {Error} — On network failure, HTTP error, or timeout
 */
export async function fetchTrending(region, type, limit) {
  const params = new URLSearchParams({
    region,
    type,
    limit: String(limit),
  });

  const url = `${API_BASE}/api/trending?${params.toString()}`;

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}${errorText ? ` — ${errorText}` : ''}`
      );
    }

    const data = await response.json();

    // The API may return the array directly or wrapped in an object
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.videos)) {
      return data.videos;
    }
    if (data && Array.isArray(data.data)) {
      return data.data;
    }

    // If the response shape is unexpected, return empty array
    console.warn('[API] Unexpected response shape:', data);
    return [];
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }

    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }

    throw err;
  }
}

/**
 * Fetch search results for a query.
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array<object>>}
 */
export async function searchVideos(query, limit) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  const url = `${API_BASE}/api/search?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}${errorText ? ` — ${errorText}` : ''}`
      );
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.videos)) {
      return data.videos;
    }
    if (data && Array.isArray(data.data)) {
      return data.data;
    }

    console.warn('[API] Unexpected response shape:', data);
    return [];
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }

    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }

    throw err;
  }
}
