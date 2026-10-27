import { describe, it, expect, beforeEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../backend/app');
const Product = require('../../backend/models/productModel');
const Order = require('../../backend/models/orderModel');
const Category = require('../../backend/models/categoryModel');
const User = require('../../backend/models/userModel');
const { catalogCache } = require('../../backend/utils/cacheLayer');

describe('Merchant & Seller Central Integration Suite (Slice 8 - Tasks 28 & 29)', () => {
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
      name: 'Test Seller',
      email: 'seller@apexmart.com',
      role: 'seller',
      active: true,
      changedPasswordAfter: vi.fn().mockReturnValue(false),
      loggedOutAfter: vi.fn().mockReturnValue(false),
      ...overrides,
    };
  };

  const sellerA = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d1',
    name: 'Sony Official Merchant',
    email: 'sony@apexmart.com',
    role: 'seller',
  });

  const sellerB = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d2',
    name: 'Apple Merchant Store',
    email: 'apple@apexmart.com',
    role: 'seller',
  });

  const buyerUser = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d3',
    name: 'Standard Buyer',
    email: 'buyer@apexmart.com',
    role: 'user',
  });

  const adminUser = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d4',
    name: 'Apex Superadmin',
    email: 'admin@apexmart.com',
    role: 'admin',
  });

  const mockCategory = {
    _id: '65f1a1b2c3d4e5f6a7b8c9d5',
    name: 'Electronics',
    slug: 'electronics',
  };

  const mockProductA = {
    _id: '65f1a1b2c3d4e5f6a7b8c9e1',
    name: 'Sony WH-1000XM5 Headphones',
    slug: 'sony-wh-1000xm5-headphones',
    price: 349.99,
    stock: 25,
    seller: sellerA._id,
    category: mockCategory,
    ratingsAverage: 4.8,
    ratingsQuantity: 120,
    isActive: true,
  };

  const mockProductB = {
    _id: '65f1a1b2c3d4e5f6a7b8c9e2',
    name: 'Apple MacBook Pro 16',
    slug: 'apple-macbook-pro-16',
    price: 2499.0,
    stock: 8,
    seller: sellerB._id,
    category: mockCategory,
    ratingsAverage: 4.9,
    ratingsQuantity: 85,
    isActive: true,
  };

  const signTestToken = (userId) => {
    return jwt.sign(
      { id: userId, iat: Math.floor(Date.now() / 1000) - 10 },
      TEST_JWT_SECRET,
      { expiresIn: '7d' }
    );
  };

  const mockAuthUser = (user) => {
    vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(user));
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    catalogCache.clear();
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    vi.spyOn(Category, 'findOne').mockReturnValue(createMockQuery(mockCategory));
  });

  // =========================================================================
  // 1. RBAC & ROUTE ACCESS PROTECTION
  // =========================================================================
  describe('RBAC & Authentication Guarding', () => {
    it('GET /api/v1/seller/analytics - should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/seller/analytics');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in');
    });

    it('GET /api/v1/seller/analytics - should return 403 when user is buyer', async () => {
      mockAuthUser(buyerUser);
      const token = signTestToken(buyerUser._id);

      const res = await request(app)
        .get('/api/v1/seller/analytics')
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission');
    });

    it('GET /api/v1/seller/analytics - should return 200 when user is seller', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      vi.spyOn(Product, 'countDocuments').mockResolvedValue(10);
      vi.spyOn(Product, 'aggregate').mockResolvedValue([
        { _id: null, avgRating: 4.7, totalReviews: 45 },
      ]);
      vi.spyOn(Order, 'aggregate').mockResolvedValue([
        { _id: null, totalRevenue: 1540.5, totalUnitsSold: 12, orderIds: ['order1'] },
      ]);
      vi.spyOn(Order, 'find').mockReturnValue(createMockQuery([]));

      const res = await request(app)
        .get('/api/v1/seller/analytics')
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.totalProducts).toBe(10);
      expect(res.body.data.metrics.totalRevenue).toBe(1540.5);
    });
  });

  // =========================================================================
  // 2. SELLER ANALYTICS AGGREGATIONS
  // =========================================================================
  describe('Seller Store Analytics Engine', () => {
    it('should aggregate metrics with zero fallbacks when seller has no orders', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      vi.spyOn(Product, 'countDocuments').mockResolvedValue(0);
      vi.spyOn(Product, 'aggregate').mockResolvedValue([]);
      vi.spyOn(Order, 'aggregate').mockResolvedValue([]);
      vi.spyOn(Order, 'find').mockReturnValue(createMockQuery([]));

      const res = await request(app)
        .get('/api/v1/seller/analytics')
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics.totalRevenue).toBe(0);
      expect(res.body.data.metrics.totalUnitsSold).toBe(0);
      expect(res.body.data.metrics.totalOrders).toBe(0);
      expect(res.body.data.metrics.averageRating).toBe(0);
      expect(res.body.data.salesTrajectory).toEqual([]);
      expect(res.body.data.topProducts).toEqual([]);
      expect(res.body.data.recentOrders).toEqual([]);
    });

    it('should return recent orders tailored exclusively to seller items', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      const mockRecentOrders = [
        {
          _id: '65f1a1b2c3d4e5f6a7b8c9f1',
          createdAt: new Date().toISOString(),
          orderStatus: 'delivered',
          paymentStatus: 'paid',
          user: { name: 'Alice Customer', email: 'alice@example.com' },
          orderItems: [
            {
              product: mockProductA._id,
              name: mockProductA.name,
              price: 349.99,
              quantity: 2,
              seller: sellerA._id,
            },
            {
              product: mockProductB._id,
              name: mockProductB.name,
              price: 2499.0,
              quantity: 1,
              seller: sellerB._id,
            },
          ],
        },
      ];

      vi.spyOn(Product, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(Product, 'aggregate').mockResolvedValue([]);
      vi.spyOn(Order, 'aggregate').mockResolvedValue([
        { _id: null, totalRevenue: 699.98, totalUnitsSold: 2, orderIds: ['order1'] },
      ]);
      vi.spyOn(Order, 'find').mockReturnValue(createMockQuery(mockRecentOrders));

      const res = await request(app)
        .get('/api/v1/seller/analytics')
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.recentOrders).toHaveLength(1);
      // Only Seller A items (2 items, $699.98 revenue) should be calculated
      expect(res.body.data.recentOrders[0].itemsCount).toBe(2);
      expect(res.body.data.recentOrders[0].sellerRevenue).toBe(699.98);
      expect(res.body.data.recentOrders[0].items).toHaveLength(1);
    });
  });

  // =========================================================================
  // 3. SELLER INVENTORY CRUD & STRICT IDOR ISOLATION
  // =========================================================================
  describe('Seller Inventory CRUD & IDOR Enforcement', () => {
    it('GET /api/v1/seller/products - should only query products owned by authenticated seller', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      const findSpy = vi
        .spyOn(Product, 'find')
        .mockReturnValue(createMockQuery([mockProductA], 1));
      vi.spyOn(Product, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/seller/products')
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.results).toBe(1);
      expect(res.body.data.products[0].name).toBe(mockProductA.name);
      // Verify query was constrained by seller ID
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({ seller: sellerA._id })
      );
    });

    it('GET /api/v1/seller/products/:id - should return 200 when accessing own product', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      vi.spyOn(Product, 'findById').mockReturnValue(createMockQuery(mockProductA));

      const res = await request(app)
        .get(`/api/v1/seller/products/${mockProductA._id}`)
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.product.name).toBe(mockProductA.name);
    });

    it('GET /api/v1/seller/products/:id - should return 403 IDOR when accessing another seller product', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      // Product B belongs to Seller B
      vi.spyOn(Product, 'findById').mockReturnValue(createMockQuery(mockProductB));

      const res = await request(app)
        .get(`/api/v1/seller/products/${mockProductB._id}`)
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission');
    });

    it('POST /api/v1/seller/products - should automatically assign authenticated seller ID', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      const newProductPayload = {
        name: 'Sony Alpha 7 IV Camera',
        price: 2499.0,
        stock: 15,
        category: mockCategory._id,
      };

      const createSpy = vi.spyOn(Product, 'create').mockResolvedValue({
        ...newProductPayload,
        _id: '65f1a1b2c3d4e5f6a7b8c9e9',
        seller: sellerA._id,
      });

      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Cookie', `jwt=${token}`)
        .send(newProductPayload);

      expect(res.status).toBe(201);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ seller: sellerA._id })
      );
    });

    it('PATCH /api/v1/seller/products/:id - should return 200 when updating own product', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProductA);
      vi.spyOn(Product, 'findByIdAndUpdate').mockReturnValue(
        createMockQuery({ ...mockProductA, price: 299.99 })
      );

      const res = await request(app)
        .patch(`/api/v1/seller/products/${mockProductA._id}`)
        .set('Cookie', `jwt=${token}`)
        .send({ price: 299.99 });

      expect(res.status).toBe(200);
      expect(res.body.data.product.price).toBe(299.99);
    });

    it('PATCH /api/v1/seller/products/:id - should return 403 IDOR when updating another seller product', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      // Target product belongs to Seller B
      vi.spyOn(Product, 'findById').mockResolvedValue(mockProductB);

      const res = await request(app)
        .patch(`/api/v1/seller/products/${mockProductB._id}`)
        .set('Cookie', `jwt=${token}`)
        .send({ price: 1999.0 });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission');
    });

    it('PATCH /api/v1/seller/products/:id - should strip seller field to prevent ownership tampering', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProductA);
      const updateSpy = vi
        .spyOn(Product, 'findByIdAndUpdate')
        .mockReturnValue(createMockQuery(mockProductA));

      await request(app)
        .patch(`/api/v1/seller/products/${mockProductA._id}`)
        .set('Cookie', `jwt=${token}`)
        .send({ name: 'Tampered Name', seller: 'hacker_seller_id' });

      // Ensure req.body.seller was stripped before findByIdAndUpdate
      expect(updateSpy).toHaveBeenCalledWith(
        mockProductA._id,
        expect.not.objectContaining({ seller: 'hacker_seller_id' }),
        expect.any(Object)
      );
    });

    it('DELETE /api/v1/seller/products/:id - should return 204 when deleting own product', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProductA);
      const deleteSpy = vi.spyOn(Product, 'findByIdAndDelete').mockResolvedValue(mockProductA);

      const res = await request(app)
        .delete(`/api/v1/seller/products/${mockProductA._id}`)
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(204);
      expect(deleteSpy).toHaveBeenCalledWith(mockProductA._id);
    });

    it('DELETE /api/v1/seller/products/:id - should return 403 IDOR when deleting another seller product', async () => {
      mockAuthUser(sellerA);
      const token = signTestToken(sellerA._id);

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProductB);

      const res = await request(app)
        .delete(`/api/v1/seller/products/${mockProductB._id}`)
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission');
    });

    it('DELETE /api/v1/seller/products/:id - should allow admin to delete any product', async () => {
      mockAuthUser(adminUser);
      const token = signTestToken(adminUser._id);

      vi.spyOn(Product, 'findById').mockResolvedValue(mockProductA);
      const deleteSpy = vi.spyOn(Product, 'findByIdAndDelete').mockResolvedValue(mockProductA);

      const res = await request(app)
        .delete(`/api/v1/seller/products/${mockProductA._id}`)
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(204);
      expect(deleteSpy).toHaveBeenCalledWith(mockProductA._id);
    });
  });
});
