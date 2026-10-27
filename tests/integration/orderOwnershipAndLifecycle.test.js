import { describe, it, expect, beforeEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../backend/app');
const Order = require('../../backend/models/orderModel');
const Product = require('../../backend/models/productModel');
const User = require('../../backend/models/userModel');
const { catalogCache } = require('../../backend/utils/cacheLayer');

describe('Order Ownership, IDOR Protection & Status Lifecycle Suite (Slice 6 - Task 23)', () => {
  const TEST_JWT_SECRET = 'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';

  const createMockQuery = (resolvedValue) => {
    return {
      find: vi.fn().mockReturnThis(),
      findById: vi.fn().mockReturnThis(),
      findOne: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      session: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(resolvedValue),
      then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
    };
  };

  const createMockUser = (overrides) => {
    const id = overrides?._id || new mongoose.Types.ObjectId().toString();
    return {
      _id: id,
      id: id.toString(),
      name: 'Test Buyer',
      email: 'buyer@apexmart.com',
      role: 'user',
      active: true,
      changedPasswordAfter: vi.fn().mockReturnValue(false),
      loggedOutAfter: vi.fn().mockReturnValue(false),
      ...overrides,
    };
  };

  const buyerA = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d1',
    name: 'Sarah Connor',
    email: 'sarah@apexmart.com',
    role: 'user',
  });

  const buyerB = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d2',
    name: 'John Connor',
    email: 'john@apexmart.com',
    role: 'user',
  });

  const adminUser = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d3',
    name: 'Admin Boss',
    email: 'admin@apexmart.com',
    role: 'admin',
  });

  const signToken = (userId) => {
    return jwt.sign(
      { id: userId.toString(), iat: Math.floor(Date.now() / 1000) - 10 },
      TEST_JWT_SECRET,
      { expiresIn: '7d' }
    );
  };

  const createMockOrderDoc = (overrides) => {
    const orderId = overrides?._id || new mongoose.Types.ObjectId().toString();
    const doc = {
      _id: orderId,
      user: buyerA._id,
      orderItems: [
        {
          product: '65f1a1b2c3d4e5f6a7b8c910',
          name: 'Designing Data-Intensive Applications',
          imageCover: 'ddia.jpg',
          price: 50,
          quantity: 2,
        },
      ],
      shippingAddress: {
        fullName: 'Sarah Connor',
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62704',
        country: 'United States',
      },
      deliverySpeed: 'two_day',
      itemsPrice: 100,
      shippingPrice: 9.99,
      taxPrice: 8,
      totalPrice: 117.99,
      paymentMethod: 'stripe',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      save: vi.fn().mockResolvedValue(true),
      ...overrides,
    };
    return doc;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    vi.spyOn(catalogCache, 'clear');
  });

  // ==========================================
  // 1. AUTHENTICATION GATES
  // ==========================================
  describe('1. Authentication Security Gates', () => {
    it('GET /api/v1/orders/my-orders - should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/orders/my-orders');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in');
    });

    it('GET /api/v1/orders/:id - should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/orders/65f1a1b2c3d4e5f6a7b8c001');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in');
    });

    it('PATCH /api/v1/orders/:id/status - should reject unauthenticated requests with 401', async () => {
      const res = await request(app)
        .patch('/api/v1/orders/65f1a1b2c3d4e5f6a7b8c001/status')
        .send({ orderStatus: 'cancelled' });
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in');
    });

    it('GET /api/v1/orders - should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/orders');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in');
    });
  });

  // ==========================================
  // 2. ORDER HISTORY QUERYING (GET /my-orders)
  // ==========================================
  describe('2. Order History Querying (GET /my-orders)', () => {
    it('should return orders belonging strictly to the authenticated user', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerA));
      const orderDoc = createMockOrderDoc();
      vi.spyOn(Order, 'find').mockReturnValue(createMockQuery([orderDoc]));

      const token = signToken(buyerA._id);
      const res = await request(app)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(1);
      expect(res.body.data.orders[0]._id).toBe(orderDoc._id);
    });

    it('should support filtering by orderStatus query parameter', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerA));
      const deliveredOrder = createMockOrderDoc({ orderStatus: 'delivered' });
      vi.spyOn(Order, 'find').mockReturnValue(createMockQuery([deliveredOrder]));

      const token = signToken(buyerA._id);
      const res = await request(app)
        .get('/api/v1/orders/my-orders?orderStatus=delivered')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.orders[0].orderStatus).toBe('delivered');
    });
  });

  // ==========================================
  // 3. SINGLE ORDER IDOR PROTECTION (GET /:id)
  // ==========================================
  describe('3. Single Order IDOR Protection (GET /:id)', () => {
    it('should allow customer to view their own order', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerA));
      const orderDoc = createMockOrderDoc({ user: buyerA._id });
      vi.spyOn(Order, 'findById').mockReturnValue(createMockQuery(orderDoc));

      const token = signToken(buyerA._id);
      const res = await request(app)
        .get(`/api/v1/orders/${orderDoc._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.order._id).toBe(orderDoc._id);
    });

    it('should block customer from viewing another customer order with 403 Forbidden', async () => {
      // Authenticated as Buyer B, attempting to access Buyer A's order
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerB));
      const orderDoc = createMockOrderDoc({ user: buyerA._id });
      vi.spyOn(Order, 'findById').mockReturnValue(createMockQuery(orderDoc));

      const token = signToken(buyerB._id);
      const res = await request(app)
        .get(`/api/v1/orders/${orderDoc._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission to view this order');
    });

    it('should allow administrator to view any customer order', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(adminUser));
      const orderDoc = createMockOrderDoc({ user: buyerA._id });
      vi.spyOn(Order, 'findById').mockReturnValue(createMockQuery(orderDoc));

      const token = signToken(adminUser._id);
      const res = await request(app)
        .get(`/api/v1/orders/${orderDoc._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order._id).toBe(orderDoc._id);
    });

    it('should return 404 if order does not exist', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerA));
      vi.spyOn(Order, 'findById').mockReturnValue(createMockQuery(null));

      const token = signToken(buyerA._id);
      const res = await request(app)
        .get('/api/v1/orders/65f1a1b2c3d4e5f6a7b8c999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('No order found with that ID');
    });
  });

  // ==========================================
  // 4. ADMIN PLATFORM ORDERS ACCESS (GET /)
  // ==========================================
  describe('4. Admin Platform Orders Access (GET /)', () => {
    it('should allow admin to list all store orders with 200 OK', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(adminUser));
      const orders = [createMockOrderDoc(), createMockOrderDoc()];
      vi.spyOn(Order, 'find').mockReturnValue(createMockQuery(orders));

      const token = signToken(adminUser._id);
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(2);
    });

    it('should block non-admin users from listing all orders with 403 Forbidden', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerA));

      const token = signToken(buyerA._id);
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission to perform this action');
    });
  });

  // ==========================================
  // 5. STATUS LIFECYCLE & IDOR UPDATE (PATCH /:id/status)
  // ==========================================
  describe('5. Status Lifecycle & Transition Rules (PATCH /:id/status)', () => {
    it('should reject invalid ObjectId format with 400 Bad Request', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerA));

      const token = signToken(buyerA._id);
      const res = await request(app)
        .patch('/api/v1/orders/invalid-mongo-id/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderStatus: 'cancelled' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid order ID format');
    });

    it('should reject invalid or unsupported orderStatus with 400 Bad Request', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerA));

      const token = signToken(buyerA._id);
      const res = await request(app)
        .patch('/api/v1/orders/65f1a1b2c3d4e5f6a7b8c001/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderStatus: 'flying_to_mars' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid or missing orderStatus');
    });

    it('should return 404 if target order does not exist', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerA));
      vi.spyOn(Order, 'findById').mockResolvedValue(null);

      const token = signToken(buyerA._id);
      const res = await request(app)
        .patch('/api/v1/orders/65f1a1b2c3d4e5f6a7b8c999/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderStatus: 'cancelled' });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('No order found with that ID');
    });

    it('should prevent non-owner from updating order status with 403 Forbidden', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerB));
      const orderDoc = createMockOrderDoc({ user: buyerA._id });
      vi.spyOn(Order, 'findById').mockResolvedValue(orderDoc);

      const token = signToken(buyerB._id);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderDoc._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ orderStatus: 'cancelled' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission to update this order');
    });

    it('should prevent customer from updating status to shipped or delivered with 403 Forbidden', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerA));
      const orderDoc = createMockOrderDoc({ user: buyerA._id });
      vi.spyOn(Order, 'findById').mockResolvedValue(orderDoc);

      const token = signToken(buyerA._id);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderDoc._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ orderStatus: 'shipped' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Customers can only request order cancellation');
    });

    it('should allow customer to cancel unfulfilled pending order and restore stock', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerA));
      const orderDoc = createMockOrderDoc({
        user: buyerA._id,
        orderStatus: 'pending',
        orderItems: [
          { product: '65f1a1b2c3d4e5f6a7b8c910', quantity: 2 },
        ],
      });
      vi.spyOn(Order, 'findById').mockResolvedValue(orderDoc);
      vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue({});

      const token = signToken(buyerA._id);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderDoc._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderStatus: 'cancelled',
          cancellationReason: 'Found better price elsewhere',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.order.orderStatus).toBe('cancelled');
      expect(res.body.data.order.cancellationReason).toBe('Found better price elsewhere');
      expect(res.body.data.order.cancelledAt).toBeDefined();

      // Verify stock was restored
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('65f1a1b2c3d4e5f6a7b8c910', {
        $inc: { stock: 2 },
      });
      expect(catalogCache.clear).toHaveBeenCalled();
    });

    it('should block customer from cancelling order that has already shipped with 400 Bad Request', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(buyerA));
      const orderDoc = createMockOrderDoc({
        user: buyerA._id,
        orderStatus: 'shipped',
      });
      vi.spyOn(Order, 'findById').mockResolvedValue(orderDoc);

      const token = signToken(buyerA._id);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderDoc._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ orderStatus: 'cancelled' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Orders that have already shipped or been delivered cannot be cancelled online');
    });

    it('should block updating an order that is already cancelled with 400 Bad Request', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(adminUser));
      const orderDoc = createMockOrderDoc({
        user: buyerA._id,
        orderStatus: 'cancelled',
      });
      vi.spyOn(Order, 'findById').mockResolvedValue(orderDoc);

      const token = signToken(adminUser._id);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderDoc._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ orderStatus: 'processing' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot update status of an order that has already been cancelled');
    });

    it('should allow admin to transition order to shipped with carrier and trackingNumber', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(adminUser));
      const orderDoc = createMockOrderDoc({
        user: buyerA._id,
        orderStatus: 'processing',
      });
      vi.spyOn(Order, 'findById').mockResolvedValue(orderDoc);

      const token = signToken(adminUser._id);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderDoc._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderStatus: 'shipped',
          carrier: 'FedEx Express',
          trackingNumber: 'FX-98765432-US',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.order.orderStatus).toBe('shipped');
      expect(res.body.data.order.carrier).toBe('FedEx Express');
      expect(res.body.data.order.trackingNumber).toBe('FX-98765432-US');
      expect(res.body.data.order.shippedAt).toBeDefined();
    });

    it('should allow admin to transition order to delivered with timestamp', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(adminUser));
      const orderDoc = createMockOrderDoc({
        user: buyerA._id,
        orderStatus: 'shipped',
      });
      vi.spyOn(Order, 'findById').mockResolvedValue(orderDoc);

      const token = signToken(adminUser._id);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderDoc._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ orderStatus: 'delivered' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.order.orderStatus).toBe('delivered');
      expect(res.body.data.order.deliveredAt).toBeDefined();
    });

    it('should refund paymentStatus if paid order is cancelled by admin', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(adminUser));
      const orderDoc = createMockOrderDoc({
        user: buyerA._id,
        paymentStatus: 'paid',
        orderStatus: 'processing',
        orderItems: [
          { product: '65f1a1b2c3d4e5f6a7b8c910', quantity: 1 },
        ],
      });
      vi.spyOn(Order, 'findById').mockResolvedValue(orderDoc);
      vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue({});

      const token = signToken(adminUser._id);
      const res = await request(app)
        .patch(`/api/v1/orders/${orderDoc._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderStatus: 'cancelled',
          cancellationReason: 'Item recalled by manufacturer',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.order.orderStatus).toBe('cancelled');
      expect(res.body.data.order.paymentStatus).toBe('refunded');
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('65f1a1b2c3d4e5f6a7b8c910', {
        $inc: { stock: 1 },
      });
    });
  });
});
