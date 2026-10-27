import { describe, it, expect, beforeEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../backend/app');
const Order = require('../../backend/models/orderModel');
const Product = require('../../backend/models/productModel');
const User = require('../../backend/models/userModel');
const Cart = require('../../backend/models/cartModel');
const { catalogCache } = require('../../backend/utils/cacheLayer');

describe('Transactional Order Creation & ACID Stock Deduction Integration Suite (Slice 5 - Task 18)', () => {
  const TEST_JWT_SECRET = 'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';

  const createMockQuery = (resolvedValue) => {
    return {
      find: vi.fn().mockReturnThis(),
      findById: vi.fn().mockReturnThis(),
      findOne: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
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

  const mockBuyer = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d1',
    name: 'Sarah Connor',
    email: 'sarah@apexmart.com',
    role: 'user',
  });

  const mockOtherBuyer = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d2',
    name: 'John Connor',
    email: 'john@apexmart.com',
    role: 'user',
  });

  const mockAdmin = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d3',
    name: 'Admin User',
    email: 'admin@apexmart.com',
    role: 'admin',
  });

  const mockProductInStock = {
    _id: '65f1a1b2c3d4e5f6a7b8c910',
    name: 'Designing Data-Intensive Applications',
    slug: 'designing-data-intensive-applications',
    price: 60,
    priceDiscount: 50,
    isDeal: false,
    stock: 20,
    isActive: true,
    imageCover: 'book.jpg',
    seller: '65f1a1b2c3d4e5f6a7b8c999',
  };

  const mockProductLowStock = {
    _id: '65f1a1b2c3d4e5f6a7b8c920',
    name: 'Nordic Cast Iron Dutch Oven',
    slug: 'nordic-cast-iron-dutch-oven',
    price: 150,
    priceDiscount: 0,
    isDeal: false,
    stock: 2,
    isActive: true,
    imageCover: 'pot.jpg',
    seller: '65f1a1b2c3d4e5f6a7b8c999',
  };

  const validShippingAddress = {
    fullName: 'Sarah Connor',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62704',
    country: 'United States',
    phone: '+1 555-0199',
  };

  const signTestToken = (userId) => {
    return jwt.sign(
      { id: userId, iat: Math.floor(Date.now() / 1000) - 10 },
      TEST_JWT_SECRET,
      { expiresIn: '7d' }
    );
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    catalogCache.clear();
  });

  // =========================================================================
  // 1. AUTHENTICATION & INPUT VALIDATION GUARDS
  // =========================================================================
  describe('Authentication & Payload Validation', () => {
    it('POST /api/v1/orders - should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          orderItems: [{ product: mockProductInStock._id, quantity: 1 }],
          shippingAddress: validShippingAddress,
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in');
    });

    it('POST /api/v1/orders - should return 400 when orderItems is empty or not an array', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));
      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [],
          shippingAddress: validShippingAddress,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('at least one item');
    });

    it('POST /api/v1/orders - should return 400 when shipping address is incomplete', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));
      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [{ product: mockProductInStock._id, quantity: 1 }],
          shippingAddress: { fullName: 'Sarah Connor' }, // missing street, city, postalCode
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('complete shipping address');
    });

    it('POST /api/v1/orders - should return 400 when product ID is invalid format', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));
      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [{ product: 'invalid-id-format', quantity: 1 }],
          shippingAddress: validShippingAddress,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('invalid product IDs');
    });
  });

  // =========================================================================
  // 2. INVENTORY BOUNDARIES & ACID STOCK DEDUCTION
  // =========================================================================
  describe('Inventory Validation & ACID Stock Deduction', () => {
    it('POST /api/v1/orders - should return 400 when product does not exist in database', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([])); // DB returns nothing
      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [{ product: mockProductInStock._id, quantity: 1 }],
          shippingAddress: validShippingAddress,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('no longer available');
    });

    it('POST /api/v1/orders - should return 400 when requested quantity exceeds available stock', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([mockProductLowStock]));
      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [{ product: mockProductLowStock._id, quantity: 5 }], // Stock is only 2
          shippingAddress: validShippingAddress,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient inventory');
      expect(res.body.message).toContain('Available: 2');
    });

    it('POST /api/v1/orders - should atomically decrement stock, calculate totals, and create order with Stripe secret', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([mockProductInStock]));

      const updateSpy = vi.spyOn(Product, 'findOneAndUpdate').mockResolvedValue({
        ...mockProductInStock,
        stock: 18, // 20 - 2
      });

      const cartUpdateSpy = vi.spyOn(Cart, 'findOneAndUpdate').mockResolvedValue({ user: mockBuyer._id, items: [] });
      const cacheClearSpy = vi.spyOn(catalogCache, 'clear');

      const mockSavedOrder = {
        _id: '65f1a1b2c3d4e5f6a7b8c999',
        user: mockBuyer._id,
        orderItems: [
          {
            product: mockProductInStock._id,
            name: mockProductInStock.name,
            price: 50,
            quantity: 2,
          },
        ],
        shippingAddress: validShippingAddress,
        deliverySpeed: 'standard',
        itemsPrice: 100, // 2 * $50
        shippingPrice: 0, // >= 35 -> free
        taxPrice: 8, // 8% of 100
        totalPrice: 108,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Order.prototype, 'save').mockImplementation(function () {
        this._id = mockSavedOrder._id;
        return Promise.resolve(this);
      });

      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [{ product: mockProductInStock._id, quantity: 2 }],
          shippingAddress: validShippingAddress,
          deliverySpeed: 'standard',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.order).toBeDefined();

      // Check atomic decrement call
      expect(updateSpy).toHaveBeenCalledWith(
        { _id: mockProductInStock._id, stock: { $gte: 2 } },
        { $inc: { stock: -2 } },
        expect.anything()
      );

      // Check cart emptied & catalog cache invalidated
      expect(cartUpdateSpy).toHaveBeenCalledWith({ user: mockBuyer._id }, { items: [] });
      expect(cacheClearSpy).toHaveBeenCalled();

      // Check Stripe client secret returned
      expect(res.body.data.clientSecret).toBeDefined();
    });
  });

  // =========================================================================
  // 3. IDEMPOTENCY-KEY REPLAY DEFENSE (MODULE 04)
  // =========================================================================
  describe('Idempotency-Key Deduplication', () => {
    it('POST /api/v1/orders - should replay existing order when matching idempotencyKey exists', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));

      const existingOrder = {
        _id: '65f1a1b2c3d4e5f6a7b8c888',
        user: mockBuyer._id,
        idempotencyKey: 'idemp-token-12345',
        totalPrice: 108,
        stripeClientSecret: 'pi_mock_secret_existing',
      };

      vi.spyOn(Order, 'findOne').mockResolvedValue(existingOrder);
      const updateSpy = vi.spyOn(Product, 'findOneAndUpdate');

      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', 'idemp-token-12345')
        .send({
          orderItems: [{ product: mockProductInStock._id, quantity: 2 }],
          shippingAddress: validShippingAddress,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.isIdempotentReplay).toBe(true);
      expect(res.body.data.order._id).toBe(existingOrder._id);
      expect(res.body.data.clientSecret).toBe('pi_mock_secret_existing');

      // Crucial: Must NOT decrement stock a second time!
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. DELIVERY SPEEDS & FINANCIAL CALCULATION RULES
  // =========================================================================
  describe('Delivery Speed & Shipping Rules', () => {
    it('should charge $5.99 shipping for standard delivery when itemsPrice < $35', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));

      const cheapProduct = {
        ...mockProductInStock,
        _id: '65f1a1b2c3d4e5f6a7b8c940',
        price: 20,
        priceDiscount: 0,
        stock: 10,
      };

      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([cheapProduct]));
      vi.spyOn(Product, 'findOneAndUpdate').mockResolvedValue(cheapProduct);
      vi.spyOn(Cart, 'findOneAndUpdate').mockResolvedValue(true);

      let capturedOrder = null;
      vi.spyOn(Order.prototype, 'save').mockImplementation(function () {
        capturedOrder = this;
        this._id = '65f1a1b2c3d4e5f6a7b8c777';
        return Promise.resolve(this);
      });

      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [{ product: cheapProduct._id, quantity: 1 }],
          shippingAddress: validShippingAddress,
          deliverySpeed: 'standard',
        });

      expect(res.status).toBe(201);
      expect(capturedOrder.itemsPrice).toBe(20);
      expect(capturedOrder.shippingPrice).toBe(5.99); // < $35 -> $5.99
      expect(capturedOrder.taxPrice).toBe(1.60); // 8% of $20
      expect(capturedOrder.totalPrice).toBe(27.59); // 20 + 5.99 + 1.60
    });

    it('should charge $9.99 for two_day and $14.99 for next_day delivery', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([mockProductInStock]));
      vi.spyOn(Product, 'findOneAndUpdate').mockResolvedValue(mockProductInStock);
      vi.spyOn(Cart, 'findOneAndUpdate').mockResolvedValue(true);

      let capturedOrder = null;
      vi.spyOn(Order.prototype, 'save').mockImplementation(function () {
        capturedOrder = this;
        this._id = '65f1a1b2c3d4e5f6a7b8c666';
        return Promise.resolve(this);
      });

      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [{ product: mockProductInStock._id, quantity: 1 }],
          shippingAddress: validShippingAddress,
          deliverySpeed: 'two_day',
        });

      expect(res.status).toBe(201);
      expect(capturedOrder.shippingPrice).toBe(9.99);
    });
  });

  // =========================================================================
  // 5. ORDER RETRIEVAL & IDOR SECURITY GUARDS (MODULE 01)
  // =========================================================================
  describe('Order Retrieval & IDOR Authorization', () => {
    const mockOrderDoc = {
      _id: '65f1a1b2c3d4e5f6a7b8c555',
      user: {
        _id: mockBuyer._id,
        name: mockBuyer.name,
        email: mockBuyer.email,
      },
      orderItems: [
        {
          product: {
            _id: mockProductInStock._id,
            name: mockProductInStock.name,
            slug: mockProductInStock.slug,
          },
          price: 50,
          quantity: 2,
        },
      ],
      totalPrice: 108,
      orderStatus: 'pending',
    };

    it('GET /api/v1/orders/:id - should allow order owner to view their order', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));
      vi.spyOn(Order, 'findById').mockReturnValue(createMockQuery(mockOrderDoc));

      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .get(`/api/v1/orders/${mockOrderDoc._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.order._id).toBe(mockOrderDoc._id);
    });

    it('GET /api/v1/orders/:id - should return 403 when another customer attempts to access the order (IDOR guard)', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockOtherBuyer));
      vi.spyOn(Order, 'findById').mockReturnValue(createMockQuery(mockOrderDoc));

      const token = signTestToken(mockOtherBuyer._id);

      const res = await request(app)
        .get(`/api/v1/orders/${mockOrderDoc._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('do not have permission');
    });

    it('GET /api/v1/orders/:id - should allow admin to view any order', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockAdmin));
      vi.spyOn(Order, 'findById').mockReturnValue(createMockQuery(mockOrderDoc));

      const token = signTestToken(mockAdmin._id);

      const res = await request(app)
        .get(`/api/v1/orders/${mockOrderDoc._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.order._id).toBe(mockOrderDoc._id);
    });

    it('GET /api/v1/orders/:id - should return 404 when order ID does not exist', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));
      vi.spyOn(Order, 'findById').mockReturnValue(createMockQuery(null));

      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .get('/api/v1/orders/65f1a1b2c3d4e5f6a7b8c000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('No order found with that ID');
    });

    it('GET /api/v1/orders/my-orders - should return list of orders for authenticated user', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockBuyer));
      vi.spyOn(Order, 'find').mockReturnValue(createMockQuery([mockOrderDoc]));

      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(1);
      expect(res.body.data.orders[0]._id).toBe(mockOrderDoc._id);
    });
  });
});
