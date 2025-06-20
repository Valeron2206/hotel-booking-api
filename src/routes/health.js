const express = require('express');
const { sequelize } = require('../config/database');
const vipService = require('../services/vipService');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Basic health check
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: hotel-booking-api
 */
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'hotel-booking-api',
    version: '1.0.0'
  });
}));

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     tags: [Health]
 *     summary: Detailed health check with dependencies
 *     responses:
 *       200:
 *         description: Detailed health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 database:
 *                   type: object
 *                 vip_service:
 *                   type: object
 *                 uptime:
 *                   type: number
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'hotel-booking-api',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: null,
    vip_service: null
  };

  // Check database connection
  try {
    await sequelize.authenticate();
    healthStatus.database = {
      status: 'connected',
      response_time: Date.now() - startTime
    };
  } catch (error) {
    healthStatus.database = {
      status: 'error',
      error: error.message,
      response_time: Date.now() - startTime
    };
    healthStatus.status = 'degraded';
  }

  // Check VIP service
  try {
    const vipStatus = await vipService.getServiceStatus();
    healthStatus.vip_service = vipStatus;
    
    if (!vipStatus.available) {
      healthStatus.status = 'degraded';
    }
  } catch (error) {
    healthStatus.vip_service = {
      status: 'error',
      error: error.message
    };
    healthStatus.status = 'degraded';
  }

  const httpStatus = healthStatus.status === 'ok' ? 200 : 503;
  res.status(httpStatus).json(healthStatus);
}));

/**
 * @swagger
 * /health/database:
 *   get:
 *     tags: [Health]
 *     summary: Database connection health check
 *     responses:
 *       200:
 *         description: Database is healthy
 *       503:
 *         description: Database connection failed
 */
router.get('/database', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    await sequelize.authenticate();
    
    // Get basic database stats
    const stats = await sequelize.query('SELECT version() as version', {
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      status: 'connected',
      response_time: Date.now() - startTime,
      version: stats[0]?.version,
      pool: {
        total: sequelize.connectionManager.pool.size,
        idle: sequelize.connectionManager.pool.available,
        used: sequelize.connectionManager.pool.using
      }
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      response_time: Date.now() - startTime
    });
  }
}));

module.exports = router;
