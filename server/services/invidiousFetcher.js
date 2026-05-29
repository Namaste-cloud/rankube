const instanceOrchestrator = require('./instanceOrchestrator');
const { normalizeInvidiousVideo } = require('./normalizer');
const { TIMEOUTS } = require('../utils/constants');
const logger = require('../utils/logger');

async function fetchFromInvidious(region, type) {
  const instances = instanceOrchestrator.getTopInstances(3);
  
  if (instances.length === 0) {
    throw new Error('No healthy Invidious instances available');
  }

  const queryParams = new URLSearchParams({
    region,
    type: type !== 'Default' ? type.toLowerCase() : ''
  });
  
  // Remove empty params
  for (const [key, value] of Array.from(queryParams.entries())) {
    if (!value) queryParams.delete(key);
  }

  let lastError = null;

  for (const inst of instances) {
    const breaker = instanceOrchestrator.getBreaker(inst.uri);
    
    try {
      if (!breaker) throw new Error(`No breaker found for ${inst.uri}`);
      
      const data = await breaker.execute(async () => {
        logger.info(`Tier 1: Trying Invidious instance ${inst.domain}`);
        const response = await fetch(`${inst.uri}/api/v1/trending?${queryParams.toString()}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(TIMEOUTS.INVIDIOUS)
        });

        if (!response.ok) {
           if (response.status === 429) throw new Error('Rate Limited');
           throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
      });

      if (!Array.isArray(data)) {
         throw new Error('Invalid response format');
      }

      logger.info(`Tier 1: Success from ${inst.domain}`);
      return {
        videos: data.map(normalizeInvidiousVideo),
        source: 'invidious',
        instance: inst.domain
      };

    } catch (error) {
      logger.warn(`Tier 1: Failed using ${inst.domain}`, { error: error.message });
      lastError = error;
      // Try next instance
    }
  }

  throw new Error(`All Invidious attempts failed. Last error: ${lastError?.message}`);
}

async function searchFromInvidious(query) {
  const instances = instanceOrchestrator.getTopInstances(3);
  
  if (instances.length === 0) {
    throw new Error('No healthy Invidious instances available');
  }

  const queryParams = new URLSearchParams({
    q: query,
    sort_by: 'view_count',
    type: 'video'
  });
  
  let lastError = null;

  for (const inst of instances) {
    const breaker = instanceOrchestrator.getBreaker(inst.uri);
    
    try {
      if (!breaker) throw new Error(`No breaker found for ${inst.uri}`);
      
      const data = await breaker.execute(async () => {
        logger.info(`Tier 1 Search: Trying Invidious instance ${inst.domain}`);
        const response = await fetch(`${inst.uri}/api/v1/search?${queryParams.toString()}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(TIMEOUTS.INVIDIOUS)
        });

        if (!response.ok) {
           if (response.status === 429) throw new Error('Rate Limited');
           throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
      });

      if (!Array.isArray(data)) {
         throw new Error('Invalid response format');
      }

      logger.info(`Tier 1 Search: Success from ${inst.domain}`);
      return {
        videos: data.map(normalizeInvidiousVideo),
        source: 'invidious',
        instance: inst.domain
      };

    } catch (error) {
      logger.warn(`Tier 1 Search: Failed using ${inst.domain}`, { error: error.message });
      lastError = error;
    }
  }

  throw new Error(`All Invidious search attempts failed. Last error: ${lastError?.message}`);
}

module.exports = { fetchFromInvidious, searchFromInvidious };
