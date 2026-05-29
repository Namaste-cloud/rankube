const express = require('express');
const router = express.Router();
const { COUNTRIES, CATEGORIES } = require('../utils/constants');
const { getCacheStats } = require('../middleware/cache');
const instanceOrchestrator = require('../services/instanceOrchestrator');

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cacheStats: getCacheStats(),
    instances: instanceOrchestrator.getInstanceHealth()
  });
});

router.get('/countries', (req, res) => {
  res.json(COUNTRIES);
});

router.get('/categories', (req, res) => {
  res.json(CATEGORIES);
});

module.exports = router;
