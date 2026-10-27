import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../backend/app');
const Product = require('../../backend/models/productModel');
const Category = require('../../backend/models/categoryModel');
const User = require('../../backend/models/userModel');
const { catalogCache } = require('../../backend/utils/cacheLayer');

describe('Product Taxonomy & Catalog Discovery Integration Suite (Slice 2 - Task 09)', () => {
  beforeEach(() => {
    catalogCache.clear();
  });

  const TEST_JWT_SECRET = 'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';

  // Helper to create valid mock users with required methods
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

  const mockBuyer = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d5',
    name: 'Alex Buyer',
    email: 'buyer@example.com',
    role: 'user',
  });

  const mockSeller = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d2',
    name: 'Sony Official Merchant',
    email: 'seller@example.com',
    role: 'seller',
  });

  const mockOtherSeller = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d8',
    name: 'Rival Seller',
    email: 'rival@example.com',
    role: 'seller',
  });

  const mockAdmin = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d6',
    name: 'Apex Superadmin',
    email: 'admin@apexmart.internal',
    role: 'admin',
  });

  // Sample Mock Entities
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
    ratingsQuantity: 120,
    isFeatured: true,
    isDeal: true,
    dealDiscountPercentage: 20,
    badge: "Amazon's Choice",
    specifications: [{ key: 'Battery', value: '45 Hours' }],
    isActive: true,
  };

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.JWT_EXPIRES_IN = '7d';
    process.env.JWT_COOKIE_EXPIRES_IN = '7';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper to construct chainable Mongoose mock query objects
   */
  const createMockQuery = (resolvedValue, count = 1) => {
    const query = {
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
    return query;
  };

  /**
   * Helper to sign a valid JWT for authentication
   */
  const signTestToken = (userId) => {
    return jwt.sign(
      { id: userId, iat: Math.floor(Date.now() / 1000) - 10 },
      TEST_JWT_SECRET,
      { expiresIn: '7d' }
    );
  };

  /**
   * Mock User.findById for auth middleware protect verification
   */
  const mockAuthUser = (user) => {
    vi.spyOn(User, 'findById').mockImplementation(() => createMockQuery(user));
  };

  // =========================================================================
  // 1. PUBLIC CATEGORY DISCOVERY
  // =========================================================================
  describe('Public Category Discovery Endpoints', () => {
    it('GET /api/v1/categories - should return 200 with list of active categories', async () => {
      vi.spyOn(Category, 'find').mockReturnValue(createMockQuery([mockCategory]));

      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(1);
      expect(res.body.data.data[0].slug).toBe('electronics');
    });

    it('GET /api/v1/categories/slug/:slug - should return 200 with category matching URL slug', async () => {
      vi.spyOn(Category, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockCategory),
      });

      const res = await request(app).get('/api/v1/categories/slug/electronics');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.category.name).toBe('Electronics');
      expect(res.body.data.category.slug).toBe('electronics');
    });

    it('GET /api/v1/categories/slug/:slug - should return 404 when slug does not exist', async () => {
      vi.spyOn(Category, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app).get('/api/v1/categories/slug/unknown-category');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('No category found with that slug');
    });

    it('GET /api/v1/categories/:id - should return 200 with category matching ID', async () => {
      vi.spyOn(Category, 'findById').mockReturnValue(createMockQuery(mockCategory));

      const res = await request(app).get(`/api/v1/categories/${mockCategory._id}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.name).toBe('Electronics');
    });
  });

  // =========================================================================
  // 2. ADMINISTRATIVE CATEGORY GOVERNANCE
  // =========================================================================
  describe('Administrative Category Governance (RBAC Protected)', () => {
    it('POST /api/v1/categories - should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Home Appliances' });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in');
    });

    it('POST /api/v1/categories - should return 403 when user is buyer or seller', async () => {
      mockAuthUser(mockSeller);
      const token = signTestToken(mockSeller._id);

      const res = await request(app)
        .post('/api/v1/categories')
        .set('Cookie', `jwt=${token}`)
        .send({ name: 'Home Appliances' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission');
    });

    it('POST /api/v1/categories - should return 201 when user is admin', async () => {
      mockAuthUser(mockAdmin);
      const token = signTestToken(mockAdmin._id);

      const newCategory = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d7',
        name: 'Home Appliances',
        slug: 'home-appliances',
      };

      vi.spyOn(Category, 'create').mockResolvedValue(newCategory);

      const res = await request(app)
        .post('/api/v1/categories')
        .set('Cookie', `jwt=${token}`)
        .send({ name: 'Home Appliances' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.name).toBe('Home Appliances');
    });

    it('PATCH /api/v1/categories/:id - should return 200 when updated by admin', async () => {
      mockAuthUser(mockAdmin);
      const token = signTestToken(mockAdmin._id);

      const updatedCategory = { ...mockCategory, name: 'Consumer Electronics' };
      vi.spyOn(Category, 'findByIdAndUpdate').mockResolvedValue(updatedCategory);

      const res = await request(app)
        .patch(`/api/v1/categories/${mockCategory._id}`)
        .set('Cookie', `jwt=${token}`)
        .send({ name: 'Consumer Electronics' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.name).toBe('Consumer Electronics');
    });

    it('DELETE /api/v1/categories/:id - should return 204 when deleted by admin', async () => {
      mockAuthUser(mockAdmin);
      const token = signTestToken(mockAdmin._id);

      vi.spyOn(Category, 'findByIdAndDelete').mockResolvedValue(mockCategory);

      const res = await request(app)
        .delete(`/api/v1/categories/${mockCategory._id}`)
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(204);
    });
  });

  // =========================================================================
  // 3. PUBLIC PRODUCT CATALOG DISCOVERY & SPECIAL FEEDS
  // =========================================================================
  describe('Public Product Catalog Discovery', () => {
    it('GET /api/v1/products - should return 200 with pagination metadata and products', async () => {
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([mockProduct], 1));

      const res = await request(app).get('/api/v1/products?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(1);
      expect(res.body.total).toBe(1);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.data.products[0].name).toBe('SonicWave Wireless Noise-Canceling Headphones');
    });

    it('GET /api/v1/products?categorySlug=electronics - should resolve slug and filter products', async () => {
      vi.spyOn(Category, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockCategory),
      });
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([mockProduct], 1));

      const res = await request(app).get('/api/v1/products?categorySlug=electronics');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(1);
      expect(res.body.data.products[0].slug).toBe(mockProduct.slug);
    });

    it('GET /api/v1/products?categorySlug=non-existent - should return 200 with empty array', async () => {
      vi.spyOn(Category, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app).get('/api/v1/products?categorySlug=non-existent');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(0);
      expect(res.body.total).toBe(0);
      expect(res.body.data.data).toEqual([]);
    });

    it('GET /api/v1/products/top-deals - should alias top deals with discount sorting', async () => {
      const topDealProduct = { ...mockProduct, isDeal: true, dealDiscountPercentage: 25 };
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([topDealProduct], 1));

      const res = await request(app).get('/api/v1/products/top-deals');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.products[0].isDeal).toBe(true);
      expect(res.body.data.products[0].dealDiscountPercentage).toBe(25);
    });

    it('GET /api/v1/products/featured - should alias featured products feed', async () => {
      vi.spyOn(Product, 'find').mockReturnValue(createMockQuery([mockProduct], 1));

      const res = await request(app).get('/api/v1/products/featured');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.products[0].isFeatured).toBe(true);
    });

    it('GET /api/v1/products/slug/:slug - should return 200 with populated product', async () => {
      vi.spyOn(Product, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProduct),
      });

      const res = await request(app).get(`/api/v1/products/slug/${mockProduct.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.product.name).toBe(mockProduct.name);
      expect(res.body.data.product.category.name).toBe('Electronics');
      expect(res.body.data.product.seller.email).toBe('seller@example.com');
    });

    it('GET /api/v1/products/slug/:slug - should return 404 when slug does not exist', async () => {
      vi.spyOn(Product, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app).get('/api/v1/products/slug/non-existent-product-slug');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('No product found with that slug');
    });

    it('GET /api/v1/products/:id - should return 200 with single product by ID', async () => {
      vi.spyOn(Product, 'findById').mockReturnValue(createMockQuery(mockProduct));

      const res = await request(app).get(`/api/v1/products/${mockProduct._id}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.name).toBe(mockProduct.name);
    });

    it('GET /api/v1/products/:id - should return 404 when product ID does not exist', async () => {
      vi.spyOn(Product, 'findById').mockReturnValue(createMockQuery(null));

      const res = await request(app).get('/api/v1/products/65f1a1b2c3d4e5f6a7b8c9d9');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('No document found with that ID');
    });
  });

  // =========================================================================
  // 4. PROTECTED PRODUCT MUTATIONS & IDOR SECURITY GUARDS
  // =========================================================================
  describe('Product Creation & Seller Ownership Governance (IDOR Guards)', () => {
    const validProductPayload = {
      name: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
      description: 'Ultra-clear calls, 30 hours battery life, high-res audio.',
      price: 399,
      priceDiscount: 329,
      category: '65f1a1b2c3d4e5f6a7b8c9d1',
      brand: 'Sony',
      imageCover: 'https://example.com/cover.jpg',
      stock: 40,
    };

    it('POST /api/v1/products - should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send(validProductPayload);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in');
    });

    it('POST /api/v1/products - should return 403 when buyer tries to create product', async () => {
      mockAuthUser(mockBuyer);
      const token = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post('/api/v1/products')
        .set('Cookie', `jwt=${token}`)
        .send(validProductPayload);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission');
    });

    it('POST /api/v1/products - should allow seller and automatically bind seller ID', async () => {
      mockAuthUser(mockSeller);
      const token = signTestToken(mockSeller._id);

      const createdProduct = {
        ...validProductPayload,
        _id: '65f1a1b2c3d4e5f6a7b8c9d9',
        seller: mockSeller._id,
        slug: 'sony-wh-1000xm5-wireless-noise-canceling-headphones',
      };

      vi.spyOn(Product, 'create').mockResolvedValue(createdProduct);

      const res = await request(app)
        .post('/api/v1/products')
        .set('Cookie', `jwt=${token}`)
        .send(validProductPayload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.seller).toBe(mockSeller._id);
    });

    it('PATCH /api/v1/products/:id - should return 403 when seller tries to modify another seller product (IDOR defense)', async () => {
      mockAuthUser(mockOtherSeller);
      const token = signTestToken(mockOtherSeller._id);

      // Product owned by mockSeller._id
      const targetProduct = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d0',
        seller: { toString: () => mockSeller._id },
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(targetProduct);

      const res = await request(app)
        .patch(`/api/v1/products/${targetProduct._id}`)
        .set('Cookie', `jwt=${token}`)
        .send({ price: 199 });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission to manage this product');
    });

    it('PATCH /api/v1/products/:id - should allow owning seller to update their own product', async () => {
      mockAuthUser(mockSeller);
      const token = signTestToken(mockSeller._id);

      const targetProduct = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d0',
        seller: { toString: () => mockSeller._id },
      };

      const updatedProduct = { ...mockProduct, price: 319 };

      vi.spyOn(Product, 'findById').mockResolvedValue(targetProduct);
      vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue(updatedProduct);

      const res = await request(app)
        .patch(`/api/v1/products/${targetProduct._id}`)
        .set('Cookie', `jwt=${token}`)
        .send({ price: 319 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.price).toBe(319);
    });

    it('PATCH /api/v1/products/:id - should allow admin to update any product', async () => {
      mockAuthUser(mockAdmin);
      const token = signTestToken(mockAdmin._id);

      const targetProduct = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d0',
        seller: { toString: () => mockSeller._id },
      };

      const updatedProduct = { ...mockProduct, isFeatured: false };

      vi.spyOn(Product, 'findById').mockResolvedValue(targetProduct);
      vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue(updatedProduct);

      const res = await request(app)
        .patch(`/api/v1/products/${targetProduct._id}`)
        .set('Cookie', `jwt=${token}`)
        .send({ isFeatured: false });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.isFeatured).toBe(false);
    });

    it('DELETE /api/v1/products/:id - should return 403 when rival seller tries to delete product (IDOR defense)', async () => {
      mockAuthUser(mockOtherSeller);
      const token = signTestToken(mockOtherSeller._id);

      const targetProduct = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d0',
        seller: { toString: () => mockSeller._id },
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(targetProduct);

      const res = await request(app)
        .delete(`/api/v1/products/${targetProduct._id}`)
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission to manage this product');
    });

    it('DELETE /api/v1/products/:id - should allow owning seller to delete product', async () => {
      mockAuthUser(mockSeller);
      const token = signTestToken(mockSeller._id);

      const targetProduct = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d0',
        seller: { toString: () => mockSeller._id },
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(targetProduct);
      vi.spyOn(Product, 'findByIdAndDelete').mockResolvedValue(mockProduct);

      const res = await request(app)
        .delete(`/api/v1/products/${targetProduct._id}`)
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(204);
    });

    it('DELETE /api/v1/products/:id - should allow admin to delete any product', async () => {
      mockAuthUser(mockAdmin);
      const token = signTestToken(mockAdmin._id);

      const targetProduct = {
        _id: '65f1a1b2c3d4e5f6a7b8c9d0',
        seller: { toString: () => mockSeller._id },
      };

      vi.spyOn(Product, 'findById').mockResolvedValue(targetProduct);
      vi.spyOn(Product, 'findByIdAndDelete').mockResolvedValue(mockProduct);

      const res = await request(app)
        .delete(`/api/v1/products/${targetProduct._id}`)
        .set('Cookie', `jwt=${token}`);

      expect(res.status).toBe(204);
    });
  });
});
