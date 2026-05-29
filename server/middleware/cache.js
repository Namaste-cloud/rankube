const { CACHE_TTL } = require('../utils/constants');
const logger = require('../utils/logger');

// In-memory Map for caching
const memoryCache = new Map();

/**
 * Creates SWR (Stale-While-Revalidate) Cache Middleware
 */
function createCacheMiddleware() {
  return (req, res, next) => {
    // Attach cache helpers to request
    req.cache = {
      get: (key) => memoryCache.get(key),
      set: (key, data, source, instance) => {
        memoryCache.set(key, {
          data,
          source,
          instance,
          fetchedAt: Date.now(),
          isRevalidating: false
        });
      },
      key: (region, type) => `trending:${region}:${type}`
    };
    next();
  };
}

/**
 * Get cache stats for monitoring
 */
function getCacheStats() {
  let size = 0;
  let expired = 0;
  const now = Date.now();
  
  for (const [key, value] of memoryCache.entries()) {
    if (now - value.fetchedAt > CACHE_TTL.MAX) {
      expired++;
      memoryCache.delete(key);
    } else {
      size++;
    }
  }
  
  return {
    size,
    expiredTotal: expired
  };
}

module.exports = {
  createCacheMiddleware,
  getCacheStats
};
