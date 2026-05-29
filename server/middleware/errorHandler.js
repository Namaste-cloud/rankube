const logger = require('../utils/logger');

/**
 * Global Express error handling middleware
 */
function errorHandler(err, req, res, next) {
  logger.error('Unhandled Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  const statusCode = err.status || err.statusCode || 500;
  const isKnownError = err.isKnown || statusCode < 500;

  res.status(statusCode).json({
    error: true,
    message: isKnownError ? err.message : 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
