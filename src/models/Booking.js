const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    booking_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => uuidv4()
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rooms',
        key: 'id'
      }
    },
    check_in_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterToday(value) {
          if (new Date(value) <= new Date()) {
            throw new Error('Check-in date must be in the future');
          }
        }
      }
    },
    check_out_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterCheckIn(value) {
          if (new Date(value) <= new Date(this.check_in_date)) {
            throw new Error('Check-out date must be after check-in date');
          }
        }
      }
    },
    guest_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 20
      }
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true
      }
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        isDecimal: true
      }
    },
    vip_discount_applied: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100,
        isDecimal: true
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'completed'),
      allowNull: false,
      defaultValue: 'active'
    },
    special_requests: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    booking_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'bookings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['booking_uuid']
      },
      {
        fields: ['client_id']
      },
      {
        fields: ['room_id']
      },
      {
        fields: ['check_in_date', 'check_out_date']
      },
      {
        fields: ['status']
      },
      // Partial unique index to prevent overlapping bookings
      {
        unique: true,
        fields: ['room_id', 'check_in_date', 'check_out_date'],
        where: {
          status: 'active'
        },
        name: 'bookings_no_overlap_idx'
      }
    ],
    hooks: {
      beforeValidate: (booking) => {
        // Format prices
        if (booking.total_price && typeof booking.total_price === 'string') {
          booking.total_price = parseFloat(booking.total_price);
        }
        if (booking.original_price && typeof booking.original_price === 'string') {
          booking.original_price = parseFloat(booking.original_price);
        }
        if (booking.vip_discount_applied && typeof booking.vip_discount_applied === 'string') {
          booking.vip_discount_applied = parseFloat(booking.vip_discount_applied);
        }
      },
      beforeUpdate: (booking) => {
        // Set cancellation timestamp when status changes to cancelled
        if (booking.changed('status') && booking.status === 'cancelled' && !booking.cancelled_at) {
          booking.cancelled_at = new Date();
        }
      }
    },
    validate: {
      checkDateOrder() {
        if (new Date(this.check_out_date) <= new Date(this.check_in_date)) {
          throw new Error('Check-out date must be after check-in date');
        }
      },
      checkTotalPrice() {
        if (this.total_price > this.original_price) {
          throw new Error('Total price cannot be greater than original price');
        }
      }
    }
  });

  // Instance methods
  Booking.prototype.getDurationInNights = function() {
    const checkIn = new Date(this.check_in_date);
    const checkOut = new Date(this.check_out_date);
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  };

  Booking.prototype.getSavingsAmount = function() {
    return parseFloat(this.original_price) - parseFloat(this.total_price);
  };

  Booking.prototype.canBeCancelled = function() {
    if (this.status !== 'active') return false;
    
    const now = new Date();
    const checkIn = new Date(this.check_in_date);
    const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);
    
    // Can cancel if more than 24 hours before check-in
    return hoursUntilCheckIn > 24;
  };

  Booking.prototype.cancel = async function(reason = null) {
    if (!this.canBeCancelled()) {
      throw new Error('Booking cannot be cancelled at this time');
    }
    
    this.status = 'cancelled';
    this.cancelled_at = new Date();
    this.cancellation_reason = reason;
    
    return await this.save();
  };

  Booking.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Add computed fields
    values.duration_nights = this.getDurationInNights();
    values.savings_amount = this.getSavingsAmount();
    values.can_be_cancelled = this.canBeCancelled();
    
    // Format prices
    if (values.total_price) values.total_price = parseFloat(values.total_price);
    if (values.original_price) values.original_price = parseFloat(values.original_price);
    if (values.vip_discount_applied) values.vip_discount_applied = parseFloat(values.vip_discount_applied);
    
    return values;
  };

  // Class methods
  Booking.findByUuid = async function(uuid) {
    return await this.findOne({
      where: { booking_uuid: uuid },
      include: [
        {
          model: sequelize.models.Client,
          as: 'client',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'is_vip', 'vip_tier']
        },
        {
          model: sequelize.models.Room,
          as: 'room',
          include: [
            {
              model: sequelize.models.RoomType,
              as: 'roomType',
              attributes: ['name', 'description', 'amenities']
            },
            {
              model: sequelize.models.Hotel,
              as: 'hotel',
              attributes: ['name', 'address', 'phone']
            }
          ]
        }
      ]
    });
  };

  Booking.checkAvailability = async function(roomId, checkIn, checkOut, excludeBookingId = null) {
    const { Op } = require('sequelize');
    
    const whereClause = {
      room_id: roomId,
      status: 'active',
      [Op.or]: [
        {
          check_in_date: {
            [Op.lt]: checkOut
          },
          check_out_date: {
            [Op.gt]: checkIn
          }
        }
      ]
    };
    
    if (excludeBookingId) {
      whereClause.id = { [Op.ne]: excludeBookingId };
    }
    
    const conflictingBookings = await this.findAll({
      where: whereClause
    });
    
    return conflictingBookings.length === 0;
  };

  Booking.calculatePrice = function(basePrice, nights, vipDiscount = 0) {
    const originalPrice = basePrice * nights;
    const totalPrice = originalPrice * (100 - vipDiscount) / 100;
    
    return {
      original_price: parseFloat(originalPrice.toFixed(2)),
      total_price: parseFloat(totalPrice.toFixed(2)),
      vip_discount_applied: vipDiscount
    };
  };

  return Booking;
};
