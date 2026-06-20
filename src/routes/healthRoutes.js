const express = require('express');
const router = express.Router();
const redis = require('../config/redis');

router.get('/', async (_req, res, next) => {
  try {
    let redisStatus = 'disconnected';
    try {
      await redis.ping();
      redisStatus = 'connected';
    } catch {
      redisStatus = 'disconnected';
    }

    res.status(200).json({
      success: true,
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        redis: redisStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
