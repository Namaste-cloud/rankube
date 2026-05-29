const express = require('express');
const router = express.Router();
const { COUNTRIES, CATEGORIES, LIMITS, CACHE_TTL } = require('../utils/constants');
const logger = require('../utils/logger');
const { fetchFromInvidious } = require('../services/invidiousFetcher');
const { fetchFromPiped } = require('../services/pipedFetcher');
const { scrapeYouTubeTrending } = require('../services/youtubeScraper');

router.get('/', async (req, res, next) => {
  try {
    // 1. Validate Query Params
    const region = COUNTRIES.some(c => c.code === req.query.region) ? req.query.region : 'KR';
    const type = CATEGORIES.some(c => c.id === req.query.type) ? req.query.type : 'Default';
    const limit = LIMITS.includes(parseInt(req.query.limit, 10)) ? parseInt(req.query.limit, 10) : 20;

    // 2. Check Cache
    const cacheKey = req.cache.key(region, type);
    const cachedEntry = req.cache.get(cacheKey);
    const now = Date.now();

    if (cachedEntry) {
      const age = now - cachedEntry.fetchedAt;
      
      // FRESH: Return immediately
      if (age < CACHE_TTL.FRESH) {
        logger.info(`[Cache Hit] FRESH: ${cacheKey}`);
        return sendResponse(res, cachedEntry, limit, region, type);
      }
      
      // STALE: Return immediately AND revalidate in background
      if (age < CACHE_TTL.MAX) {
        logger.info(`[Cache Hit] STALE: ${cacheKey}. Triggering background revalidation.`);
        if (!cachedEntry.isRevalidating) {
          cachedEntry.isRevalidating = true;
          // Fire and forget
          fetchAndCache(region, type, req.cache, cacheKey).catch(err => {
            logger.error('Background revalidation failed', { error: err.message });
            cachedEntry.isRevalidating = false;
          });
        }
        return sendResponse(res, cachedEntry, limit, region, type);
      }
      
      // EXPIRED: Fall through to synchronous fetch
      logger.info(`[Cache Miss] EXPIRED: ${cacheKey}`);
    } else {
      logger.info(`[Cache Miss] NOT_FOUND: ${cacheKey}`);
    }

    // 3. Synchronous Fetch (Waterfall)
    const data = await fetchAndCache(region, type, req.cache, cacheKey);
    return sendResponse(res, data, limit, region, type);

  } catch (error) {
    next(error);
  }
});

async function fetchAndCache(region, type, cacheManager, cacheKey) {
  let result;
  
  try {
    // Tier 1: Invidious
    result = await fetchFromInvidious(region, type);
  } catch (errorTier1) {
    logger.warn('Tier 1 fallback triggered', { reason: errorTier1.message });
    
    try {
      // Tier 2: Piped
      result = await fetchFromPiped(region, type);
    } catch (errorTier2) {
      logger.warn('Tier 2 fallback triggered', { reason: errorTier2.message });
      
      // Tier 3: YouTube HTML Scrape
      result = await scrapeYouTubeTrending(region);
    }
  }

  // Update Cache
  cacheManager.set(cacheKey, result.videos, result.source, result.instance);
  
  return {
    data: result.videos,
    source: result.source,
    instance: result.instance,
    fetchedAt: Date.now()
  };
}

function sendResponse(res, cacheEntry, limit, region, type) {
  const { data, source, instance, fetchedAt } = cacheEntry;
  const slicedData = data.slice(0, limit);
  
  res.json({
    videos: slicedData,
    meta: {
      region,
      type,
      source,
      instance,
      cachedAt: new Date(fetchedAt).toISOString(),
      freshUntil: new Date(fetchedAt + CACHE_TTL.FRESH).toISOString(),
      totalAvailable: data.length
    }
  });
}

module.exports = router;
