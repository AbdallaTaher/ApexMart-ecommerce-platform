import { describe, it, expect, vi, beforeEach } from 'vitest';
const jwt = require('jsonwebtoken');
const authController = require('../../backend/controllers/authController');
const User = require('../../backend/models/userModel');

describe('Auth Middleware Unit Tests (protect & restrictTo)', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-ultra-secure-jwt-secret-key-32-chars';
  });

  describe('protect Middleware', () => {
    it('should reject with 401 if no authorization header or cookie is present', async () => {
      const req = { headers: {}, cookies: {} };
      const res = { locals: {} };
      const next = vi.fn();

      await authController.protect(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('You are not logged in');
    });

    it('should reject with 401 if the user belonging to the token no longer exists', async () => {
      const token = jwt.sign({ id: '64b1f2e9a34b2c1234567890' }, process.env.JWT_SECRET);
      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      };
      const res = { locals: {} };
      const next = vi.fn();

      vi.spyOn(User, 'findById').mockResolvedValue(null);

      await authController.protect(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('belonging to this token no longer exists');

      User.findById.mockRestore();
    });

    it('should attach user to req.user and call next() on valid token', async () => {
      const mockUser = {
        _id: '64b1f2e9a34b2c1234567890',
        name: 'Apex Buyer',
        email: 'buyer@apexmart.com',
        role: 'user',
        changedPasswordAfter: vi.fn().mockReturnValue(false),
      };

      const token = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET);
      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      };
      const res = { locals: {} };
      const next = vi.fn();

      vi.spyOn(User, 'findById').mockResolvedValue(mockUser);

      await authController.protect(req, res, next);

      expect(req.user).toBe(mockUser);
      expect(res.locals.user).toBe(mockUser);
      expect(next).toHaveBeenCalledWith();

      User.findById.mockRestore();
    });
  });

  describe('restrictTo Middleware', () => {
    it('should reject with 403 if user role is not authorized', () => {
      const req = { user: { role: 'user' } };
      const res = {};
      const next = vi.fn();

      const middleware = authController.restrictTo('admin', 'seller');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('do not have permission');
    });

    it('should grant access and call next() if user role is permitted', () => {
      const req = { user: { role: 'admin' } };
      const res = {};
      const next = vi.fn();

      const middleware = authController.restrictTo('admin', 'seller');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
