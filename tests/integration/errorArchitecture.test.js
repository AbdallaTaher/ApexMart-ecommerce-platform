import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
const request = require('supertest');
const express = require('express');
const app = require('../../backend/app');
const AppError = require('../../backend/utils/appError');
const globalErrorHandler = require('../../backend/controllers/errorController');

describe('Backend App & Global Error Architecture Integration Tests', () => {
  it('GET /api/v1/health should respond with 200 OK and health metadata', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toContain('ApexMart E-Commerce API is running');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/v1/undefined-endpoint should trigger 404 unhandled route error', async () => {
    const res = await request(app).get('/api/v1/undefined-endpoint');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toBe(
      "Can't find /api/v1/undefined-endpoint on this server!"
    );
  });

  describe('Error Controller & Production Sanitization', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should format detailed error response including stack trace in development', async () => {
      process.env.NODE_ENV = 'development';

      const testApp = express();
      testApp.get('/test-error', (req, res, next) => {
        next(new AppError('Custom developer operational error', 400));
      });
      testApp.use(globalErrorHandler);

      const res = await request(testApp).get('/test-error');

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Custom developer operational error');
      expect(res.body.stack).toBeDefined();
      expect(res.body.error).toBeDefined();
    });

    it('should sanitize error in production and hide stack trace for operational errors', async () => {
      process.env.NODE_ENV = 'production';

      const testApp = express();
      testApp.get('/test-operational', (req, res, next) => {
        next(new AppError('Clean customer-facing error message', 403));
      });
      testApp.use(globalErrorHandler);

      const res = await request(testApp).get('/test-operational');

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Clean customer-facing error message');
      expect(res.body.stack).toBeUndefined();
      expect(res.body.error).toBeUndefined();
    });

    it('should disguise non-operational unexpected bugs as generic 500 error in production', async () => {
      process.env.NODE_ENV = 'production';

      // Suppress console.error in test output for clean reporting
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const testApp = express();
      testApp.get('/test-bug', (req, res, next) => {
        // Unexpected programming error without isOperational flag
        next(new Error('Syntax or database corruption'));
      });
      testApp.use(globalErrorHandler);

      const res = await request(testApp).get('/test-bug');

      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Something went very wrong!');
      expect(res.body.stack).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it('should transform MongoDB CastError into 400 Bad Request in production', async () => {
      process.env.NODE_ENV = 'production';

      const testApp = express();
      testApp.get('/test-cast-error', (req, res, next) => {
        const castErr = new Error('Cast to ObjectId failed for value "invalid"');
        castErr.name = 'CastError';
        castErr.path = '_id';
        castErr.value = 'invalid';
        next(castErr);
      });
      testApp.use(globalErrorHandler);

      const res = await request(testApp).get('/test-cast-error');

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Invalid _id: invalid.');
    });

    it('should transform MongoDB Duplicate Key error (11000) into 400 Bad Request', async () => {
      process.env.NODE_ENV = 'production';

      const testApp = express();
      testApp.get('/test-duplicate', (req, res, next) => {
        const dupErr = new Error('E11000 duplicate key error');
        dupErr.code = 11000;
        dupErr.keyValue = { email: 'buyer@apexmart.com' };
        next(dupErr);
      });
      testApp.use(globalErrorHandler);

      const res = await request(testApp).get('/test-duplicate');

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Duplicate field value: email: buyer@apexmart.com');
    });

    it('should transform Mongoose ValidationError into 400 Bad Request', async () => {
      process.env.NODE_ENV = 'production';

      const testApp = express();
      testApp.get('/test-validation', (req, res, next) => {
        const valErr = new Error('Validation failed');
        valErr.name = 'ValidationError';
        valErr.errors = {
          price: { message: 'A product must have a price' },
          name: { message: 'A product must have a name' },
        };
        next(valErr);
      });
      testApp.use(globalErrorHandler);

      const res = await request(testApp).get('/test-validation');

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Invalid input data');
      expect(res.body.message).toContain('A product must have a price');
      expect(res.body.message).toContain('A product must have a name');
    });

    it('should transform JWT errors into 401 Unauthorized in production', async () => {
      process.env.NODE_ENV = 'production';

      const testApp = express();
      testApp.get('/test-jwt', (req, res, next) => {
        const jwtErr = new Error('jwt malformed');
        jwtErr.name = 'JsonWebTokenError';
        next(jwtErr);
      });
      testApp.get('/test-jwt-expired', (req, res, next) => {
        const expErr = new Error('jwt expired');
        expErr.name = 'TokenExpiredError';
        next(expErr);
      });
      testApp.use(globalErrorHandler);

      const res1 = await request(testApp).get('/test-jwt');
      expect(res1.statusCode).toBe(401);
      expect(res1.body.message).toBe('Invalid token. Please log in again!');

      const res2 = await request(testApp).get('/test-jwt-expired');
      expect(res2.statusCode).toBe(401);
      expect(res2.body.message).toBe('Your token has expired! Please log in again.');
    });
  });
});
