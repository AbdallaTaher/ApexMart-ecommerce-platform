import { describe, it, expect, beforeEach, vi } from 'vitest';
const request = require('supertest');
const Stripe = require('stripe');
const app = require('../../backend/app');
const Order = require('../../backend/models/orderModel');
const Product = require('../../backend/models/productModel');
const { catalogCache } = require('../../backend/utils/cacheLayer');

describe('Stripe Webhook Listener & Event Reconciliation Integration Suite (Slice 5 - Task 19)', () => {
  const mockOrderId = '65f1a1b2c3d4e5f6a7b8c777';
  const mockPaymentIntentId = 'pi_test_payment_intent_999';
  const TEST_WEBHOOK_SECRET = 'whsec_test_mock_webhook_secret_key_32_chars';

  const mockProduct = {
    _id: '65f1a1b2c3d4e5f6a7b8c910',
    name: 'Designing Data-Intensive Applications',
    stock: 19,
  };

  const createMockOrder = (overrides) => {
    return {
      _id: mockOrderId,
      user: '65f1a1b2c3d4e5f6a7b8c111',
      orderItems: [
        {
          product: mockProduct._id,
          name: mockProduct.name,
          price: 50,
          quantity: 2,
        },
      ],
      totalPrice: 108,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      stripePaymentIntentId: mockPaymentIntentId,
      save: vi.fn().mockResolvedValue(true),
      ...overrides,
    };
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
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_secret_key';
    process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    catalogCache.clear();
  });

  // =========================================================================
  // 1. SIGNATURE VERIFICATION DEFENSE
  // =========================================================================
  describe('Cryptographic Signature Verification', () => {
    it('POST /api/v1/orders/webhook-checkout - should return 400 when signature header is missing or invalid', async () => {
      const res = await request(app)
        .post('/api/v1/orders/webhook-checkout')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 't=123,v1=invalid_tampered_signature')
        .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

      expect(res.status).toBe(400);
      expect(res.text).toContain('Webhook Signature Verification Error');
    });

    it('POST /api/v1/orders/webhook-checkout - should return 400 when signature header is completely missing', async () => {
      const res = await request(app)
        .post('/api/v1/orders/webhook-checkout')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

      expect(res.status).toBe(400);
      expect(res.text).toContain('Webhook Signature Verification Error');
    });
  });

  // =========================================================================
  // 2. PAYMENT SUCCEEDED EVENT RECONCILIATION
  // =========================================================================
  describe('Event: payment_intent.succeeded', () => {
    it('should reconcile pending order to paid and processing on payment success', async () => {
      const mockOrder = createMockOrder();
      vi.spyOn(Order, 'findOne').mockResolvedValue(mockOrder);

      const mockEvent = {
        id: 'evt_test_success_1',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: mockPaymentIntentId,
            metadata: { orderId: mockOrderId },
          },
        },
      };

      const { payload, signature } = signWebhookPayload(mockEvent);

      const res = await request(app)
        .post('/api/v1/orders/webhook-checkout')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      expect(mockOrder.paymentStatus).toBe('paid');
      expect(mockOrder.orderStatus).toBe('processing');
      expect(mockOrder.paidAt).toBeInstanceOf(Date);
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should be idempotent and ignore duplicate payment_intent.succeeded events', async () => {
      const mockAlreadyPaidOrder = createMockOrder({
        paymentStatus: 'paid',
        orderStatus: 'processing',
        paidAt: new Date(),
      });
      vi.spyOn(Order, 'findOne').mockResolvedValue(mockAlreadyPaidOrder);

      const mockEvent = {
        id: 'evt_test_success_duplicate',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: mockPaymentIntentId,
            metadata: { orderId: mockOrderId },
          },
        },
      };

      const { payload, signature } = signWebhookPayload(mockEvent);

      const res = await request(app)
        .post('/api/v1/orders/webhook-checkout')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.alreadyProcessed).toBe(true);
      expect(mockAlreadyPaidOrder.save).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. PAYMENT FAILED & STOCK ROLLBACK (MODULE 04)
  // =========================================================================
  describe('Event: payment_intent.payment_failed (Stock Restitution)', () => {
    it('should mark order failed, record reason, and restore inventory stock', async () => {
      const mockOrder = createMockOrder();
      vi.spyOn(Order, 'findOne').mockResolvedValue(mockOrder);

      const stockUpdateSpy = vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue(true);
      const cacheClearSpy = vi.spyOn(catalogCache, 'clear');

      const mockEvent = {
        id: 'evt_test_failed_1',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: mockPaymentIntentId,
            metadata: { orderId: mockOrderId },
            last_payment_error: {
              message: 'Your card has insufficient funds.',
            },
          },
        },
      };

      const { payload, signature } = signWebhookPayload(mockEvent);

      const res = await request(app)
        .post('/api/v1/orders/webhook-checkout')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      expect(mockOrder.paymentStatus).toBe('failed');
      expect(mockOrder.orderStatus).toBe('cancelled');
      expect(mockOrder.cancelledAt).toBeInstanceOf(Date);
      expect(mockOrder.cancellationReason).toBe('Your card has insufficient funds.');
      expect(mockOrder.save).toHaveBeenCalled();

      // Verify stock was restored (+2 items back to inventory)
      expect(stockUpdateSpy).toHaveBeenCalledWith(
        mockProduct._id,
        { $inc: { stock: 2 } }
      );

      // Verify catalog cache cleared
      expect(cacheClearSpy).toHaveBeenCalled();
    });

    it('should be idempotent and not double-restore stock if failure event is retried', async () => {
      const mockAlreadyCancelledOrder = createMockOrder({
        paymentStatus: 'failed',
        orderStatus: 'cancelled',
        cancelledAt: new Date(),
      });
      vi.spyOn(Order, 'findOne').mockResolvedValue(mockAlreadyCancelledOrder);
      const stockUpdateSpy = vi.spyOn(Product, 'findByIdAndUpdate');

      const mockEvent = {
        id: 'evt_test_failed_duplicate',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: mockPaymentIntentId,
            metadata: { orderId: mockOrderId },
          },
        },
      };

      const { payload, signature } = signWebhookPayload(mockEvent);

      const res = await request(app)
        .post('/api/v1/orders/webhook-checkout')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.alreadyProcessed).toBe(true);

      // Crucial: Must NOT restore stock again
      expect(stockUpdateSpy).not.toHaveBeenCalled();
      expect(mockAlreadyCancelledOrder.save).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. UNKNOWN ORDERS & OTHER STRIPE EVENTS
  // =========================================================================
  describe('Edge Cases & Graceful Degradation', () => {
    it('should return 200 with warning when order is not found for PaymentIntent', async () => {
      vi.spyOn(Order, 'findOne').mockResolvedValue(null);

      const mockEvent = {
        id: 'evt_test_unknown_order',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_unknown_123',
            metadata: { orderId: '65f1a1b2c3d4e5f6a7b8c000' },
          },
        },
      };

      const { payload, signature } = signWebhookPayload(mockEvent);

      const res = await request(app)
        .post('/api/v1/orders/webhook-checkout')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.warning).toContain('Order not found');
    });

    it('should acknowledge unhandled event types with 200 { received: true }', async () => {
      const mockEvent = {
        id: 'evt_test_unhandled_type',
        type: 'customer.created',
        data: { object: { id: 'cus_123' } },
      };

      const { payload, signature } = signWebhookPayload(mockEvent);

      const res = await request(app)
        .post('/api/v1/orders/webhook-checkout')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });
  });
});
