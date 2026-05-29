const logger = require('../utils/logger');

/**
 * Creates a simple sliding window rate limiter in-memory
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const maxRequests = options.maxRequests || 60;  // 60 requests per minute
  
  const ipRequests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipRequests.has(ip)) {
      ipRequests.set(ip, []);
    }

    const requests = ipRequests.get(ip);
    
    // Filter requests within the current window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= maxRequests) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({
        error: true,
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString()
      });
    }

    validRequests.push(now);
    ipRequests.set(ip, validRequests);
    
    // Cleanup old entries occasionally (rough garbage collection)
    if (Math.random() < 0.05) {
      for (const [key, times] of ipRequests.entries()) {
        const valid = times.filter(timestamp => now - timestamp < windowMs);
        if (valid.length === 0) {
          ipRequests.delete(key);
        } else {
          ipRequests.set(key, valid);
        }
      }
    }

    next();
  };
}

module.exports = { createRateLimiter };
