import { describe, it, expect, beforeEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const app = require('../../backend/app');
const Order = require('../../backend/models/orderModel');
const Product = require('../../backend/models/productModel');
const User = require('../../backend/models/userModel');
const Cart = require('../../backend/models/cartModel');
const { catalogCache } = require('../../backend/utils/cacheLayer');

describe('Supertest ACID Order Processing & Stock Rollback Suite (Slice 5 - Task 20)', () => {
  const TEST_JWT_SECRET = 'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';
  const TEST_WEBHOOK_SECRET = 'whsec_acid_rollback_test_secret_32_chars';

  const mockBuyer = {
    _id: '65f1a1b2c3d4e5f6a7b8c9d1',
    id: '65f1a1b2c3d4e5f6a7b8c9d1',
    name: 'Sarah Connor',
    email: 'sarah@apexmart.com',
    role: 'user',
    active: true,
    changedPasswordAfter: vi.fn().mockReturnValue(false),
    loggedOutAfter: vi.fn().mockReturnValue(false),
  };

  const productA = {
    _id: '65f1a1b2c3d4e5f6a7b8c911',
    name: 'Product A (In Stock)',
    price: 50,
    priceDiscount: 0,
    stock: 10,
    isActive: true,
    imageCover: 'a.jpg',
    seller: '65f1a1b2c3d4e5f6a7b8c999',
  };

  const productB = {
    _id: '65f1a1b2c3d4e5f6a7b8c922',
    name: 'Product B (Depleted)',
    price: 30,
    priceDiscount: 0,
    stock: 0, // completely out of stock
    isActive: true,
    imageCover: 'b.jpg',
    seller: '65f1a1b2c3d4e5f6a7b8c999',
  };

  const validShippingAddress = {
    fullName: 'Sarah Connor',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62704',
    country: 'United States',
  };

  const signTestToken = (userId) => {
    return jwt.sign(
      { id: userId, iat: Math.floor(Date.now() / 1000) - 10 },
      TEST_JWT_SECRET,
      { expiresIn: '7d' }
    );
  };

  const signWebhookPayload = (eventObject) => {
    const payload = JSON.stringify(eventObject);
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: TEST_WEBHOOK_SECRET,
    });
    return { payload, signature };
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    catalogCache.clear();
  });

  // =========================================================================
  // 1. MULTI-ITEM PRE-FLIGHT ATOMIC ROLLBACK
  // =========================================================================
  describe('Multi-Item Order Atomic Abort', () => {
    it('should abort order and NEVER decrement Product A when Product B has 0 stock', async () => {
      vi.spyOn(User, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockBuyer),
        then: (resolve) => resolve(mockBuyer),
      });

      // Product A has 10 stock, Product B has 0 stock
      vi.spyOn(Product, 'find').mockReturnValue({
        session: vi.fn().mockReturnThis(),
        then: (resolve) => resolve([productA, productB]),
      });

      const decrementSpy = vi.spyOn(Product, 'findOneAndUpdate');

      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [
            { product: productA._id, quantity: 2 },
            { product: productB._id, quantity: 1 },
          ],
          shippingAddress: validShippingAddress,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient inventory for "Product B (Depleted)"');

      // Crucial: Product A must NOT have been decremented
      expect(decrementSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 2. MIDWAY CONCURRENT RACE CONDITION ROLLBACK
  // =========================================================================
  describe('Midway Concurrent Race Condition Compensation Rollback', () => {
    it('should roll back Product A if Product B experiences a concurrent race collision during decrement', async () => {
      vi.spyOn(User, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockBuyer),
        then: (resolve) => resolve(mockBuyer),
      });

      const productAValid = { ...productA, stock: 10 };
      const productBValid = { ...productB, stock: 5 };

      vi.spyOn(Product, 'find').mockReturnValue({
        session: vi.fn().mockReturnThis(),
        then: (resolve) => resolve([productAValid, productBValid]),
      });

      // Product A succeeds, but Product B returns null (simulating concurrent inventory race collision)
      let callCount = 0;
      vi.spyOn(Product, 'findOneAndUpdate').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ ...productAValid, stock: 8 });
        }
        return Promise.resolve(null); // Collision!
      });

      const compensationSpy = vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue(true);

      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [
            { product: productA._id, quantity: 2 },
            { product: productB._id, quantity: 1 },
          ],
          shippingAddress: validShippingAddress,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Concurrent inventory conflict');

      // Crucial: Compensation rollback must restore the 2 units of Product A
      expect(compensationSpy).toHaveBeenCalledWith(
        productA._id,
        { $inc: { stock: 2 } }
      );
    });
  });

  // =========================================================================
  // 3. PAYMENT FAILURE RESTITUTION & ROLLBACK LIFECYCLE
  // =========================================================================
  describe('Stripe Webhook Payment Failure Restitution Lifecycle', () => {
    it('should restore inventory and transition order to cancelled when payment fails', async () => {
      const mockOrder = {
        _id: '65f1a1b2c3d4e5f6a7b8c888',
        user: mockBuyer._id,
        orderItems: [
          {
            product: productA._id,
            name: productA.name,
            price: 50,
            quantity: 3,
          },
        ],
        totalPrice: 162,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        stripePaymentIntentId: 'pi_test_failure_123',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Order, 'findOne').mockResolvedValue(mockOrder);
      const stockRestoreSpy = vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue(true);
      const cacheClearSpy = vi.spyOn(catalogCache, 'clear');

      const mockFailureEvent = {
        id: 'evt_test_failure_full',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failure_123',
            metadata: { orderId: mockOrder._id },
            last_payment_error: {
              message: 'Card was declined due to suspected fraudulent activity.',
            },
          },
        },
      };

      const { payload, signature } = signWebhookPayload(mockFailureEvent);

      const res = await request(app)
        .post('/api/v1/orders/webhook-checkout')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      // Verify order cancelled and failure reason captured
      expect(mockOrder.paymentStatus).toBe('failed');
      expect(mockOrder.orderStatus).toBe('cancelled');
      expect(mockOrder.cancellationReason).toBe(
        'Card was declined due to suspected fraudulent activity.'
      );

      // Verify all 3 reserved units restored to stock
      expect(stockRestoreSpy).toHaveBeenCalledWith(
        productA._id,
        { $inc: { stock: 3 } }
      );

      // Verify catalog cache cleared
      expect(cacheClearSpy).toHaveBeenCalled();
    });

    it('should be strictly idempotent and prevent double-restoring stock on webhook retries', async () => {
      // Order is already marked cancelled/failed
      const alreadyCancelledOrder = {
        _id: '65f1a1b2c3d4e5f6a7b8c888',
        user: mockBuyer._id,
        orderItems: [{ product: productA._id, quantity: 3 }],
        paymentStatus: 'failed',
        orderStatus: 'cancelled',
        save: vi.fn(),
      };

      vi.spyOn(Order, 'findOne').mockResolvedValue(alreadyCancelledOrder);
      const stockRestoreSpy = vi.spyOn(Product, 'findByIdAndUpdate');

      const mockRetryEvent = {
        id: 'evt_test_retry',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failure_123',
            metadata: { orderId: alreadyCancelledOrder._id },
          },
        },
      };

      const { payload, signature } = signWebhookPayload(mockRetryEvent);

      const res = await request(app)
        .post('/api/v1/orders/webhook-checkout')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.alreadyProcessed).toBe(true);

      // Crucial: Must NOT restore stock again on retry
      expect(stockRestoreSpy).not.toHaveBeenCalled();
      expect(alreadyCancelledOrder.save).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. COMPLETE END-TO-END PAYMENT RECONCILIATION
  // =========================================================================
  describe('Full Order Lifecycle: Create -> Payment Webhook -> Verification', () => {
    it('should execute end-to-end lifecycle from creation to paid processing', async () => {
      vi.spyOn(User, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockBuyer),
        then: (resolve) => resolve(mockBuyer),
      });

      vi.spyOn(Product, 'find').mockReturnValue({
        session: vi.fn().mockReturnThis(),
        then: (resolve) => resolve([productA]),
      });

      const decrementSpy = vi.spyOn(Product, 'findOneAndUpdate').mockResolvedValue(productA);
      vi.spyOn(Cart, 'findOneAndUpdate').mockResolvedValue(true);

      const savedOrder = {
        _id: '65f1a1b2c3d4e5f6a7b8c555',
        user: mockBuyer._id,
        orderItems: [{ product: productA._id, name: productA.name, price: 50, quantity: 1 }],
        totalPrice: 59.99,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        stripePaymentIntentId: 'pi_test_e2e_555',
        stripeClientSecret: 'pi_test_e2e_555_secret',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Order.prototype, 'save').mockImplementation(function () {
        this._id = savedOrder._id;
        return Promise.resolve(this);
      });

      const token = signTestToken(mockBuyer._id);

      // 1) Step: Place Order
      const createRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderItems: [{ product: productA._id, quantity: 1 }],
          shippingAddress: validShippingAddress,
        });

      expect(createRes.status).toBe(201);
      expect(decrementSpy).toHaveBeenCalled();

      // 2) Step: Stripe Payment Succeeded Webhook
      vi.spyOn(Order, 'findOne').mockResolvedValue(savedOrder);

      const successEvent = {
        id: 'evt_test_e2e_success',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_e2e_555',
            metadata: { orderId: savedOrder._id },
          },
        },
      };

      const { payload, signature } = signWebhookPayload(successEvent);

      const webhookRes = await request(app)
        .post('/api/v1/orders/webhook-checkout')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(webhookRes.status).toBe(200);
      expect(savedOrder.paymentStatus).toBe('paid');
      expect(savedOrder.orderStatus).toBe('processing');

      // 3) Step: Customer checks order details
      vi.spyOn(Order, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        then: (resolve) =>
          resolve({
            ...savedOrder,
            user: { _id: mockBuyer._id, name: mockBuyer.name },
          }),
      });

      const getOrderRes = await request(app)
        .get(`/api/v1/orders/${savedOrder._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getOrderRes.status).toBe(200);
      expect(getOrderRes.body.data.order.paymentStatus).toBe('paid');
      expect(getOrderRes.body.data.order.orderStatus).toBe('processing');
    });
  });
});
