import { describe, it, expect, vi, beforeEach } from 'vitest';
const request = require('supertest');
const app = require('../../backend/app');
const Product = require('../../backend/models/productModel');
const User = require('../../backend/models/userModel');
const { sanitizeDetails } = require('../../backend/utils/auditLogger');
const { catalogCache } = require('../../backend/utils/cacheLayer');

describe('OWASP & Enterprise Security Architecture Verification Suite (AI-Rules/03-Security-Rules.md)', () => {
  const createMockQuery = (resolvedValue, count = 1) => ({
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
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    catalogCache.clear();
    process.env.JWT_SECRET = 'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';
    process.env.JWT_EXPIRES_IN = '90d';
    process.env.JWT_COOKIE_EXPIRES_IN = '90';
  });

  describe('1. Transport & HTTP Security Headers (Helmet)', () => {
    it('should inject strict security headers on API responses', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
      expect(res.headers['x-download-options']).toBe('noopen');
    });
  });

  describe('2. NoSQL Injection Sanitization (express-mongo-sanitize)', () => {
    it('should strip malicious MongoDB operators ($gt, $ne) from incoming login payloads', async () => {
      const findOneSpy = vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: { $gt: '' },
          password: 'Password123!',
        });

      expect([400, 401]).toContain(res.status);
      if (findOneSpy.mock.calls.length > 0) {
        const queryArg = findOneSpy.mock.calls[0][0];
        expect(JSON.stringify(queryArg)).not.toContain('$gt');
      }
    });
  });

  describe('3. Denial of Service (DoS) Payload Size Limit (10kb)', () => {
    it('should reject oversized JSON payloads exceeding 10kb with 413 status', async () => {
      const giantString = 'A'.repeat(15 * 1024); // 15 KB payload

      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'attacker@example.com',
          password: giantString,
        });

      expect(res.status).toBe(413);
      expect(res.body.message).toMatch(/10KB/i);
    });
  });

  describe('4. Cache-Control Isolation (Public Catalog vs Auth Endpoints)', () => {
    it('should set public SWR Cache-Control headers on public catalog endpoints', async () => {
      vi.spyOn(Product, 'find').mockImplementation(() => createMockQuery([], 0));

      const res = await request(app).get('/api/v1/products/top-deals');

      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toContain('public');
      expect(res.headers['cache-control']).toContain('stale-while-revalidate');
    });

    it('should never cache sensitive authentication endpoints and enforce HttpOnly cookies', async () => {
      const mockUser = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d0',
        id: '65f1a1b2c3d4e5f6a7b8c9d0',
        name: 'Secure Buyer',
        email: 'buyer@example.com',
        role: 'user',
        active: true,
        correctPassword: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app).post('/api/v1/users/login').send({
        email: 'buyer@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toContain('no-store');
      const setCookie = res.headers['set-cookie']?.[0] || '';
      expect(setCookie).toContain('HttpOnly');
    });
  });

  describe('5. Sensitive Credential Redaction in Audit Logs (Module 06)', () => {
    it('should recursively redact passwords, tokens, and secrets from audit log payloads', () => {
      const rawPayload = {
        email: 'user@example.com',
        password: 'SuperSecretPassword123!',
        passwordConfirm: 'SuperSecretPassword123!',
        nested: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          clientSecret: 'pi_123_secret_456',
          safeField: 'visible-value',
        },
      };

      const sanitized = sanitizeDetails(rawPayload);

      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.passwordConfirm).toBe('[REDACTED]');
      expect(sanitized.nested.token).toBe('[REDACTED]');
      expect(sanitized.nested.clientSecret).toBe('[REDACTED]');
      expect(sanitized.nested.safeField).toBe('visible-value');
    });
  });
});
