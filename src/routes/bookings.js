const express = require('express');
const bookingService = require('../services/bookingService');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateCreateBooking, 
  validateUpdateBooking, 
  validateCancelBooking,
  validatePagination,
  validateBookingFilters,
  validateParams,
  paramSchemas 
} = require('../middleware/validation');

const router = express.Router();

// ВАЖНО: /stats должен быть ПЕРЕД /:bookingUuid
router.get('/stats', asyncHandler(async (req, res) => {
  const { hotel_id, date_from, date_to } = req.query;
  
  const stats = await bookingService.getBookingStats({ hotel_id, date_from, date_to });
  
  res.json({
    success: true,
    data: stats
  });
}));

// Остальные маршруты...
router.post('/', validateCreateBooking, asyncHandler(async (req, res) => {
  const result = await bookingService.createBooking(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: result
  });
}));

router.get('/', validateBookingFilters, validatePagination, asyncHandler(async (req, res) => {
  const { client_id, room_id, status, check_in_from, check_in_to, vip_only } = req.query;
  const { page, limit, sort, order } = req.query;
  
  const whereClause = {};
  if (client_id) whereClause.client_id = client_id;
  if (room_id) whereClause.room_id = room_id;
  if (status) whereClause.status = status;
  if (vip_only) whereClause.vip_discount_applied = { [require('sequelize').Op.gt]: 0 };
  
  if (check_in_from && check_in_to) {
    whereClause.check_in_date = {
      [require('sequelize').Op.between]: [check_in_from, check_in_to]
    };
  } else if (check_in_from) {
    whereClause.check_in_date = {
      [require('sequelize').Op.gte]: check_in_from
    };
  } else if (check_in_to) {
    whereClause.check_in_date = {
      [require('sequelize').Op.lte]: check_in_to
    };
  }
  
  const offset = (page - 1) * limit;
  
  const { Booking, Room, RoomType, Hotel, Client } = require('../models');
  
  const result = await Booking.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Client,
        as: 'client',
        attributes: ['id', 'first_name', 'last_name', 'email', 'is_vip', 'vip_tier']
      },
      {
        model: Room,
        as: 'room',
        attributes: ['id', 'room_number', 'floor'],
        include: [
          {
            model: RoomType,
            as: 'roomType',
            attributes: ['name', 'description']
          },
          {
            model: Hotel,
            as: 'hotel',
            attributes: ['name', 'address']
          }
        ]
      }
    ],
    order: [[sort, order]],
    limit,
    offset
  });
  
  res.json({
    success: true,
    data: {
      bookings: result.rows,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(result.count / limit),
        total_bookings: result.count,
        per_page: limit
      }
    }
  });
}));

router.get('/:bookingUuid', validateParams(paramSchemas.bookingUuid), asyncHandler(async (req, res) => {
  const { bookingUuid } = req.params;
  
  const booking = await bookingService.getBookingByUuid(bookingUuid);
  
  res.json({
    success: true,
    data: booking
  });
}));

router.put('/:bookingUuid', validateParams(paramSchemas.bookingUuid), validateUpdateBooking, asyncHandler(async (req, res) => {
  const { bookingUuid } = req.params;
  
  const updatedBooking = await bookingService.updateBooking(bookingUuid, req.body);
  
  res.json({
    success: true,
    message: 'Booking updated successfully',
    data: updatedBooking
  });
}));

router.delete('/:bookingUuid/cancel', validateParams(paramSchemas.bookingUuid), validateCancelBooking, asyncHandler(async (req, res) => {
  const { bookingUuid } = req.params;
  const { reason } = req.body;
  
  const cancelledBooking = await bookingService.cancelBooking(bookingUuid, reason);
  
  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: cancelledBooking
  });
}));

module.exports = router;
