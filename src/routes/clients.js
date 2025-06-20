const express = require('express');
const { Client } = require('../models');
const vipService = require('../services/vipService');
const bookingService = require('../services/bookingService');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateClient,
  validatePagination,
  validateParams,
  paramSchemas 
} = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         is_vip:
 *           type: boolean
 *         vip_tier:
 *           type: string
 *           enum: [standard, silver, gold, platinum, diamond]
 *         vip_discount:
 *           type: number
 *         full_name:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/clients:
 *   post:
 *     tags: [Clients]
 *     summary: Create or update a client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *           example:
 *             first_name: "John"
 *             last_name: "Doe"
 *             email: "john.doe@example.com"
 *             phone: "+1-555-1234"
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     client:
 *                       $ref: '#/components/schemas/Client'
 *                     is_new:
 *                       type: boolean
 *                     vip_status:
 *                       type: object
 *       200:
 *         description: Client updated successfully
 */
router.post('/', 
  validateClient, 
  asyncHandler(async (req, res) => {
    const { client, created } = await Client.findOrCreateByEmail(req.body);
    
    // Update VIP status
    const { client: updatedClient, vipData } = await vipService.getClientVipStatus(client, true);
    
    const statusCode = created ? 201 : 200;
    const message = created ? 'Client created successfully' : 'Client updated successfully';
    
    res.status(statusCode).json({
      success: true,
      message,
      data: {
        client: updatedClient,
        is_new: created,
        vip_status: vipData
      }
    });
  })
);

/**
 * @swagger
 * /api/clients:
 *   get:
 *     tags: [Clients]
 *     summary: Get all clients
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: vip_only
 *         schema:
 *           type: boolean
 *         description: Show only VIP clients
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     clients:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Client'
 *                     pagination:
 *                       type: object
 */
router.get('/', 
  validatePagination, 
  asyncHandler(async (req, res) => {
    const { search, vip_only, page, limit, sort, order } = req.query;
    
    const whereClause = {};
    if (vip_only) {
      whereClause.is_vip = true;
    }
    
    if (search) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * limit;
    
    const result = await Client.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'is_vip', 'vip_tier', 'vip_discount', 'created_at'],
      order: [[sort, order]],
      limit,
      offset
    });
    
    res.json({
      success: true,
      data: {
        clients: result.rows,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(result.count / limit),
          total_clients: result.count,
          per_page: limit
        }
      }
    });
  })
);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Get client details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Client not found
 */
router.get('/:id', 
  validateParams(paramSchemas.id), 
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Client not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: client
    });
  })
);

/**
 * @swagger
 * /api/clients/{id}/vip-status:
 *   get:
 *     tags: [Clients]
 *     summary: Check and update client VIP status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Client ID
 *       - in: query
 *         name: force_refresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh from VIP API
 *     responses:
 *       200:
 *         description: VIP status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     client:
 *                       $ref: '#/components/schemas/Client'
 *                     vip_status:
 *                       type: object
 *                       properties:
 *                         is_vip:
 *                           type: boolean
 *                         tier:
 *                           type: string
 *                         discount:
 *                           type: number
 *                         from_cache:
 *                           type: boolean
 *       404:
 *         description: Client not found
 */
router.get('/:id/vip-status', 
  validateParams(paramSchemas.id), 
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { force_refresh } = req.query;
    
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Client not found'
        }
      });
    }
    
    const { client: updatedClient, fromCache, vipData } = await vipService.getClientVipStatus(
      client, 
      force_refresh === 'true'
    );
    
    res.json({
      success: true,
      data: {
        client: updatedClient,
        vip_status: {
          is_vip: updatedClient.is_vip,
          tier: updatedClient.vip_tier,
          discount: updatedClient.vip_discount,
          from_cache: fromCache,
          last_checked: updatedClient.vip_checked_at,
          ...vipData
        }
      }
    });
  })
);

/**
 * @swagger
 * /api/clients/{id}/bookings:
 *   get:
 *     tags: [Clients]
 *     summary: Get client's booking history
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Client ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, cancelled, completed]
 *         description: Filter by booking status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Client's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     client:
 *                       $ref: '#/components/schemas/Client'
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *                     pagination:
 *                       type: object
 *       404:
 *         description: Client not found
 */
router.get('/:id/bookings', 
  validateParams(paramSchemas.id),
  validatePagination,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, page, limit } = req.query;
    
    const client = await Client.findByPk(id, {
      attributes: ['id', 'first_name', 'last_name', 'email', 'is_vip', 'vip_tier']
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Client not found'
        }
      });
    }
    
    const offset = (page - 1) * limit;
    const bookingData = await bookingService.getClientBookings(id, { status, limit, offset });
    
    res.json({
      success: true,
      data: {
        client,
        ...bookingData
      }
    });
  })
);

/**
 * @swagger
 * /api/clients/search:
 *   get:
 *     tags: [Clients]
 *     summary: Search clients by email
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Client email to search
 *     responses:
 *       200:
 *         description: Client found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Client not found
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email parameter is required'
      }
    });
  }
  
  const client = await Client.findByEmail(email);
  
  if (!client) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Client not found'
      }
    });
  }
  
  res.json({
    success: true,
    data: client
  });
}));

module.exports = router;
