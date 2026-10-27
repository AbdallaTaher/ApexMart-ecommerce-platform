import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../backend/app');
const User = require('../../backend/models/userModel');

describe('Password Recovery & Profile Management Integration Suite (Task 07)', () => {
  const TEST_JWT_SECRET = 'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.JWT_EXPIRES_IN = '7d';
    process.env.JWT_COOKIE_EXPIRES_IN = '7';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockQuery = (resolvedValue) => {
    const promise = Promise.resolve(resolvedValue);
    promise.find = vi.fn().mockReturnValue(promise);
    promise.lean = vi.fn().mockResolvedValue(resolvedValue);
    promise.populate = vi.fn().mockReturnValue(promise);
    promise.select = vi.fn().mockReturnValue(promise);
    promise.sort = vi.fn().mockReturnValue(promise);
    promise.skip = vi.fn().mockReturnValue(promise);
    promise.limit = vi.fn().mockReturnValue(promise);
    return promise;
  };

  const signTestToken = (userId) => {
    return jwt.sign(
      { id: userId, iat: Math.floor(Date.now() / 1000) - 10 },
      TEST_JWT_SECRET,
      { expiresIn: '7d' }
    );
  };

  // =========================================================================
  // 1. FORGOT PASSWORD (POST /api/v1/users/forgotPassword)
  // =========================================================================
  describe('POST /api/v1/users/forgotPassword', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/v1/users/forgotPassword')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Please provide your email address');
    });

    it('should return 404 if no user is found with that email', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/users/forgotPassword')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('There is no registered account');
    });

    it('should generate reset token and return 200 on valid email', async () => {
      const mockUser = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d1',
        id: '65f1a1b2c3d4e5f6a7b8c9d1',
        name: 'Test Buyer',
        email: 'buyer@example.com',
        createPasswordResetToken: vi.fn().mockReturnValue('mock-reset-token-hex'),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/users/forgotPassword')
        .send({ email: 'buyer@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Password reset link sent');
      expect(mockUser.createPasswordResetToken).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    });
  });

  // =========================================================================
  // 2. RESET PASSWORD (PATCH /api/v1/users/resetPassword/:token)
  // =========================================================================
  describe('PATCH /api/v1/users/resetPassword/:token', () => {
    it('should return 400 if reset token is invalid or expired', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/v1/users/resetPassword/invalid-or-expired-token')
        .send({
          password: 'NewPassword123!',
          passwordConfirm: 'NewPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Token is invalid or has expired');
    });

    it('should return 400 if password or passwordConfirm are missing', async () => {
      const mockUser = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d1',
        id: '65f1a1b2c3d4e5f6a7b8c9d1',
      };
      vi.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const res = await request(app)
        .patch('/api/v1/users/resetPassword/valid-token')
        .send({ password: 'NewPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Please provide password and passwordConfirm');
    });

    it('should successfully reset password, issue JWT cookie, and return 200', async () => {
      const mockUser = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d1',
        id: '65f1a1b2c3d4e5f6a7b8c9d1',
        name: 'Test Buyer',
        email: 'buyer@example.com',
        role: 'user',
        save: vi.fn().mockImplementation(function () {
          // password gets saved
          return Promise.resolve(this);
        }),
      };
      vi.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      const res = await request(app)
        .patch('/api/v1/users/resetPassword/valid-token-123')
        .send({
          password: 'NewStrongPassword123!',
          passwordConfirm: 'NewStrongPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.passwordResetToken).toBeUndefined();
      expect(mockUser.passwordResetExpires).toBeUndefined();

      // Check cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith('jwt='))).toBe(true);
    });
  });

  // =========================================================================
  // 3. UPDATE PASSWORD (PATCH /api/v1/users/updateMyPassword)
  // =========================================================================
  describe('PATCH /api/v1/users/updateMyPassword', () => {
    const userId = '65f1a1b2c3d4e5f6a7b8c9d2';

    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .patch('/api/v1/users/updateMyPassword')
        .send({
          passwordCurrent: 'OldPass123!',
          password: 'NewPass123!',
          passwordConfirm: 'NewPass123!',
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 if current password is missing', async () => {
      const token = signTestToken(userId);
      const mockUser = {
        _id: userId,
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        changedPasswordAfter: vi.fn().mockReturnValue(false),
      };
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .patch('/api/v1/users/updateMyPassword')
        .set('Cookie', [`jwt=${token}`])
        .send({
          password: 'NewPass123!',
          passwordConfirm: 'NewPass123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Please provide your current password');
    });

    it('should return 401 if current password is incorrect', async () => {
      const token = signTestToken(userId);
      const mockUser = {
        _id: userId,
        id: userId,
        password: 'hashed-password',
        role: 'user',
        changedPasswordAfter: vi.fn().mockReturnValue(false),
        correctPassword: vi.fn().mockResolvedValue(false),
      };

      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .patch('/api/v1/users/updateMyPassword')
        .set('Cookie', [`jwt=${token}`])
        .send({
          passwordCurrent: 'WrongCurrentPassword!',
          password: 'NewPass123!',
          passwordConfirm: 'NewPass123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Your current password is incorrect');
    });

    it('should successfully update password when current matches', async () => {
      const token = signTestToken(userId);
      const mockUser = {
        _id: userId,
        id: userId,
        name: 'Test Buyer',
        email: 'buyer@example.com',
        role: 'user',
        password: 'hashed-password',
        changedPasswordAfter: vi.fn().mockReturnValue(false),
        correctPassword: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .patch('/api/v1/users/updateMyPassword')
        .set('Cookie', [`jwt=${token}`])
        .send({
          passwordCurrent: 'CorrectCurrentPassword123!',
          password: 'BrandNewPassword123!',
          passwordConfirm: 'BrandNewPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. UPDATE ME (PATCH /api/v1/users/updateMe)
  // =========================================================================
  describe('PATCH /api/v1/users/updateMe', () => {
    const userId = '65f1a1b2c3d4e5f6a7b8c9d3';

    it('should return 400 if user attempts to update password via updateMe', async () => {
      const token = signTestToken(userId);
      const mockUser = {
        _id: userId,
        id: userId,
        role: 'user',
        changedPasswordAfter: vi.fn().mockReturnValue(false),
      };
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .patch('/api/v1/users/updateMe')
        .set('Cookie', [`jwt=${token}`])
        .send({ password: 'AttemptHackedPassword' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('This route is not for password updates');
    });

    it('should successfully update name and ignore forbidden fields like role', async () => {
      const token = signTestToken(userId);
      const mockUser = {
        _id: userId,
        id: userId,
        name: 'Original Name',
        email: 'original@example.com',
        role: 'user',
        changedPasswordAfter: vi.fn().mockReturnValue(false),
      };
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));

      const updatedUser = {
        _id: userId,
        id: userId,
        name: 'Updated Name',
        email: 'original@example.com',
        role: 'user',
      };
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue(updatedUser);

      const res = await request(app)
        .patch('/api/v1/users/updateMe')
        .set('Cookie', [`jwt=${token}`])
        .send({
          name: 'Updated Name',
          role: 'admin', // Attack attempt: escalate privilege
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.name).toBe('Updated Name');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { name: 'Updated Name' },
        { new: true, runValidators: true }
      );
    });
  });

  // =========================================================================
  // 5. DELETE ME (DELETE /api/v1/users/deleteMe)
  // =========================================================================
  describe('DELETE /api/v1/users/deleteMe', () => {
    const userId = '65f1a1b2c3d4e5f6a7b8c9d4';

    it('should successfully soft delete account (active: false) and return 204', async () => {
      const token = signTestToken(userId);
      const mockUser = {
        _id: userId,
        id: userId,
        role: 'user',
        changedPasswordAfter: vi.fn().mockReturnValue(false),
      };
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(mockUser));
      vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({ _id: userId, active: false });

      const res = await request(app)
        .delete('/api/v1/users/deleteMe')
        .set('Cookie', [`jwt=${token}`]);

      expect(res.status).toBe(204);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, { active: false });
    });
  });
});
