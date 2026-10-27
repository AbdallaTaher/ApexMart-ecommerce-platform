/**
 * Custom Operational Application Error Class
 * Distinguishes operational errors (expected runtime errors) from programming bugs.
 */
class AppError extends Error {
  /**
   * @param {string} message - Descriptive error message
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 500)
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
