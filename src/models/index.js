const { sequelize } = require('../config/database');
const Hotel = require('./Hotel');
const RoomType = require('./RoomType');
const Room = require('./Room');
const Client = require('./Client');
const Booking = require('./Booking');

// Initialize models
const models = {
  Hotel: Hotel(sequelize),
  RoomType: RoomType(sequelize),
  Room: Room(sequelize),
  Client: Client(sequelize),
  Booking: Booking(sequelize)
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Set up associations
const { Hotel: HotelModel, RoomType: RoomTypeModel, Room: RoomModel, Client: ClientModel, Booking: BookingModel } = models;

// Hotel has many Rooms
HotelModel.hasMany(RoomModel, { 
  foreignKey: 'hotel_id', 
  as: 'rooms' 
});
RoomModel.belongsTo(HotelModel, { 
  foreignKey: 'hotel_id', 
  as: 'hotel' 
});

// RoomType has many Rooms
RoomTypeModel.hasMany(RoomModel, { 
  foreignKey: 'room_type_id', 
  as: 'rooms' 
});
RoomModel.belongsTo(RoomTypeModel, { 
  foreignKey: 'room_type_id', 
  as: 'roomType' 
});

// Client has many Bookings
ClientModel.hasMany(BookingModel, { 
  foreignKey: 'client_id', 
  as: 'bookings' 
});
BookingModel.belongsTo(ClientModel, { 
  foreignKey: 'client_id', 
  as: 'client' 
});

// Room has many Bookings
RoomModel.hasMany(BookingModel, { 
  foreignKey: 'room_id', 
  as: 'bookings' 
});
BookingModel.belongsTo(RoomModel, { 
  foreignKey: 'room_id', 
  as: 'room' 
});

module.exports = {
  sequelize,
  Hotel: HotelModel,
  RoomType: RoomTypeModel,
  Room: RoomModel,
  Client: ClientModel,
  Booking: BookingModel
};
