const express = require('express');
const { Room, RoomType, Hotel, Booking } = require('../models');
const bookingService = require('../services/bookingService');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateRoomAvailability, 
  validatePagination, 
  validateRoomFilters,
  validateParams,
  paramSchemas 
} = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         room_number:
 *           type: string
 *         floor:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [available, maintenance, out_of_order]
 *         roomType:
 *           $ref: '#/components/schemas/RoomType'
 *         hotel:
 *           $ref: '#/components/schemas/Hotel'
 *     
 *     RoomType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         base_price:
 *           type: number
 *         max_occupancy:
 *           type: integer
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     tags: [Rooms]
 *     summary: Get all rooms with filters
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *       - in: query
 *         name: room_type_id
 *         schema:
 *           type: integer
 *         description: Filter by room type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, maintenance, out_of_order]
 *         description: Filter by room status
 *       - in: query
 *         name: floor
 *         schema:
 *           type: integer
 *         description: Filter by floor
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
 *         description: List of rooms
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
 *                     rooms:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Room'
 *                     pagination:
 *                       type: object
 */
router.get('/', 
  validateRoomFilters, 
  validatePagination, 
  asyncHandler(async (req, res) => {
    const { hotel_id, room_type_id, status, floor, min_price, max_price } = req.query;
    const { page, limit, sort, order } = req.query;
    
    const whereClause = { hotel_id };
    if (room_type_id) whereClause.room_type_id = room_type_id;
    if (status) whereClause.status = status;
    if (floor !== undefined) whereClause.floor = floor;
    
    const roomTypeWhere = {};
    if (min_price) roomTypeWhere.base_price = { [Room.sequelize.Sequelize.Op.gte]: min_price };
    if (max_price) {
      roomTypeWhere.base_price = { 
        ...roomTypeWhere.base_price,
        [Room.sequelize.Sequelize.Op.lte]: max_price 
      };
    }
    
    const offset = (page - 1) * limit;
    
    const result = await Room.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: RoomType,
          as: 'roomType',
          where: Object.keys(roomTypeWhere).length > 0 ? roomTypeWhere : undefined,
          attributes: ['id', 'name', 'description', 'base_price', 'max_occupancy', 'amenities']
        },
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'address']
        }
      ],
      order: [[sort === 'price' ? { model: RoomType, as: 'roomType' } : sort === 'name' ? { model: RoomType, as: 'roomType' } : sort, sort === 'price' ? 'base_price' : sort === 'name' ? 'name' : sort, order]],
      limit,
      offset,
      distinct: true
    });
    
    res.json({
      success: true,
      data: {
        rooms: result.rows,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(result.count / limit),
          total_rooms: result.count,
          per_page: limit
        }
      }
    });
  })
);

/**
 * @swagger
 * /api/rooms/available:
 *   get:
 *     tags: [Rooms]
 *     summary: Get available rooms for specific dates
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *       - in: query
 *         name: check_in_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-in date (YYYY-MM-DD)
 *       - in: query
 *         name: check_out_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-out date (YYYY-MM-DD)
 *       - in: query
 *         name: guest_count
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Number of guests
 *       - in: query
 *         name: room_type_id
 *         schema:
 *           type: integer
 *         description: Filter by room type
 *     responses:
 *       200:
 *         description: Available rooms with pricing
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
 *                     available_rooms:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Room'
 *                           - type: object
 *                             properties:
 *                               pricing:
 *                                 type: object
 *                                 properties:
 *                                   original_price:
 *                                     type: number
 *                                   total_price:
 *                                     type: number
 *                                   nights:
 *                                     type: integer
 *                                   price_per_night:
 *                                     type: number
 */
router.get('/available', 
  validateRoomAvailability, 
  asyncHandler(async (req, res) => {
    const { hotel_id, check_in_date, check_out_date, guest_count, room_type_id } = req.query;
    
    const availableRooms = await bookingService.getAvailableRooms(
      hotel_id, 
      check_in_date, 
      check_out_date, 
      { guest_count, room_type_id }
    );
    
    res.json({
      success: true,
      data: {
        hotel_id: parseInt(hotel_id),
        check_in_date,
        check_out_date,
        guest_count: guest_count || 1,
        available_rooms: availableRooms,
        total_available: availableRooms.length
      }
    });
  })
);

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get room details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found
 */
router.get('/:id', 
  validateParams(paramSchemas.id), 
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const room = await Room.findByPk(id, {
      include: [
        {
          model: RoomType,
          as: 'roomType',
          attributes: ['id', 'name', 'description', 'base_price', 'max_occupancy', 'amenities']
        },
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'address', 'phone', 'email']
        }
      ]
    });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Room not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: room
    });
  })
);

/**
 * @swagger
 * /api/rooms/types:
 *   get:
 *     tags: [Rooms]
 *     summary: Get all room types
 *     responses:
 *       200:
 *         description: List of room types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RoomType'
 */
router.get('/types', asyncHandler(async (req, res) => {
  const roomTypes = await RoomType.findAll({
    order: [['base_price', 'ASC']]
  });
  
  res.json({
    success: true,
    data: roomTypes
  });
}));

module.exports = router;
