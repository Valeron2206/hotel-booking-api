const Joi = require('joi');
const { BadRequestError } = require('./errorHandler');

// Validation schemas
const schemas = {
  // Room availability query
  roomAvailability: Joi.object({
    hotel_id: Joi.number().integer().positive().required(),
    check_in_date: Joi.date().iso().min('now').required()
      .messages({
        'date.min': 'Check-in date must be in the future'
      }),
    check_out_date: Joi.date().iso().min(Joi.ref('check_in_date')).required()
      .messages({
        'date.min': 'Check-out date must be after check-in date'
      }),
    guest_count: Joi.number().integer().min(1).max(20).default(1),
    room_type_id: Joi.number().integer().positive().optional()
  }),

  // Create booking
  createBooking: Joi.object({
    client_info: Joi.object({
      first_name: Joi.string().trim().min(1).max(100).required()
        .pattern(/^[a-zA-Z\s]+$/)
        .messages({
          'string.pattern.base': 'First name can only contain letters and spaces'
        }),
      last_name: Joi.string().trim().min(1).max(100).required()
        .pattern(/^[a-zA-Z\s]+$/)
        .messages({
          'string.pattern.base': 'Last name can only contain letters and spaces'
        }),
      email: Joi.string().email().required().lowercase(),
      phone: Joi.string().pattern(/^[+]?[0-9\s\-\(\)]{7,20}$/).optional()
        .messages({
          'string.pattern.base': 'Invalid phone number format'
        })
    }).required(),
    room_id: Joi.number().integer().positive().required(),
    check_in_date: Joi.date().iso().min('now').required()
      .messages({
        'date.min': 'Check-in date must be in the future'
      }),
    check_out_date: Joi.date().iso().min(Joi.ref('check_in_date')).required()
      .messages({
        'date.min': 'Check-out date must be after check-in date'
      }),
    guest_count: Joi.number().integer().min(1).max(20).default(1),
    special_requests: Joi.string().max(1000).optional().allow('')
  }),

  // Update booking
  updateBooking: Joi.object({
    check_in_date: Joi.date().iso().min('now').optional()
      .messages({
        'date.min': 'Check-in date must be in the future'
      }),
    check_out_date: Joi.date().iso().min(Joi.ref('check_in_date')).optional()
      .messages({
        'date.min': 'Check-out date must be after check-in date'
      }),
    guest_count: Joi.number().integer().min(1).max(20).optional(),
    special_requests: Joi.string().max(1000).optional().allow('')
  }).min(1),

  // Cancel booking
  cancelBooking: Joi.object({
    reason: Joi.string().max(500).optional().allow('')
  }),

  // Create/update client
  client: Joi.object({
    first_name: Joi.string().trim().min(1).max(100).required()
      .pattern(/^[a-zA-Z\s]+$/)
      .messages({
        'string.pattern.base': 'First name can only contain letters and spaces'
      }),
    last_name: Joi.string().trim().min(1).max(100).required()
      .pattern(/^[a-zA-Z\s]+$/)
      .messages({
        'string.pattern.base': 'Last name can only contain letters and spaces'
      }),
    email: Joi.string().email().required().lowercase(),
    phone: Joi.string().pattern(/^[+]?[0-9\s\-\(\)]{7,20}$/).optional()
      .messages({
        'string.pattern.base': 'Invalid phone number format'
      })
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('created_at', 'updated_at', 'name', 'price', 'check_in_date').default('created_at'),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC')
  }),

  // Room filters
  roomFilters: Joi.object({
    hotel_id: Joi.number().integer().positive().required(),
    room_type_id: Joi.number().integer().positive().optional(),
    status: Joi.string().valid('available', 'maintenance', 'out_of_order').optional(),
    floor: Joi.number().integer().min(0).optional(),
    max_price: Joi.number().positive().optional(),
    min_price: Joi.number().positive().optional()
  }),

  // Booking filters
  bookingFilters: Joi.object({
    client_id: Joi.number().integer().positive().optional(),
    room_id: Joi.number().integer().positive().optional(),
    status: Joi.string().valid('active', 'cancelled', 'completed').optional(),
    check_in_from: Joi.date().iso().optional(),
    check_in_to: Joi.date().iso().min(Joi.ref('check_in_from')).optional(),
    vip_only: Joi.boolean().optional()
  })
};

// Generic validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : req.body;
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return next(new BadRequestError(`Validation failed: ${errors.map(e => e.message).join(', ')}`));
    }

    if (source === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};

// Specific validation middlewares
const validateRoomAvailability = validate(schemas.roomAvailability, 'query');
const validateCreateBooking = validate(schemas.createBooking);
const validateUpdateBooking = validate(schemas.updateBooking);
const validateCancelBooking = validate(schemas.cancelBooking);
const validateClient = validate(schemas.client);
const validatePagination = validate(schemas.pagination, 'query');
const validateRoomFilters = validate(schemas.roomFilters, 'query');
const validateBookingFilters = validate(schemas.bookingFilters, 'query');

// Parameter validation
const validateParams = (paramSchema) => {
  return (req, res, next) => {
    const { error, value } = paramSchema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      return next(new BadRequestError(`Invalid parameters: ${error.details.map(d => d.message).join(', ')}`));
    }

    req.params = value;
    next();
  };
};

// Common parameter schemas
const paramSchemas = {
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  }),
  hotelId: Joi.object({
    hotelId: Joi.number().integer().positive().required()
  }),
  bookingUuid: Joi.object({
    bookingUuid: Joi.string().uuid().required()
  }),
  roomId: Joi.object({
    roomId: Joi.number().integer().positive().required()
  })
};

module.exports = {
  validate,
  validateRoomAvailability,
  validateCreateBooking,
  validateUpdateBooking,
  validateCancelBooking,
  validateClient,
  validatePagination,
  validateRoomFilters,
  validateBookingFilters,
  validateParams,
  paramSchemas,
  schemas
};
