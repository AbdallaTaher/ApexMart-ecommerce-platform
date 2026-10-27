import { describe, it, expect } from 'vitest';
import sampleProducts from '../fixtures/sampleProducts.json';
import sampleUsers from '../fixtures/sampleUsers.json';
import sampleOrders from '../fixtures/sampleOrders.json';

describe('Deterministic Test Fixtures Verification', () => {
  it('should load sample products with valid prices and stock', () => {
    expect(sampleProducts.length).toBeGreaterThan(0);
    sampleProducts.forEach((product) => {
      expect(product._id).toBeDefined();
      expect(product.price).toBeGreaterThan(0);
      expect(product.discountPrice).toBeLessThanOrEqual(product.price);
      expect(product.stock).toBeGreaterThanOrEqual(0);
    });
  });

  it('should load sample users covering all roles (user, seller, admin)', () => {
    const roles = sampleUsers.map((u) => u.role);
    expect(roles).toContain('user');
    expect(roles).toContain('seller');
    expect(roles).toContain('admin');
  });

  it('should load sample orders with idempotency key and items', () => {
    expect(sampleOrders.length).toBeGreaterThan(0);
    const order = sampleOrders[0];
    expect(order.idempotencyKey).toBeDefined();
    expect(order.items.length).toBeGreaterThan(0);
    expect(order.totalPrice).toBeGreaterThan(0);
  });
});
