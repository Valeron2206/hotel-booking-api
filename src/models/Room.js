const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Room = sequelize.define('Room', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'hotels',
        key: 'id'
      }
    },
    room_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'room_types',
        key: 'id'
      }
    },
    room_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 20]
      }
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 200
      }
    },
    status: {
      type: DataTypes.ENUM('available', 'maintenance', 'out_of_order'),
      allowNull: false,
      defaultValue: 'available'
    }
  }, {
    tableName: 'rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['hotel_id', 'room_number']
      },
      {
        fields: ['hotel_id', 'status']
      },
      {
        fields: ['room_type_id']
      }
    ],
    hooks: {
      beforeValidate: (room) => {
        if (room.room_number) {
          room.room_number = room.room_number.trim().toUpperCase();
        }
      }
    }
  });

  // Instance methods
  Room.prototype.isAvailable = function() {
    return this.status === 'available';
  };

  Room.prototype.isInMaintenance = function() {
    return this.status === 'maintenance';
  };

  Room.prototype.isOutOfOrder = function() {
    return this.status === 'out_of_order';
  };

  // Class methods
  Room.findAvailableRooms = async function(hotelId, checkIn, checkOut, options = {}) {
    const { Op } = require('sequelize');
    
    return await this.findAll({
      where: {
        hotel_id: hotelId,
        status: 'available'
      },
      include: [
        {
          model: sequelize.models.RoomType,
          as: 'roomType',
          attributes: ['id', 'name', 'description', 'base_price', 'max_occupancy', 'amenities']
        },
        {
          model: sequelize.models.Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        }
      ],
      where: {
        [Op.and]: [
          { hotel_id: hotelId },
          { status: 'available' },
          {
            id: {
              [Op.notIn]: sequelize.literal(`(
                SELECT DISTINCT room_id 
                FROM bookings 
                WHERE status = 'active'
                AND (
                  (check_in_date < '${checkOut}' AND check_out_date > '${checkIn}')
                )
              )`)
            }
          }
        ]
      },
      ...options
    });
  };

  return Room;
};
