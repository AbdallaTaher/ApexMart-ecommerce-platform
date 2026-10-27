import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
const { calculateCurrentPrice, verifyAndFormatCart } = require('../../backend/utils/cartHelper');
const Product = require('../../backend/models/productModel');

describe('Cart Helper Unit Tests (Security & Pricing Calculations)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateCurrentPrice', () => {
    it('returns 0 if product is undefined or null', () => {
      expect(calculateCurrentPrice(null)).toBe(0);
      expect(calculateCurrentPrice(undefined)).toBe(0);
    });

    it('returns regular price when no discounts or deals exist', () => {
      const product = { price: 49.99, priceDiscount: 0, isDeal: false };
      expect(calculateCurrentPrice(product)).toBe(49.99);
    });

    it('prioritizes direct priceDiscount over regular price', () => {
      const product = { price: 100, priceDiscount: 79, isDeal: false };
      expect(calculateCurrentPrice(product)).toBe(79);
    });

    it('applies deal percentage discount accurately', () => {
      const product = { price: 200, priceDiscount: 0, isDeal: true, dealDiscountPercentage: 25 };
      expect(calculateCurrentPrice(product)).toBe(150);
    });
  });

  describe('verifyAndFormatCart', () => {
    it('returns empty cart summary when input is empty or invalid', async () => {
      const result = await verifyAndFormatCart([]);
      expect(result.items).toEqual([]);
      expect(result.summary.itemsCount).toBe(0);
      expect(result.summary.subtotal).toBe(0);
      expect(result.summary.freeShippingEligible).toBe(false);
      expect(result.summary.shippingFee).toBe(0);
      expect(result.summary.total).toBe(0);
      expect(result.hasUnavailableItems).toBe(false);
      expect(result.hasStockAdjustments).toBe(false);
    });

    it('flags missing or soft-deleted products as UNAVAILABLE', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      });

      const result = await verifyAndFormatCart([{ product: fakeId, quantity: 2 }]);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('UNAVAILABLE');
      expect(result.items[0].isAvailable).toBe(false);
      expect(result.items[0].effectiveQuantity).toBe(0);
      expect(result.hasUnavailableItems).toBe(true);
      expect(result.summary.subtotal).toBe(0);
    });

    it('flags out-of-stock products as OUT_OF_STOCK', async () => {
      const pId = new mongoose.Types.ObjectId();
      const mockProduct = {
        _id: pId,
        name: 'Sold Out Item',
        slug: 'sold-out-item',
        price: 50,
        stock: 0,
        isActive: true,
      };

      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockProduct]),
      });

      const result = await verifyAndFormatCart([{ product: pId.toString(), quantity: 1 }]);

      expect(result.items[0].status).toBe('OUT_OF_STOCK');
      expect(result.items[0].isAvailable).toBe(false);
      expect(result.items[0].availableStock).toBe(0);
      expect(result.items[0].effectiveQuantity).toBe(0);
      expect(result.hasUnavailableItems).toBe(true);
      expect(result.summary.subtotal).toBe(0);
    });

    it('adjusts quantity and flags LIMITED_STOCK when requested quantity exceeds available inventory', async () => {
      const pId = new mongoose.Types.ObjectId();
      const mockProduct = {
        _id: pId,
        name: 'Limited Item',
        slug: 'limited-item',
        price: 20,
        stock: 3,
        isActive: true,
      };

      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockProduct]),
      });

      const result = await verifyAndFormatCart([{ product: pId.toString(), quantity: 10 }]);

      expect(result.items[0].status).toBe('LIMITED_STOCK');
      expect(result.items[0].isAvailable).toBe(true);
      expect(result.items[0].availableStock).toBe(3);
      expect(result.items[0].effectiveQuantity).toBe(3);
      expect(result.items[0].lineTotal).toBe(60); // 3 * $20
      expect(result.hasStockAdjustments).toBe(true);
      expect(result.summary.itemsCount).toBe(3);
      expect(result.summary.subtotal).toBe(60);
    });

    it('calculates full cart with free shipping when subtotal >= $35', async () => {
      const pId = new mongoose.Types.ObjectId();
      const mockProduct = {
        _id: pId,
        name: 'Premium Item',
        slug: 'premium-item',
        price: 40,
        stock: 10,
        isActive: true,
      };

      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockProduct]),
      });

      const result = await verifyAndFormatCart([{ product: pId.toString(), quantity: 1 }]);

      expect(result.items[0].status).toBe('IN_STOCK');
      expect(result.summary.subtotal).toBe(40);
      expect(result.summary.freeShippingEligible).toBe(true);
      expect(result.summary.amountUntilFreeShipping).toBe(0);
      expect(result.summary.shippingFee).toBe(0);
      expect(result.summary.estimatedTax).toBe(3.2); // 8% of 40
      expect(result.summary.total).toBe(43.2);
    });

    it('charges standard $5.99 shipping when subtotal < $35', async () => {
      const pId = new mongoose.Types.ObjectId();
      const mockProduct = {
        _id: pId,
        name: 'Book',
        slug: 'book',
        price: 25,
        stock: 10,
        isActive: true,
      };

      vi.spyOn(Product, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockProduct]),
      });

      const result = await verifyAndFormatCart([{ product: pId.toString(), quantity: 1 }]);

      expect(result.summary.subtotal).toBe(25);
      expect(result.summary.freeShippingEligible).toBe(false);
      expect(result.summary.amountUntilFreeShipping).toBe(10);
      expect(result.summary.shippingFee).toBe(5.99);
      expect(result.summary.estimatedTax).toBe(2); // 8% of 25
      expect(result.summary.total).toBe(32.99); // 25 + 5.99 + 2
    });
  });
});
