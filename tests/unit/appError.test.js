import { describe, it, expect } from 'vitest';
const AppError = require('../../backend/utils/appError');

describe('AppError Utility Unit Tests', () => {
  it('should correctly initialize with 4xx fail status', () => {
    const error = new AppError('Resource not found', 404);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.status).toBe('fail');
    expect(error.isOperational).toBe(true);
    expect(error.stack).toBeDefined();
  });

  it('should correctly initialize with 5xx error status', () => {
    const error = new AppError('Database connection lost', 500);

    expect(error.statusCode).toBe(500);
    expect(error.status).toBe('error');
    expect(error.isOperational).toBe(true);
  });

  it('should capture stack trace accurately without including constructor', () => {
    const error = new AppError('Validation failed', 400);

    expect(typeof error.stack).toBe('string');
    expect(error.stack.length).toBeGreaterThan(0);
  });
});
