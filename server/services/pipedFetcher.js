const { normalizePipedVideo } = require('./normalizer');
const { PIPED_INSTANCES, TIMEOUTS } = require('../utils/constants');
const logger = require('../utils/logger');

async function fetchFromPiped(region, type) {
  const queryParams = new URLSearchParams({ region });
  let lastError = null;

  // Piped API doesn't fully support category filtering in the same way,
  // we just fetch trending for the region.
  
  for (const instance of PIPED_INSTANCES) {
    try {
      logger.info(`Tier 2: Trying Piped instance ${instance}`);
      const response = await fetch(`${instance}/trending?${queryParams.toString()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(TIMEOUTS.PIPED)
      });

      if (!response.ok) {
         throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
         throw new Error('Invalid response format');
      }

      logger.info(`Tier 2: Success from ${instance}`);
      return {
        videos: data.map(normalizePipedVideo),
        source: 'piped',
        instance: new URL(instance).hostname
      };

    } catch (error) {
      logger.warn(`Tier 2: Failed using ${instance}`, { error: error.message });
      lastError = error;
      // Try next instance
    }
  }

  async function searchFromPiped(query) {
  const queryParams = new URLSearchParams({ q: query, filter: 'videos' });
  let lastError = null;

  for (const instance of PIPED_INSTANCES) {
    try {
      logger.info(`Tier 2 Search: Trying Piped instance ${instance}`);
      const response = await fetch(`${instance}/search?${queryParams.toString()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(TIMEOUTS.PIPED)
      });

      if (!response.ok) {
         throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Piped search returns { items: [...] }
      const items = data && Array.isArray(data.items) ? data.items : data;
      
      if (!Array.isArray(items)) {
         throw new Error('Invalid response format');
      }

      logger.info(`Tier 2 Search: Success from ${instance}`);
      return {
        videos: items.map(normalizePipedVideo),
        source: 'piped',
        instance: new URL(instance).hostname
      };

    } catch (error) {
      logger.warn(`Tier 2 Search: Failed using ${instance}`, { error: error.message });
      lastError = error;
    }
  }

  throw new Error(`All Piped search attempts failed. Last error: ${lastError?.message}`);
}

module.exports = { fetchFromPiped, searchFromPiped };
