const { ValidationError: SequelizeValidationError, DatabaseError, ForeignKeyConstraintError, UniqueConstraintError } = require('sequelize');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class CustomValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 422);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Sequelize validation errors
  if (err instanceof SequelizeValidationError) {
    const message = err.errors.map(e => e.message).join(', ');
    error = new BadRequestError(`Validation Error: ${message}`);
  }

  // Sequelize unique constraint errors
  if (err instanceof UniqueConstraintError) {
    const field = err.errors[0]?.path || 'field';
    error = new ConflictError(`Duplicate value for ${field}`);
  }

  // Sequelize foreign key constraint errors
  if (err instanceof ForeignKeyConstraintError) {
    error = new BadRequestError('Invalid reference to related resource');
  }

  // Sequelize database errors
  if (err instanceof DatabaseError) {
    error = new AppError('Database error occurred', 500);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new BadRequestError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new BadRequestError('Token expired');
  }

  // Cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    error = new BadRequestError('Invalid resource ID');
  }

  // Duplicate booking error (custom handling)
  if (err.message && err.message.includes('bookings_no_overlap_idx')) {
    error = new ConflictError('Room is already booked for the selected dates');
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = new AppError('Too many requests, please try again later', 429);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err 
      })
    }
  });
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  NotFoundError,
  BadRequestError,
  ConflictError,
  ValidationError: CustomValidationError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
