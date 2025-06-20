const { sequelize, Booking, Room, RoomType, Client, Hotel } = require('../models');
const vipService = require('./vipService');
const { ConflictError, NotFoundError, BadRequestError } = require('../middleware/errorHandler');

class BookingService {
  /**
   * Create a new booking with VIP processing
   */
  async createBooking(bookingData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { client_info, room_id, check_in_date, check_out_date, guest_count, special_requests } = bookingData;
      
      const room = await Room.findByPk(room_id, {
        include: [
          {
            model: RoomType,
            as: 'roomType',
            attributes: ['base_price', 'max_occupancy', 'name']
          },
          {
            model: Hotel,
            as: 'hotel',
            attributes: ['name']
          }
        ],
        transaction
      });

      if (!room) {
        throw new NotFoundError('Room not found');
      }

      if (!room.isAvailable()) {
        throw new BadRequestError('Room is not available for booking');
      }

      if (guest_count > room.roomType.max_occupancy) {
        throw new BadRequestError(`Room can accommodate maximum ${room.roomType.max_occupancy} guests`);
      }

      const isAvailable = await Booking.checkAvailability(room_id, check_in_date, check_out_date);
      if (!isAvailable) {
        throw new ConflictError('Room is already booked for the selected dates');
      }

      const { client } = await vipService.processVipForBooking(client_info);

      const nights = this.calculateNights(check_in_date, check_out_date);
      const pricing = vipService.calculateVipPricing(
        room.roomType.base_price,
        nights,
        client
      );

      const booking = await Booking.create({
        client_id: client.id,
        room_id: room_id,
        check_in_date,
        check_out_date,
        guest_count,
        special_requests,
        original_price: pricing.original_price,
        total_price: pricing.total_price,
        vip_discount_applied: pricing.vip_discount_applied,
        status: 'active'
      }, { transaction });

      await transaction.commit();

      const fullBooking = await this.getBookingByUuid(booking.booking_uuid);
      
      console.log(`✅ Booking created: ${booking.booking_uuid} for ${client.email}`);
      
      return {
        booking: fullBooking,
        pricing,
        vip_applied: client.is_vip
      };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Booking creation failed:', error.message);
      throw error;
    }
  }

  async getBookingByUuid(uuid) {
    const booking = await Booking.findByUuid(uuid);
    
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    return booking;
  }

  async cancelBooking(uuid, reason = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const booking = await Booking.findByUuid(uuid);
      
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      if (booking.status !== 'active') {
        throw new BadRequestError('Only active bookings can be cancelled');
      }

      if (!booking.canBeCancelled()) {
        throw new BadRequestError('Booking cannot be cancelled less than 24 hours before check-in');
      }

      await booking.cancel(reason);
      await transaction.commit();

      console.log(`✅ Booking cancelled: ${uuid}`);
      
      return await this.getBookingByUuid(uuid);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateBooking(uuid, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const booking = await Booking.findByUuid(uuid);
      
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      if (booking.status !== 'active') {
        throw new BadRequestError('Only active bookings can be updated');
      }

      if (updateData.check_in_date || updateData.check_out_date) {
        const newCheckIn = updateData.check_in_date || booking.check_in_date;
        const newCheckOut = updateData.check_out_date || booking.check_out_date;
        
        if (new Date(newCheckOut) <= new Date(newCheckIn)) {
          throw new BadRequestError('Check-out date must be after check-in date');
        }

        const isAvailable = await Booking.checkAvailability(
          booking.room_id, 
          newCheckIn, 
          newCheckOut, 
          booking.id
        );
        
        if (!isAvailable) {
          throw new ConflictError('Room is not available for the new dates');
        }

        if (newCheckIn !== booking.check_in_date || newCheckOut !== booking.check_out_date) {
          const room = await Room.findByPk(booking.room_id, {
            include: [{ model: RoomType, as: 'roomType' }]
          });
          
          const nights = this.calculateNights(newCheckIn, newCheckOut);
          const pricing = vipService.calculateVipPricing(
            room.roomType.base_price,
            nights,
            booking.client
          );
          
          updateData.original_price = pricing.original_price;
          updateData.total_price = pricing.total_price;
        }
      }

      await booking.update(updateData, { transaction });
      await transaction.commit();

      console.log(`✅ Booking updated: ${uuid}`);
      
      return await this.getBookingByUuid(uuid);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getClientBookings(clientId, filters = {}) {
    const { status, limit = 10, offset = 0 } = filters;
    
    const whereClause = { client_id: clientId };
    if (status) {
      whereClause.status = status;
    }

    const bookings = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Room,
          as: 'room',
          include: [
            {
              model: RoomType,
              as: 'roomType',
              attributes: ['name', 'amenities']
            },
            {
              model: Hotel,
              as: 'hotel',
              attributes: ['name', 'address']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return {
      bookings: bookings.rows,
      total: bookings.count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(bookings.count / limit)
    };
  }

  /**
   * Get available rooms - исправлена проблема с датами
   */
  async getAvailableRooms(hotelId, checkIn, checkOut, filters = {}) {
    try {
      const { guest_count, room_type_id, max_price } = filters;
      
      // Форматируем даты правильно для PostgreSQL
      const checkInFormatted = new Date(checkIn).toISOString().split('T')[0];
      const checkOutFormatted = new Date(checkOut).toISOString().split('T')[0];
      
      const roomWhere = {
        hotel_id: hotelId,
        status: 'available'
      };
      
      if (room_type_id) {
        roomWhere.room_type_id = room_type_id;
      }

      const roomTypeWhere = {};
      if (guest_count) {
        roomTypeWhere.max_occupancy = { [sequelize.Sequelize.Op.gte]: guest_count };
      }
      if (max_price) {
        roomTypeWhere.base_price = { [sequelize.Sequelize.Op.lte]: max_price };
      }

      const availableRooms = await Room.findAll({
        where: {
          ...roomWhere,
          id: {
            [sequelize.Sequelize.Op.notIn]: sequelize.literal(`(
              SELECT DISTINCT room_id 
              FROM bookings 
              WHERE status = 'active'
              AND (
                (check_in_date < '${checkOutFormatted}' AND check_out_date > '${checkInFormatted}')
              )
            )`)
          }
        },
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
        order: [['room_number', 'ASC']]
      });

      const nights = this.calculateNights(checkIn, checkOut);
      
      return availableRooms.map(room => {
        const pricing = Booking.calculatePrice(room.roomType.base_price, nights);
        
        return {
          ...room.toJSON(),
          pricing: {
            ...pricing,
            nights,
            price_per_night: parseFloat(room.roomType.base_price)
          }
        };
      });

    } catch (error) {
      console.error('❌ Error getting available rooms:', error.message);
      throw error;
    }
  }

  async getBookingStats(filters = {}) {
    try {
      const { hotel_id, date_from, date_to } = filters;
      
      const whereClause = {};
      if (hotel_id) {
        whereClause['$room.hotel_id$'] = hotel_id;
      }
      if (date_from && date_to) {
        whereClause.check_in_date = {
          [sequelize.Sequelize.Op.between]: [date_from, date_to]
        };
      }

      const [totalBookings, activeBookings, cancelledBookings, completedBookings, vipBookings, totalRevenue] = await Promise.all([
        Booking.count({
          where: whereClause,
          include: hotel_id ? [{ model: Room, as: 'room', attributes: [] }] : []
        }),
        
        Booking.count({
          where: { ...whereClause, status: 'active' },
          include: hotel_id ? [{ model: Room, as: 'room', attributes: [] }] : []
        }),
        
        Booking.count({
          where: { ...whereClause, status: 'cancelled' },
          include: hotel_id ? [{ model: Room, as: 'room', attributes: [] }] : []
        }),
        
        Booking.count({
          where: { ...whereClause, status: 'completed' },
          include: hotel_id ? [{ model: Room, as: 'room', attributes: [] }] : []
        }),
        
        Booking.count({
          where: { ...whereClause, vip_discount_applied: { [sequelize.Sequelize.Op.gt]: 0 } },
          include: hotel_id ? [{ model: Room, as: 'room', attributes: [] }] : []
        }),
        
        Booking.sum('total_price', {
          where: { ...whereClause, status: { [sequelize.Sequelize.Op.in]: ['active', 'completed'] } },
          include: hotel_id ? [{ model: Room, as: 'room', attributes: [] }] : []
        })
      ]);

      return {
        total_bookings: totalBookings,
        active_bookings: activeBookings,
        cancelled_bookings: cancelledBookings,
        completed_bookings: completedBookings,
        vip_bookings: vipBookings,
        total_revenue: parseFloat(totalRevenue || 0),
        cancellation_rate: totalBookings > 0 ? (cancelledBookings / totalBookings * 100).toFixed(2) : 0,
        vip_rate: totalBookings > 0 ? (vipBookings / totalBookings * 100).toFixed(2) : 0
      };

    } catch (error) {
      console.error('❌ Error getting booking stats:', error.message);
      throw error;
    }
  }

  calculateNights(checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  canModifyBooking(booking) {
    if (booking.status !== 'active') return false;
    
    const now = new Date();
    const checkIn = new Date(booking.check_in_date);
    const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);
    
    return hoursUntilCheckIn > 24;
  }

  async processAutomaticUpdates() {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const completedResult = await Booking.update(
        { status: 'completed' },
        {
          where: {
            status: 'active',
            check_out_date: { [sequelize.Sequelize.Op.lt]: today }
          }
        }
      );

      console.log(`✅ Marked ${completedResult[0]} bookings as completed`);
      
      return {
        completed: completedResult[0],
        success: true
      };

    } catch (error) {
      console.error('❌ Error processing automatic updates:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const bookingService = new BookingService();

module.exports = bookingService;
