const express = require('express');
const router = express.Router();
const { LIMITS, CACHE_TTL } = require('../utils/constants');
const logger = require('../utils/logger');
const { searchFromInvidious } = require('../services/invidiousFetcher');
const { searchFromPiped } = require('../services/pipedFetcher');

router.get('/', async (req, res, next) => {
  try {
    const query = req.query.q ? String(req.query.q).trim() : '';
    if (!query) {
      return res.status(400).json({
        error: true,
        message: 'Query parameter "q" is required',
        code: 'MISSING_QUERY'
      });
    }

    const limit = LIMITS.includes(parseInt(req.query.limit, 10)) ? parseInt(req.query.limit, 10) : 20;

    // Cache lookup for search
    const cacheKey = `search:${query.toLowerCase()}`;
    const cachedEntry = req.cache.get(cacheKey);
    const now = Date.now();

    if (cachedEntry) {
      const age = now - cachedEntry.fetchedAt;
      if (age < CACHE_TTL.FRESH) {
        logger.info(`[Cache Hit] Search FRESH: ${cacheKey}`);
        return sendResponse(res, cachedEntry, limit, query);
      }
    }

    // Fetch from APIs
    logger.info(`[Cache Miss] Search: ${cacheKey}`);
    const data = await fetchSearchAndCache(query, req.cache, cacheKey);
    return sendResponse(res, data, limit, query);

  } catch (error) {
    next(error);
  }
});

async function fetchSearchAndCache(query, cacheManager, cacheKey) {
  let result;
  
  try {
    // Tier 1: Invidious Search
    result = await searchFromInvidious(query);
  } catch (errorTier1) {
    logger.warn('Tier 1 search fallback triggered', { reason: errorTier1.message });
    
    // Tier 2: Piped Search
    result = await searchFromPiped(query);
  }

  // Update Cache (Search results cached for a shorter TTL)
  cacheManager.set(cacheKey, result.videos, result.source, result.instance);
  
  return {
    data: result.videos,
    source: result.source,
    instance: result.instance,
    fetchedAt: Date.now()
  };
}

function sendResponse(res, cacheEntry, limit, query) {
  const { data, source, instance, fetchedAt } = cacheEntry;
  const slicedData = data.slice(0, limit);
  
  res.json({
    videos: slicedData,
    meta: {
      query,
      source,
      instance,
      cachedAt: new Date(fetchedAt).toISOString(),
      freshUntil: new Date(fetchedAt + CACHE_TTL.FRESH).toISOString(),
      totalAvailable: data.length
    }
  });
}

module.exports = router;
