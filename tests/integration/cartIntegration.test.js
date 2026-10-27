import { describe, it, expect, beforeEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../backend/app');
const Product = require('../../backend/models/productModel');
const User = require('../../backend/models/userModel');
const Cart = require('../../backend/models/cartModel');

describe('Shopping Cart Synchronization & Stock Verification Integration Suite (Slice 4 - Task 16)', () => {
  const TEST_JWT_SECRET = 'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';

  const createMockQuery = (resolvedValue) => {
    return {
      find: vi.fn().mockReturnThis(),
      findById: vi.fn().mockReturnThis(),
      findOne: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
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

  const mockUser1 = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d1',
    name: 'User One',
    email: 'user1@apexmart.com',
  });

  const mockUser2 = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d2',
    name: 'User Two',
    email: 'user2@apexmart.com',
  });

  const productInStock = {
    _id: '65f1a1b2c3d4e5f6a7b8c910',
    name: 'Designing Data-Intensive Applications',
    slug: 'designing-data-intensive-applications',
    price: 60,
    priceDiscount: 45, // active discount
    isDeal: false,
    dealDiscountPercentage: 0,
    stock: 50,
    isActive: true,
    imageCover: 'book.jpg',
    brand: "O'Reilly",
  };

  const productLimitedStock = {
    _id: '65f1a1b2c3d4e5f6a7b8c920',
    name: 'Kratos Cast Iron Dumbbells',
    slug: 'kratos-cast-iron-dumbbells',
    price: 100,
    priceDiscount: 0,
    isDeal: true,
    dealDiscountPercentage: 20, // 20% off -> $80
    stock: 2,
    isActive: true,
    imageCover: 'dumbbells.jpg',
    brand: 'Kratos',
  };

  const productOutOfStock = {
    _id: '65f1a1b2c3d4e5f6a7b8c930',
    name: 'Retro Mechanical Keyboard',
    slug: 'retro-mechanical-keyboard',
    price: 120,
    priceDiscount: 0,
    isDeal: false,
    stock: 0,
    isActive: true,
    imageCover: 'keyboard.jpg',
    brand: 'Keychron',
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
  });

  // =========================================================================
  // 1. GUEST / STATELESS CART SYNCHRONIZATION (POST /api/v1/cart/sync)
  // =========================================================================
  describe('Guest Cart Synchronization API (Public / Stateless)', () => {
    it('POST /api/v1/cart/sync - should return 200 with verified items, server pricing, and free shipping calculation', async () => {
      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([productInStock]),
      });

      const res = await request(app)
        .post('/api/v1/cart/sync')
        .send({
          items: [
            {
              product: productInStock._id,
              quantity: 2,
              price: 1.99, // Attempted client-side price tampering
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      const cart = res.body.data.cart;

      // 1) Verify authoritative server pricing defeated tampering ($45 instead of $1.99)
      expect(cart.items[0].unitPrice).toBe(45);
      expect(cart.items[0].lineTotal).toBe(90);
      expect(cart.items[0].status).toBe('IN_STOCK');
      expect(cart.items[0].isAvailable).toBe(true);

      // 2) Verify Amazon Prime free shipping threshold ($90 >= $35)
      expect(cart.summary.itemsCount).toBe(2);
      expect(cart.summary.subtotal).toBe(90);
      expect(cart.summary.freeShippingEligible).toBe(true);
      expect(cart.summary.amountUntilFreeShipping).toBe(0);
      expect(cart.summary.shippingFee).toBe(0);
      expect(cart.summary.estimatedTax).toBe(7.2); // 8% of 90
      expect(cart.summary.total).toBe(97.2);
    });

    it('POST /api/v1/cart/sync - should charge $5.99 shipping when subtotal is below $35', async () => {
      const cheapItem = {
        _id: '65f1a1b2c3d4e5f6a7b8c940',
        name: 'USB Cable',
        price: 15,
        priceDiscount: 0,
        stock: 20,
        isActive: true,
      };

      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([cheapItem]),
      });

      const res = await request(app)
        .post('/api/v1/cart/sync')
        .send({
          items: [{ product: cheapItem._id, quantity: 1 }],
        });

      expect(res.status).toBe(200);
      const cart = res.body.data.cart;
      expect(cart.summary.subtotal).toBe(15);
      expect(cart.summary.freeShippingEligible).toBe(false);
      expect(cart.summary.amountUntilFreeShipping).toBe(20); // 35 - 15
      expect(cart.summary.shippingFee).toBe(5.99);
      expect(cart.summary.total).toBe(22.19); // 15 + 5.99 + 1.20
    });

    it('POST /api/v1/cart/sync - should return empty cart summary for empty items array', async () => {
      const res = await request(app)
        .post('/api/v1/cart/sync')
        .send({ items: [] });

      expect(res.status).toBe(200);
      expect(res.body.data.cart.items).toEqual([]);
      expect(res.body.data.cart.summary.subtotal).toBe(0);
      expect(res.body.data.cart.summary.shippingFee).toBe(0);
    });

    it('POST /api/v1/cart/sync - should reject with 400 when items payload is not an array', async () => {
      const res = await request(app)
        .post('/api/v1/cart/sync')
        .send({ items: 'not-an-array' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('must be an array');
    });

    it('POST /api/v1/cart/sync - should handle out-of-stock items and unavailable products gracefully', async () => {
      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([productOutOfStock]),
      });

      const res = await request(app)
        .post('/api/v1/cart/sync')
        .send({
          items: [
            { product: productOutOfStock._id, quantity: 1 },
            { product: '65f1a1b2c3d4e5f6a7b8c999', quantity: 1 }, // Non-existent product
          ],
        });

      expect(res.status).toBe(200);
      const cart = res.body.data.cart;
      expect(cart.hasUnavailableItems).toBe(true);

      const outOfStockItem = cart.items.find(
        (i) => i.product._id === productOutOfStock._id
      );
      expect(outOfStockItem.status).toBe('OUT_OF_STOCK');
      expect(outOfStockItem.isAvailable).toBe(false);
      expect(outOfStockItem.lineTotal).toBe(0);

      const nonExistentItem = cart.items.find(
        (i) => i.product._id === '65f1a1b2c3d4e5f6a7b8c999'
      );
      expect(nonExistentItem.status).toBe('UNAVAILABLE');
      expect(nonExistentItem.isAvailable).toBe(false);
      expect(cart.summary.subtotal).toBe(0);
    });

    it('POST /api/v1/cart/sync - should clamp quantity to available stock and flag LIMITED_STOCK', async () => {
      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([productLimitedStock]),
      });

      const res = await request(app)
        .post('/api/v1/cart/sync')
        .send({
          items: [{ product: productLimitedStock._id, quantity: 5 }], // Requests 5, but stock is 2
        });

      expect(res.status).toBe(200);
      const cart = res.body.data.cart;
      expect(cart.hasStockAdjustments).toBe(true);
      expect(cart.items[0].status).toBe('LIMITED_STOCK');
      expect(cart.items[0].effectiveQuantity).toBe(2);
      expect(cart.items[0].unitPrice).toBe(80); // 20% of 100
      expect(cart.items[0].lineTotal).toBe(160);
      expect(cart.summary.itemsCount).toBe(2);
      expect(cart.summary.subtotal).toBe(160);
    });
  });

  // =========================================================================
  // 2. AUTHENTICATED CART SYNCHRONIZATION & MERGE (POST /api/v1/cart/sync)
  // =========================================================================
  describe('Authenticated Cart Synchronization (Persistence & Merging)', () => {
    it('POST /api/v1/cart/sync - should merge incoming items with user existing cart when action is merge', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockUser1));

      const mockCartDoc = {
        user: mockUser1._id,
        items: [
          {
            product: productInStock._id,
            quantity: 1,
            price: 45,
          },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Cart, 'findOne').mockResolvedValue(mockCartDoc);
      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([productInStock, productLimitedStock]),
      });

      const token = signTestToken(mockUser1._id);

      const res = await request(app)
        .post('/api/v1/cart/sync')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { product: productInStock._id, quantity: 2 }, // Merges: 1 existing + 2 incoming = 3
            { product: productLimitedStock._id, quantity: 1 }, // New item added
          ],
          action: 'merge',
        });

      expect(res.status).toBe(200);
      expect(mockCartDoc.save).toHaveBeenCalled();
      const cart = res.body.data.cart;
      expect(cart.items).toHaveLength(2);

      const bookItem = cart.items.find((i) => i.product._id === productInStock._id);
      expect(bookItem.effectiveQuantity).toBe(3);

      const dumbbellItem = cart.items.find((i) => i.product._id === productLimitedStock._id);
      expect(dumbbellItem.effectiveQuantity).toBe(1);
    });

    it('POST /api/v1/cart/sync - should replace user cart entirely when action is replace', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockUser1));

      const mockCartDoc = {
        user: mockUser1._id,
        items: [
          {
            product: productInStock._id,
            quantity: 5,
            price: 45,
          },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Cart, 'findOne').mockResolvedValue(mockCartDoc);
      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([productLimitedStock]),
      });

      const token = signTestToken(mockUser1._id);

      const res = await request(app)
        .post('/api/v1/cart/sync')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [{ product: productLimitedStock._id, quantity: 1 }],
          action: 'replace',
        });

      expect(res.status).toBe(200);
      expect(mockCartDoc.save).toHaveBeenCalled();
      const cart = res.body.data.cart;
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].product._id).toBe(productLimitedStock._id);
    });
  });

  // =========================================================================
  // 3. AUTHENTICATED CART CRUD OPERATIONS
  // =========================================================================
  describe('Authenticated Cart CRUD Endpoints', () => {
    it('GET /api/v1/cart - should reject with 401 if unauthenticated', async () => {
      const res = await request(app).get('/api/v1/cart');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in');
    });

    it('GET /api/v1/cart - should return 200 with saved cart and live verified calculations', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockUser1));

      const mockCartDoc = {
        user: mockUser1._id,
        items: [
          {
            product: productInStock._id,
            quantity: 2,
            price: 45,
          },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Cart, 'findOne').mockResolvedValue(mockCartDoc);
      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([productInStock]),
      });

      const token = signTestToken(mockUser1._id);

      const res = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.cart.items).toHaveLength(1);
      expect(res.body.data.cart.summary.itemsCount).toBe(2);
      expect(res.body.data.cart.summary.subtotal).toBe(90);
    });

    it('POST /api/v1/cart/items - should add product to cart and enforce stock check', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockUser1));
      vi.spyOn(Product, 'findById').mockResolvedValue(productInStock);

      const mockCartDoc = {
        user: mockUser1._id,
        items: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Cart, 'findOne').mockResolvedValue(mockCartDoc);
      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([productInStock]),
      });

      const token = signTestToken(mockUser1._id);

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: productInStock._id, quantity: 3 });

      expect(res.status).toBe(200);
      expect(mockCartDoc.save).toHaveBeenCalled();
      expect(res.body.data.cart.summary.itemsCount).toBe(3);
    });

    it('POST /api/v1/cart/items - should reject with 400 when product is out of stock', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockUser1));
      vi.spyOn(Product, 'findById').mockResolvedValue(productOutOfStock);

      const token = signTestToken(mockUser1._id);

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: productOutOfStock._id, quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('out of stock');
    });

    it('PATCH /api/v1/cart/items/:productId - should update item quantity', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockUser1));

      const mockCartDoc = {
        user: mockUser1._id,
        items: [
          {
            product: productInStock._id,
            quantity: 1,
            price: 45,
          },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Cart, 'findOne').mockResolvedValue(mockCartDoc);
      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([productInStock]),
      });

      const token = signTestToken(mockUser1._id);

      const res = await request(app)
        .patch(`/api/v1/cart/items/${productInStock._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 4 });

      expect(res.status).toBe(200);
      expect(mockCartDoc.items[0].quantity).toBe(4);
      expect(mockCartDoc.save).toHaveBeenCalled();
      expect(res.body.data.cart.summary.itemsCount).toBe(4);
    });

    it('DELETE /api/v1/cart/items/:productId - should remove item from user cart', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockUser1));

      const mockCartDoc = {
        user: mockUser1._id,
        items: [
          {
            product: productInStock._id,
            quantity: 2,
            price: 45,
          },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Cart, 'findOne').mockResolvedValue(mockCartDoc);
      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      });

      const token = signTestToken(mockUser1._id);

      const res = await request(app)
        .delete(`/api/v1/cart/items/${productInStock._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(mockCartDoc.items).toHaveLength(0);
      expect(res.body.data.cart.summary.itemsCount).toBe(0);
      expect(res.body.data.cart.summary.subtotal).toBe(0);
    });

    it('DELETE /api/v1/cart - should clear the entire cart', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockUser1));

      const mockCartDoc = {
        user: mockUser1._id,
        items: [{ product: productInStock._id, quantity: 2, price: 45 }],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Cart, 'findOne').mockResolvedValue(mockCartDoc);

      const token = signTestToken(mockUser1._id);

      const res = await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(mockCartDoc.items).toHaveLength(0);
      expect(mockCartDoc.save).toHaveBeenCalled();
      expect(res.body.data.cart.summary.itemsCount).toBe(0);
    });
  });

  // =========================================================================
  // 4. SECURITY & IDOR ISOLATION (Module 01 & 04)
  // =========================================================================
  describe('Cart Security & User Isolation (IDOR Defense)', () => {
    it('should strictly bind cart retrieval and mutations to authenticated user ID', async () => {
      vi.spyOn(User, 'findById').mockReturnValue(createMockQuery(mockUser2));
      const findOneSpy = vi.spyOn(Cart, 'findOne').mockResolvedValue({
        user: mockUser2._id,
        items: [],
        save: vi.fn().mockResolvedValue(true),
      });

      const token = signTestToken(mockUser2._id);

      await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`);

      // Verified that Cart.findOne was queried with mockUser2 ID, impossible to access mockUser1's cart
      expect(findOneSpy).toHaveBeenCalledWith({ user: mockUser2._id });
    });
  });
});
