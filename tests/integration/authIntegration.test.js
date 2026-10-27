import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../backend/app');
const User = require('../../backend/models/userModel');
const sampleUsers = require('../fixtures/sampleUsers.json');

describe('Authentication & User Governance Integration Tests (Slice 1 - Task 05)', () => {
  const TEST_JWT_SECRET = 'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.JWT_EXPIRES_IN = '7d';
    process.env.JWT_COOKIE_EXPIRES_IN = '7';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper to construct chainable Mongoose mock query objects
   */
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

  /**
   * Helper to generate a signed JWT for testing
   */
  const signTestToken = (userId) => {
    return jwt.sign({ id: userId, iat: Math.floor(Date.now() / 1000) - 10 }, TEST_JWT_SECRET, {
      expiresIn: '7d',
    });
  };

  // =========================================================================
  // 1. SIGNUP ENDPOINT (POST /api/v1/users/signup)
  // =========================================================================
  describe('POST /api/v1/users/signup', () => {
    it('should successfully register a new user, return 201, set HttpOnly cookie and omit password', async () => {
      const mockCreatedUser = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d9',
        name: 'New Registered Buyer',
        email: 'newbuyer@example.com',
        role: 'user',
        password: 'hashed-password-string',
      };

      vi.spyOn(User, 'create').mockResolvedValue(mockCreatedUser);

      const res = await request(app)
        .post('/api/v1/users/signup')
        .send({
          name: 'New Registered Buyer',
          email: 'newbuyer@example.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.name).toBe('New Registered Buyer');
      expect(res.body.data.user.email).toBe('newbuyer@example.com');
      expect(res.body.data.user.password).toBeUndefined();

      // Verify Set-Cookie header for HttpOnly defense
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('jwt=') && c.includes('HttpOnly'))).toBe(true);
    });

    it('should prevent privilege escalation by overriding role admin to user during public signup', async () => {
      let passedUserArg = null;
      vi.spyOn(User, 'create').mockImplementation((data) => {
        passedUserArg = data;
        return Promise.resolve({
          _id: '65f1a1b2c3d4e5f6a7b8c9ea',
          ...data,
          role: data.role,
        });
      });

      const res = await request(app)
        .post('/api/v1/users/signup')
        .send({
          name: 'Privilege Escalation Attacker',
          email: 'attacker@example.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
          role: 'admin', // Malicious attempt to self-assign admin role
        });

      expect(res.statusCode).toBe(201);
      expect(passedUserArg.role).toBe('user'); // Enforces 'user' role
    });

    it('should allow valid seller role assignment during registration', async () => {
      let passedUserArg = null;
      vi.spyOn(User, 'create').mockImplementation((data) => {
        passedUserArg = data;
        return Promise.resolve({
          _id: '65f1a1b2c3d4e5f6a7b8c9eb',
          ...data,
        });
      });

      const res = await request(app)
        .post('/api/v1/users/signup')
        .send({
          name: 'Merchant Seller',
          email: 'seller@example.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
          role: 'seller',
        });

      expect(res.statusCode).toBe(201);
      expect(passedUserArg.role).toBe('seller');
    });

    it('should reject signup when passwordConfirm does not match password (400)', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        passwordConfirm: { message: 'Passwords do not match' },
      };
      vi.spyOn(User, 'create').mockRejectedValue(validationError);

      const res = await request(app)
        .post('/api/v1/users/signup')
        .send({
          name: 'Mismatch User',
          email: 'mismatch@example.com',
          password: 'Password123!',
          passwordConfirm: 'DifferentPassword123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Passwords do not match');
    });

    it('should reject signup with duplicate email (400 Duplicate Key)', async () => {
      const duplicateError = new Error('E11000 duplicate key error');
      duplicateError.code = 11000;
      duplicateError.keyValue = { email: 'existing@example.com' };
      vi.spyOn(User, 'create').mockRejectedValue(duplicateError);

      const res = await request(app)
        .post('/api/v1/users/signup')
        .send({
          name: 'Duplicate User',
          email: 'existing@example.com',
          password: 'Password123!',
          passwordConfirm: 'Password123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('Duplicate field value: email: existing@example.com');
    });

    it('should reject HTTP GET/PUT requests on /signup with 405 Method Not Allowed', async () => {
      const res = await request(app).get('/api/v1/users/signup');

      expect(res.statusCode).toBe(405);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('HTTP GET is not supported on /signup');
    });
  });

  // =========================================================================
  // 2. LOGIN ENDPOINT (POST /api/v1/users/login)
  // =========================================================================
  describe('POST /api/v1/users/login', () => {
    it('should successfully log in with valid credentials, returning 200, JWT and HttpOnly cookie', async () => {
      const mockUser = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d5',
        name: 'Alex Miller',
        email: 'alex.miller@example.com',
        role: 'user',
        password: '$2a$10$mockHashedPassword1234567890',
        correctPassword: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findOne').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'alex.miller@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe('alex.miller@example.com');
      expect(res.body.data.user.password).toBeUndefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('jwt=') && c.includes('HttpOnly'))).toBe(true);
    });

    it('should reject login when email or password is missing (400)', async () => {
      const res1 = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'alex.miller@example.com' });

      expect(res1.statusCode).toBe(400);
      expect(res1.body.message).toContain('Please provide email and password!');

      const res2 = await request(app)
        .post('/api/v1/users/login')
        .send({ password: 'Password123!' });

      expect(res2.statusCode).toBe(400);
      expect(res2.body.message).toContain('Please provide email and password!');
    });

    it('should reject login when email does not exist in DB (401)', async () => {
      vi.spyOn(User, 'findOne').mockImplementation(() => createMockQuery(null));

      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('should reject login when password does not match (401)', async () => {
      const mockUser = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d5',
        email: 'alex.miller@example.com',
        password: '$2a$10$mockHashedPassword1234567890',
        correctPassword: vi.fn().mockResolvedValue(false), // Password mismatch
      };

      vi.spyOn(User, 'findOne').mockImplementation(() => createMockQuery(mockUser));

      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'alex.miller@example.com',
          password: 'WrongPassword!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('should reject HTTP GET/PUT requests on /login with 405 Method Not Allowed', async () => {
      const res = await request(app).get('/api/v1/users/login');

      expect(res.statusCode).toBe(405);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('HTTP GET is not supported on /login');
    });
  });

  // =========================================================================
  // 3. LOGOUT ENDPOINT (GET /api/v1/users/logout)
  // =========================================================================
  describe('GET /api/v1/users/logout', () => {
    it('should overwrite jwt cookie with loggedout value and return 200 OK', async () => {
      const res = await request(app).get('/api/v1/users/logout');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('jwt=loggedout'))).toBe(true);
    });

    it('should update user lastLogoutAt in DB when logging out with a valid token', async () => {
      const token = signTestToken('65f1a1b2c3d4e5f6a7b8c9d5');
      const findByIdAndUpdateSpy = vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});

      const res = await request(app)
        .get('/api/v1/users/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(
        '65f1a1b2c3d4e5f6a7b8c9d5',
        expect.objectContaining({ lastLogoutAt: expect.any(Number) })
      );
    });
  });

  // =========================================================================
  // 4. PROTECTED USER PROFILE (GET /api/v1/users/me)
  // =========================================================================
  describe('GET /api/v1/users/me (protect middleware verification)', () => {
    const validUser = {
      _id: '65f1a1b2c3d4e5f6a7b8c9d5',
      id: '65f1a1b2c3d4e5f6a7b8c9d5',
      name: 'Alex Miller',
      email: 'alex.miller@example.com',
      role: 'user',
      changedPasswordAfter: vi.fn().mockReturnValue(false),
    };

    it('should grant access and return user profile when valid Bearer token is provided', async () => {
      const token = signTestToken(validUser._id);

      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(validUser));

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.name).toBe('Alex Miller');
      expect(res.body.data.data.email).toBe('alex.miller@example.com');
    });

    it('should grant access and return user profile when valid JWT is supplied via Cookie', async () => {
      const token = signTestToken(validUser._id);

      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(validUser));

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', [`jwt=${token}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.name).toBe('Alex Miller');
    });

    it('should reject with 401 Unauthorized when no token or cookie is supplied', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('You are not logged in!');
    });

    it('should reject with 401 Unauthorized when token is "loggedout"', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', ['jwt=loggedout']);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('You are not logged in!');
    });

    it('should reject with 401 when token has an invalid signature or is tampered', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-tampered-token-payload');

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Invalid token. Please log in again!');
    });

    it('should reject with 401 if user belonging to token no longer exists in DB', async () => {
      const token = signTestToken('65f1a1b2c3d4e5f6a7b8c9d5');

      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(null));

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('belonging to this token no longer exists');
    });

    it('should reject with 401 if user changed password after the token was issued', async () => {
      const token = signTestToken(validUser._id);

      const userWithChangedPassword = {
        ...validUser,
        changedPasswordAfter: vi.fn().mockReturnValue(true), // Password changed after token iat
      };

      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(userWithChangedPassword));

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('User recently changed password!');
    });

    it('should reject with 401 if user logged out after the token was issued (token revocation)', async () => {
      const token = signTestToken(validUser._id);

      const loggedOutUser = {
        ...validUser,
        loggedOutAfter: vi.fn().mockReturnValue(true), // Token revoked upon logout
      };

      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(loggedOutUser));

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('You have been logged out! Please log in again.');
    });
  });

  // =========================================================================
  // 5. ROLE-BASED ACCESS CONTROL (GET /api/v1/users)
  // =========================================================================
  describe('GET /api/v1/users (restrictTo role governance verification)', () => {
    it('should reject regular user (role: "user") with 403 Forbidden', async () => {
      const regularUser = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d5',
        role: 'user',
        changedPasswordAfter: vi.fn().mockReturnValue(false),
      };

      const token = signTestToken(regularUser._id);
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(regularUser));

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('You do not have permission to perform this action');
    });

    it('should reject seller (role: "seller") with 403 Forbidden', async () => {
      const sellerUser = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d2',
        role: 'seller',
        changedPasswordAfter: vi.fn().mockReturnValue(false),
      };

      const token = signTestToken(sellerUser._id);
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(sellerUser));

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('You do not have permission to perform this action');
    });

    it('should grant access to platform admin (role: "admin") with 200 OK and user list', async () => {
      const adminUser = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d6',
        role: 'admin',
        changedPasswordAfter: vi.fn().mockReturnValue(false),
      };

      const token = signTestToken(adminUser._id);
      vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(adminUser));
      vi.spyOn(User, 'find').mockImplementation(() => createMockQuery(sampleUsers));

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(sampleUsers.length);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });
  });
});
