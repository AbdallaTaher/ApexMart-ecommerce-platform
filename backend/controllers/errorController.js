const AppError = require('../utils/appError');

/**
 * Transforms Mongoose CastError (e.g. invalid ObjectId) into an operational AppError
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

/**
 * Transforms MongoDB duplicate key error (code 11000) into an operational AppError
 */
const handleDuplicateFieldsDB = (err) => {
  let value = '';
  if (err.keyValue) {
    const keys = Object.keys(err.keyValue);
    value = `${keys.join(', ')}: ${Object.values(err.keyValue).join(', ')}`;
  } else if (err.errmsg) {
    const match = err.errmsg.match(/(["'])(\\?.)*?\1/);
    value = match ? match[0] : 'unknown';
  } else {
    value = 'Duplicate value';
  }

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * Transforms Mongoose Schema ValidationError into an operational AppError
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Transforms JsonWebTokenError into an operational AppError
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

/**
 * Transforms TokenExpiredError into an operational AppError
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

/**
 * Sends detailed error feedback in development mode
 */
const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * Sends sanitized, operational error feedback in production mode
 */
const sendErrorProd = (err, req, res) => {
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // B) Programming or unknown error: don't leak implementation details
  // 1) Log error for system administrator investigation
  console.error('ERROR 💥 [NON-OPERATIONAL BUG]:', err);

  // 2) Send generic response
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};

/**
 * Global 4-argument Express error-handling middleware
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;
    error.name = err.name;
    error.code = err.code;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
