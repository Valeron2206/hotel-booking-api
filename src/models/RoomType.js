const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RoomType = sequelize.define('RoomType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        isDecimal: true
      }
    },
    max_occupancy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 20
      }
    },
    amenities: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidAmenities(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Amenities must be an array');
          }
        }
      }
    }
  }, {
    tableName: 'room_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeValidate: (roomType) => {
        if (roomType.name) {
          roomType.name = roomType.name.trim();
        }
        if (roomType.base_price && typeof roomType.base_price === 'string') {
          roomType.base_price = parseFloat(roomType.base_price);
        }
      }
    }
  });

  // Instance methods
  RoomType.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Format price for display
    if (values.base_price) {
      values.base_price = parseFloat(values.base_price);
    }
    
    return values;
  };

  return RoomType;
};
