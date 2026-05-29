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

  throw new Error(`All Piped attempts failed. Last error: ${lastError?.message}`);
}

module.exports = { fetchFromPiped };
