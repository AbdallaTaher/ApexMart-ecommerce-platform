import { describe, it, expect, beforeEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const express = require('express');
const app = require('../../backend/app');
const Product = require('../../backend/models/productModel');
const Category = require('../../backend/models/categoryModel');
const User = require('../../backend/models/userModel');
const { CacheLayer, catalogCache } = require('../../backend/utils/cacheLayer');
const latencyBudgetMiddleware = require('../../backend/utils/latencyBudget');

describe('Catalog Security, Latency Budgets & Caching Suite (Slice 2 - Task 11)', () => {
  const TEST_JWT_SECRET = 'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';

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
    const id = overrides?._id || '65f1a1b2c3d4e5f6a7b8c9d2';
    return {
      _id: id,
      id: id.toString(),
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      active: true,
      changedPasswordAfter: vi.fn().mockReturnValue(false),
      loggedOutAfter: vi.fn().mockReturnValue(false),
      ...overrides,
    };
  };

  const mockSeller = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d2',
    name: 'Sony Official Merchant',
    email: 'seller@example.com',
    role: 'seller',
  });

  const mockAdmin = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d6',
    name: 'Apex Superadmin',
    email: 'admin@apexmart.internal',
    role: 'admin',
  });

  const mockCategory = {
    _id: '65f1a1b2c3d4e5f6a7b8c9d1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Laptops, headphones, gadgets',
    icon: 'laptop',
    image: 'https://example.com/cat.jpg',
    displayOrder: 1,
    isActive: true,
  };

  const mockProduct = {
    _id: '65f1a1b2c3d4e5f6a7b8c9d0',
    name: 'SonicWave Wireless Noise-Canceling Headphones',
    slug: 'sonicwave-wireless-noise-canceling-headphones',
    description: 'Top-tier active noise cancellation and spatial audio.',
    price: 349,
    priceDiscount: 279,
    category: {
      _id: '65f1a1b2c3d4e5f6a7b8c9d1',
      name: 'Electronics',
      slug: 'electronics',
      icon: 'laptop',
    },
    brand: 'AcoustiQ',
    seller: {
      _id: '65f1a1b2c3d4e5f6a7b8c9d2',
      name: 'Sony Official Merchant',
      email: 'seller@example.com',
      role: 'seller',
    },
    imageCover: 'https://example.com/cover.jpg',
    images: ['https://example.com/img1.jpg'],
    stock: 50,
    ratingsAverage: 4.8,
    ratingsQuantity: 124,
    isFeatured: true,
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
    vi.spyOn(Category, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockCategory),
    });
  });

  // =========================================================================
  // 1. LATENCY BUDGET & PERFORMANCE MONITORING
  // =========================================================================
  describe('Latency Budget Monitoring (<300ms Budget)', () => {
    it('should inject X-Latency-Budget: 300ms header on all responses', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-latency-budget']).toBe('300ms');
    });

    it('should measure response time and inject X-Response-Time header', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.headers['x-response-time']).toBeDefined();
      expect(res.headers['x-response-time']).toMatch(/^\d+(\.\d+)?ms$/);
    });

    it('should calculate accurate duration with custom budget middleware', async () => {
      const testApp = express();
      testApp.use(latencyBudgetMiddleware(150));
      testApp.get('/test-latency', (req, res) => {
        res.status(200).json({ ok: true });
      });

      const res = await request(testApp).get('/test-latency');
      expect(res.status).toBe(200);
      expect(res.headers['x-latency-budget']).toBe('150ms');
      expect(res.headers['x-response-time']).toMatch(/^\d+(\.\d+)?ms$/);
    });
  });

  // =========================================================================
  // 2. IN-MEMORY CACHE-ASIDE ENGINE (TTL, LRU, HIT/MISS TELEMETRY)
  // =========================================================================
  describe('In-Memory Cache-Aside Engine (CacheLayer)', () => {
    it('should set and get values with hit/miss counter telemetry', () => {
      const cache = new CacheLayer({ maxEntries: 10, defaultTTL: 5000 });

      expect(cache.get('unknown-key')).toBeNull();
      const statsAfterMiss = cache.getStats();
      expect(statsAfterMiss.misses).toBe(1);
      expect(statsAfterMiss.hits).toBe(0);

      cache.set('user:101', { name: 'Alice' });
      const cached = cache.get('user:101');
      expect(cached).toEqual({ name: 'Alice' });

      const statsAfterHit = cache.getStats();
      expect(statsAfterHit.hits).toBe(1);
      expect(statsAfterHit.hitRatio).toBe('0.500');
    });

    it('should respect TTL expiration', async () => {
      const cache = new CacheLayer({ maxEntries: 10, defaultTTL: 20 });
      cache.set('short-lived', { secret: 42 }, 20);

      expect(cache.get('short-lived')).toEqual({ secret: 42 });

      // Wait 30ms for expiration
      await new Promise((r) => setTimeout(r, 35));

      expect(cache.get('short-lived')).toBeNull();
    });

    it('should evict the least recently used (LRU) entry when maxEntries is exceeded', () => {
      const cache = new CacheLayer({ maxEntries: 3, defaultTTL: 60000 });

      cache.set('key1', 'val1');
      cache.set('key2', 'val2');
      cache.set('key3', 'val3');

      // Access key1 to make it most recently used
      cache.get('key1');

      // Inserting 4th item should evict key2 (oldest unaccessed item)
      cache.set('key4', 'val4');

      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key1')).toBe('val1');
      expect(cache.get('key3')).toBe('val3');
      expect(cache.get('key4')).toBe('val4');
    });

    it('should normalize deterministic keys regardless of query parameter ordering', () => {
      const cache = new CacheLayer();

      const reqA = { baseUrl: '/api/v1/products', path: '/', query: { sort: 'price', limit: '10', page: '1' } };
      const reqB = { baseUrl: '/api/v1/products', path: '/', query: { page: '1', sort: 'price', limit: '10' } };

      const keyA = cache.generateKey(reqA);
      const keyB = cache.generateKey(reqB);

      expect(keyA).toBe(keyB);
      expect(keyA).toBe('/api/v1/products?limit=10&page=1&sort=price');
    });

    it('should invalidate keys matching string prefix or regex pattern', () => {
      const cache = new CacheLayer();
      cache.set('/api/v1/products', [1]);
      cache.set('/api/v1/products/top-deals', [2]);
      cache.set('/api/v1/categories', [3]);

      cache.invalidate('/api/v1/products');

      expect(cache.get('/api/v1/products')).toBeNull();
      expect(cache.get('/api/v1/products/top-deals')).toBeNull();
      expect(cache.get('/api/v1/categories')).toEqual([3]);
    });
  });

  // =========================================================================
  // 3. CATALOG API CACHE INTEGRATION & HIT/MISS HEADERS
  // =========================================================================
  describe('Catalog Cache-Aside Route Integration', () => {
    it('GET /api/v1/products - should return X-Cache: MISS on first request, and X-Cache: HIT on subsequent request', async () => {
      const findSpy = vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([mockProduct]));
      vi.spyOn(Product, 'countDocuments').mockResolvedValue(1);

      // First request -> Cache MISS
      const res1 = await request(app).get('/api/v1/products');
      expect(res1.status).toBe(200);
      expect(res1.headers['x-cache']).toBe('MISS');
      expect(findSpy).toHaveBeenCalledTimes(2);

      // Second identical request -> Cache HIT (database query NOT called again)
      const res2 = await request(app).get('/api/v1/products');
      expect(res2.status).toBe(200);
      expect(res2.headers['x-cache']).toBe('HIT');
      expect(res2.body.data.data[0].name).toBe(mockProduct.name);
      expect(findSpy).toHaveBeenCalledTimes(2);
    });

    it('GET /api/v1/categories - should cache category lists with X-Cache: HIT', async () => {
      const catSpy = vi.spyOn(Category, 'find').mockReturnValue(createMockQuery([mockCategory]));

      const res1 = await request(app).get('/api/v1/categories');
      expect(res1.status).toBe(200);
      expect(res1.headers['x-cache']).toBe('MISS');

      const res2 = await request(app).get('/api/v1/categories');
      expect(res2.status).toBe(200);
      expect(res2.headers['x-cache']).toBe('HIT');
      expect(catSpy).toHaveBeenCalledTimes(1);
    });

    it('GET /api/v1/products/top-deals - should cache deals feeds', async () => {
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([mockProduct]));
      vi.spyOn(Product, 'countDocuments').mockResolvedValue(1);

      const res1 = await request(app).get('/api/v1/products/top-deals');
      expect(res1.status).toBe(200);
      expect(res1.headers['x-cache']).toBe('MISS');

      const res2 = await request(app).get('/api/v1/products/top-deals');
      expect(res2.status).toBe(200);
      expect(res2.headers['x-cache']).toBe('HIT');
    });

    it('different query filters should be cached independently', async () => {
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([mockProduct]));
      vi.spyOn(Product, 'countDocuments').mockResolvedValue(1);

      const resElectronics = await request(app).get('/api/v1/products?category=electronics');
      expect(resElectronics.headers['x-cache']).toBe('MISS');

      const resBooks = await request(app).get('/api/v1/products?category=books');
      expect(resBooks.headers['x-cache']).toBe('MISS');

      // Now electronics should HIT
      const resElectronics2 = await request(app).get('/api/v1/products?category=electronics');
      expect(resElectronics2.headers['x-cache']).toBe('HIT');
    });
  });

  // =========================================================================
  // 4. CACHE INVALIDATION ON MUTATIONS
  // =========================================================================
  describe('Cache Invalidation on State Mutations', () => {
    it('creating a product should invalidate product catalog cache', async () => {
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([mockProduct]));
      vi.spyOn(Product, 'countDocuments').mockResolvedValue(1);

      // 1) Prime cache
      const resPrime = await request(app).get('/api/v1/products');
      expect(resPrime.headers['x-cache']).toBe('MISS');

      const resCached = await request(app).get('/api/v1/products');
      expect(resCached.headers['x-cache']).toBe('HIT');

      // 2) Mutate product via Seller POST /api/v1/products
      mockAuthUser(mockSeller);
      vi.spyOn(Category, 'findById').mockResolvedValue(mockCategory);
      vi.spyOn(Product, 'create').mockResolvedValue(mockProduct);

      const sellerToken = signTestToken(mockSeller._id);
      const resPost = await request(app)
        .post('/api/v1/products')
        .set('Cookie', `jwt=${sellerToken}`)
        .send({
          name: 'Sony WH-1000XM5 Wireless Headphones',
          description: 'High-res audio headphones with ANC.',
          price: 399,
          category: mockCategory._id,
          brand: 'Sony',
          stock: 25,
        });

      expect(resPost.status).toBe(201);

      // 3) GET /api/v1/products should now MISS because cache was invalidated
      const resAfterMutation = await request(app).get('/api/v1/products');
      expect(resAfterMutation.headers['x-cache']).toBe('MISS');
    });

    it('creating a category should invalidate category and product cache', async () => {
      // 1) Prime category cache
      vi.spyOn(Category, 'find').mockReturnValue(createMockQuery([mockCategory]));
      const catRes1 = await request(app).get('/api/v1/categories');
      expect(catRes1.headers['x-cache']).toBe('MISS');

      const catRes2 = await request(app).get('/api/v1/categories');
      expect(catRes2.headers['x-cache']).toBe('HIT');

      // 2) Admin creates category
      mockAuthUser(mockAdmin);
      vi.spyOn(Category, 'create').mockResolvedValue({
        _id: '65f1a1b2c3d4e5f6a7b8c9d3',
        name: 'Books',
        slug: 'books',
        icon: 'book',
      });

      const adminToken = signTestToken(mockAdmin._id);
      const resCreate = await request(app)
        .post('/api/v1/categories')
        .set('Cookie', `jwt=${adminToken}`)
        .send({
          name: 'Books',
          icon: 'book',
        });

      expect(resCreate.status).toBe(201);

      // 3) Category cache should now MISS
      const catResAfter = await request(app).get('/api/v1/categories');
      expect(catResAfter.headers['x-cache']).toBe('MISS');
    });
  });

  // =========================================================================
  // 5. RATE LIMITING HEADERS & DEFENSIVE THROTTLING
  // =========================================================================
  describe('Tiered Rate Limiting Defense', () => {
    it('should include RateLimit standard headers on public catalog endpoints', async () => {
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([mockProduct]));
      vi.spyOn(Product, 'countDocuments').mockResolvedValue(1);

      const res = await request(app).get('/api/v1/products');

      expect(res.status).toBe(200);
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
    });

    it('should include RateLimit standard headers on auth endpoints', async () => {
      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app).post('/api/v1/users/login').send({
        email: 'nobody@example.com',
        password: 'password123',
      });

      // Login fails with 401, but rate limit headers must be present
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
    });

    it('should return 429 Too Many Requests when rate limit threshold is exceeded', async () => {
      const rateLimit = require('express-rate-limit');
      const AppError = require('../../backend/utils/appError');
      const globalErrorHandler = require('../../backend/controllers/errorController');

      const testApp = express();
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
          next(new AppError('Too many search requests. Please slow down.', 429));
        },
      });

      testApp.get('/test-limit', testLimiter, (req, res) => {
        res.status(200).json({ status: 'success' });
      });
      testApp.use(globalErrorHandler);

      // Req 1: OK
      const r1 = await request(testApp).get('/test-limit');
      expect(r1.status).toBe(200);

      // Req 2: OK
      const r2 = await request(testApp).get('/test-limit');
      expect(r2.status).toBe(200);

      // Req 3: Exceeded -> 429
      const r3 = await request(testApp).get('/test-limit');
      expect(r3.status).toBe(429);
      expect(r3.body.status).toBe('fail');
      expect(r3.body.message).toContain('Too many search requests');
    });
  });
});
