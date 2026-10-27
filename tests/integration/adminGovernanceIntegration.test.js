import { describe, it, expect, beforeEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../backend/app');
const User = require('../../backend/models/userModel');
const Order = require('../../backend/models/orderModel');
const Product = require('../../backend/models/productModel');
const AuditLog = require('../../backend/models/auditLogModel');
const { sanitizeDetails } = require('../../backend/utils/auditLogger');

describe('Platform Admin Governance & Audit Trail Suite (Slice 9 - Tasks 31 & 32)', () => {
  const TEST_JWT_SECRET =
    'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';

  const createMockQuery = (resolvedValue, count = 1) => {
    return {
      find: vi.fn().mockReturnThis(),
      findById: vi.fn().mockReturnThis(),
      findOne: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(resolvedValue),
      countDocuments: vi.fn().mockResolvedValue(count),
      then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
    };
  };

  const createMockUser = (overrides) => {
    const id = overrides?._id || new mongoose.Types.ObjectId().toString();
    return {
      _id: id,
      id: id.toString(),
      name: 'Platform Admin',
      email: 'admin@apexmart.com',
      role: 'admin',
      active: true,
      changedPasswordAfter: vi.fn().mockReturnValue(false),
      loggedOutAfter: vi.fn().mockReturnValue(false),
      save: vi.fn().mockResolvedValue(true),
      ...overrides,
    };
  };

  const adminUser = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c999',
    name: 'Super Admin',
    email: 'admin@apexmart.com',
    role: 'admin',
  });

  const sellerUser = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c888',
    name: 'Merchant Partner',
    email: 'seller@apexmart.com',
    role: 'seller',
  });

  const buyerUser = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c777',
    name: 'Standard Customer',
    email: 'buyer@apexmart.com',
    role: 'user',
  });

  const generateToken = (user) => {
    return jwt.sign(
      { id: user._id.toString(), role: user.role, email: user.email },
      TEST_JWT_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  // ==========================================================================
  // 1. RBAC GATEWAY & AUTHORIZATION ENFORCEMENT
  // ==========================================================================
  describe('1. Platform Admin RBAC & Route Gatekeeping', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/admin/analytics');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/You are not logged in/i);
    });

    it('should reject regular buyers with 403 Forbidden', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerUser));

      const token = generateToken(buyerUser);
      const res = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/do not have permission/i);
    });

    it('should reject merchants/sellers with 403 Forbidden', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(sellerUser));

      const token = generateToken(sellerUser);
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/do not have permission/i);
    });

    it('should allow platform administrators to access /api/v1/admin routes', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(adminUser));
      vi.spyOn(User, 'find').mockReturnValue(createMockQuery([buyerUser, sellerUser]));
      vi.spyOn(User, 'countDocuments').mockResolvedValue(2);

      const token = generateToken(adminUser);
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.users).toHaveLength(2);
    });
  });

  // ==========================================================================
  // 2. PLATFORM ANALYTICS & GMV AGGREGATION
  // ==========================================================================
  describe('2. Platform Analytics & Financial Metrics (GET /api/v1/admin/analytics)', () => {
    it('should return aggregated GMV, order health, catalog inventory, and 30-day trajectory', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(adminUser));

      // Mock Order aggregations
      vi.spyOn(Order, 'aggregate')
        .mockResolvedValueOnce([
          {
            grossMerchandiseValue: 125430.5,
            settledRevenue: 110200.0,
            totalOrdersCount: 420,
            completedOrdersCount: 380,
            activeOrdersCount: 30,
            cancelledOrdersCount: 10,
            totalUnitsSold: 890,
          },
        ]) // Financials
        .mockResolvedValueOnce([
          { _id: '2026-10-20', gmv: 4500, orderCount: 15, unitsSold: 28 },
          { _id: '2026-10-21', gmv: 6200, orderCount: 22, unitsSold: 41 },
        ]) // Trajectory
        .mockResolvedValueOnce([
          {
            _id: new mongoose.Types.ObjectId(),
            title: 'Sony WH-1000XM5',
            imageCover: 'sony.jpg',
            price: 399.99,
            unitsSold: 50,
            revenue: 19999.5,
          },
        ]); // Top Products

      // Mock User demographics
      vi.spyOn(User, 'aggregate').mockResolvedValueOnce([
        { _id: 'user', count: 120 },
        { _id: 'seller', count: 15 },
        { _id: 'admin', count: 3 },
      ]);

      // Mock Product inventory health
      vi.spyOn(Product, 'aggregate').mockResolvedValueOnce([
        {
          total: [{ count: 85 }],
          active: [{ count: 70 }],
          lowStock: [{ count: 10 }],
          outOfStock: [{ count: 5 }],
        },
      ]);

      // Mock Order recent list
      vi.spyOn(Order, 'find').mockReturnValue(createMockQuery([]));

      // Mock AuditLog recent list
      vi.spyOn(AuditLog, 'find').mockReturnValue(createMockQuery([]));

      const token = generateToken(adminUser);
      const res = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      const { analytics } = res.body.data;

      expect(analytics.financials.gmv).toBe(125430.5);
      expect(analytics.financials.settledRevenue).toBe(110200);
      expect(analytics.financials.totalOrders).toBe(420);
      expect(analytics.users.buyers).toBe(120);
      expect(analytics.users.sellers).toBe(15);
      expect(analytics.users.admins).toBe(3);
      expect(analytics.catalog.total).toBe(85);
      expect(analytics.catalog.lowStock).toBe(10);
      expect(analytics.trajectory).toHaveLength(30);
      expect(analytics.topProducts).toHaveLength(1);
    });
  });

  // ==========================================================================
  // 3. USER MANAGEMENT & RBAC ROLE PROMOTION
  // ==========================================================================
  describe('3. User Management & Role Promotion (PATCH /api/v1/admin/users/:id/role)', () => {
    it('should promote a buyer to seller and save updated role', async () => {
      vi.spyOn(User, 'findById')
        .mockReturnValueOnce(createMockQuery(adminUser)) // Auth check
        .mockResolvedValueOnce(buyerUser); // Target user fetch

      const token = generateToken(adminUser);
      const res = await request(app)
        .patch(`/api/v1/admin/users/${buyerUser._id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'seller' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.role).toBe('seller');
      expect(buyerUser.save).toHaveBeenCalled();
    });

    it('should reject invalid role names with 400 Bad Request', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(adminUser));

      const token = generateToken(adminUser);
      const res = await request(app)
        .patch(`/api/v1/admin/users/${buyerUser._id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'super-hacker' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid role/i);
    });

    it('should prevent an administrator from revoking their own admin privileges', async () => {
      vi.spyOn(User, 'findById')
        .mockReturnValueOnce(createMockQuery(adminUser))
        .mockResolvedValueOnce(adminUser);

      const token = generateToken(adminUser);
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminUser._id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'user' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Administrators cannot revoke their own admin privileges/i);
    });

    it('should return 404 if target user is not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(User, 'findById')
        .mockReturnValueOnce(createMockQuery(adminUser))
        .mockResolvedValueOnce(null);

      const token = generateToken(adminUser);
      const res = await request(app)
        .patch(`/api/v1/admin/users/${nonExistentId}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'seller' });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/No user found/i);
    });
  });

  // ==========================================================================
  // 4. IMMUTABLE AUDIT TRAIL & LOG QUERYING
  // ==========================================================================
  describe('4. Immutable Audit Trail & Log Querying', () => {
    it('should allow admin to query audit logs with severity filtering and pagination', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(adminUser));

      const mockLogs = [
        {
          _id: new mongoose.Types.ObjectId(),
          action: 'USER_ROLE_UPDATED',
          entity: 'User',
          entityId: buyerUser._id,
          severity: 'warning',
          details: { previousRole: 'user', newRole: 'seller' },
          createdAt: new Date(),
        },
      ];

      vi.spyOn(AuditLog, 'find').mockReturnValue(createMockQuery(mockLogs));
      vi.spyOn(AuditLog, 'countDocuments').mockResolvedValue(1);

      const token = generateToken(adminUser);
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?severity=warning')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.auditLogs).toHaveLength(1);
      expect(res.body.data.auditLogs[0].action).toBe('USER_ROLE_UPDATED');
    });

    it('should return audit statistics aggregated by severity and action', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(adminUser));

      vi.spyOn(AuditLog, 'aggregate').mockResolvedValueOnce([
        {
          bySeverity: [
            { _id: 'info', count: 45 },
            { _id: 'warning', count: 12 },
            { _id: 'critical', count: 2 },
          ],
          topActions: [
            { _id: 'ORDER_STATUS_UPDATED', count: 30 },
            { _id: 'USER_ROLE_UPDATED', count: 10 },
          ],
          total: [{ count: 59 }],
        },
      ]);

      const token = generateToken(adminUser);
      const res = await request(app)
        .get('/api/v1/admin/audit-logs/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.stats.total[0].count).toBe(59);
    });

    it('should redact sensitive credentials (passwords, tokens, cvv) from audit details', () => {
      const rawDetails = {
        email: 'user@example.com',
        password: 'SuperSecretPassword!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        nested: {
          clientSecret: 'pi_secret_12345',
          creditCard: '4111-2222-3333-4444',
          cvv: '123',
          publicInfo: 'safe_data',
        },
      };

      const sanitized = sanitizeDetails(rawDetails);

      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.nested.clientSecret).toBe('[REDACTED]');
      expect(sanitized.nested.creditCard).toBe('[REDACTED]');
      expect(sanitized.nested.cvv).toBe('[REDACTED]');
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.nested.publicInfo).toBe('safe_data');
    });

    it('should block mutation attempts on AuditLog model through immutable pre-hooks', async () => {
      // In Mongoose, pre-hooks on update/delete reject mutation
      let errorThrown = null;
      try {
        await AuditLog.updateOne({ _id: new mongoose.Types.ObjectId() }, { action: 'TAMPERED' });
      } catch (err) {
        errorThrown = err;
      }

      expect(errorThrown).not.toBeNull();
      expect(errorThrown.message).toMatch(/Audit logs are immutable and cannot be modified or deleted/i);
      expect(errorThrown.statusCode).toBe(403);
    });

    it('should block deletion attempts on AuditLog model through immutable pre-hooks', async () => {
      let errorThrown = null;
      try {
        await AuditLog.deleteOne({ _id: new mongoose.Types.ObjectId() });
      } catch (err) {
        errorThrown = err;
      }

      expect(errorThrown).not.toBeNull();
      expect(errorThrown.message).toMatch(/Audit logs are immutable and cannot be modified or deleted/i);
      expect(errorThrown.statusCode).toBe(403);
    });
  });
});
