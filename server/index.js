const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const logger = require('./utils/logger');
const { CACHE_TTL } = require('./utils/constants');
const instanceOrchestrator = require('./services/instanceOrchestrator');
const { createCacheMiddleware } = require('./middleware/cache');
const { createRateLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');

const trendingRouter = require('./routes/trending');
const healthRouter = require('./routes/health');

// Configure App
const app = express();
const PORT = process.env.PORT || 3000;

// Security & Optimization Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts/styles for this simple SPA
}));
app.use(compression());
app.use(cors());

// Rate Limiting
app.use('/api', createRateLimiter());

// Cache Middleware (injects req.cache)
const cacheMiddleware = createCacheMiddleware();

// API Routes
app.use('/api/trending', cacheMiddleware, trendingRouter);
app.use('/api', healthRouter); // /api/health, /api/countries, /api/categories

// Static File Serving (Frontend)
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Fallback to index.html for SPA routing (if we had it, but we don't strictly need it for query params)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Global Error Handler (must be last)
app.use(errorHandler);

// Initialization & Server Start
async function bootstrap() {
  logger.info('Starting Rankube Backend...');
  
  try {
    // 1. Initial Instance Refresh
    await instanceOrchestrator.refreshInstances();
    
    // 2. Set Interval for Instance Refresh
    setInterval(() => {
      instanceOrchestrator.refreshInstances();
    }, CACHE_TTL.INSTANCES);

    // 3. Start Server
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Access locally at: http://localhost:${PORT}`);
    });

    // 4. Graceful Shutdown
    const shutdown = () => {
      logger.info('SIGTERM/SIGINT received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
      // Force shutdown if it takes too long
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to bootstrap server', { error: error.message });
    process.exit(1);
  }
}

bootstrap();
