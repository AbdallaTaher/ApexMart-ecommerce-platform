import { describe, it, expect, beforeEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../backend/app');
const Product = require('../../backend/models/productModel');
const User = require('../../backend/models/userModel');
const { catalogCache } = require('../../backend/utils/cacheLayer');

describe('Product Detail & Multi-Angle Media Integration Suite (Slice 3 - Task 13)', () => {
  const TEST_JWT_SECRET = 'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';

  // Helper to create mock queries with chainable methods
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

  const mockBuyer = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d5',
    name: 'Alex Buyer',
    email: 'buyer@example.com',
    role: 'user',
  });

  const mockSeller = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d2',
    name: 'Sony Official Store',
    email: 'seller@sony.com',
    role: 'seller',
  });

  const mockRivalSeller = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d8',
    name: 'Rival Merchant',
    email: 'rival@merchant.com',
    role: 'seller',
  });

  const mockAdmin = createMockUser({
    _id: '65f1a1b2c3d4e5f6a7b8c9d6',
    name: 'Apex Superadmin',
    email: 'admin@apexmart.internal',
    role: 'admin',
  });

  const mockProduct = {
    _id: '65f1a1b2c3d4e5f6a7b8c9d0',
    id: '65f1a1b2c3d4e5f6a7b8c9d0',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    slug: 'sony-wh-1000xm5-wireless-headphones',
    description: 'Industry-leading noise cancellation with auto NC optimizer.',
    price: 399,
    priceDiscount: 329,
    category: {
      _id: '65f1a1b2c3d4e5f6a7b8c9d1',
      name: 'Electronics',
      slug: 'electronics',
      icon: 'laptop',
    },
    brand: 'Sony',
    seller: {
      _id: '65f1a1b2c3d4e5f6a7b8c9d2',
      name: 'Sony Official Store',
      email: 'seller@sony.com',
      role: 'seller',
    },
    imageCover: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
    images: [
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
    ],
    stock: 45,
    ratingsAverage: 4.9,
    ratingsQuantity: 840,
    isFeatured: true,
    isActive: true,
  };

  // Helper buffers for testing genuine and fake images
  const genuineJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0xff, 0xd9,
  ]);
  const fakeImageBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00ThisIsAnExecutableFileDisguisedAsAnImage');

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
  });

  // =========================================================================
  // 1. PUBLIC PRODUCT DETAIL RETRIEVAL (BY ID & SLUG)
  // =========================================================================
  describe('Public Product Detail API Endpoints', () => {
    it('GET /api/v1/products/:id - should return 200 with populated category and seller', async () => {
      vi.spyOn(Product, 'findById').mockReturnValue(createMockQuery(mockProduct));

      const res = await request(app).get(`/api/v1/products/${mockProduct._id}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.name).toBe(mockProduct.name);
      expect(res.body.data.data.category.name).toBe('Electronics');
      expect(res.body.data.data.seller.name).toBe('Sony Official Store');
      expect(res.headers['x-latency-budget']).toBe('300ms');
      expect(res.headers['x-response-time']).toBeDefined();
    });

    it('GET /api/v1/products/:id - should return 404 when product ID does not exist', async () => {
      vi.spyOn(Product, 'findById').mockReturnValue(createMockQuery(null));

      const res = await request(app).get('/api/v1/products/65f1a1b2c3d4e5f6a7b8c9d9');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('No document found with that ID');
    });

    it('GET /api/v1/products/slug/:slug - should return 200 with product matching slug', async () => {
      vi.spyOn(Product, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProduct),
      });

      const res = await request(app).get(`/api/v1/products/slug/${mockProduct.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.product.slug).toBe(mockProduct.slug);
      expect(res.body.data.product.category.slug).toBe('electronics');
    });

    it('GET /api/v1/products/slug/:slug - should return 404 when slug does not exist', async () => {
      vi.spyOn(Product, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app).get('/api/v1/products/slug/non-existent-product-slug-xyz');

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('No product found with that slug');
    });

    it('GET /api/v1/products/:id - should utilize Cache-Aside (X-Cache: MISS then HIT)', async () => {
      vi.spyOn(Product, 'findById').mockReturnValue(createMockQuery(mockProduct));

      // 1) First request -> Cache MISS
      const res1 = await request(app).get(`/api/v1/products/${mockProduct._id}`);
      expect(res1.status).toBe(200);
      expect(res1.headers['x-cache']).toBe('MISS');

      // 2) Second request -> Cache HIT
      const res2 = await request(app).get(`/api/v1/products/${mockProduct._id}`);
      expect(res2.status).toBe(200);
      expect(res2.headers['x-cache']).toBe('HIT');
    });
  });

  // =========================================================================
  // 2. MULTI-ANGLE MEDIA UPLOAD AUTHORIZATION & IDOR GUARDS
  // =========================================================================
  describe('Multi-Angle Media Upload Endpoint (POST /:id/images)', () => {
    it('should return 401 Unauthorized when no authentication token is provided', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${mockProduct._id}/images`)
        .attach('imageCover', genuineJpegBuffer, 'cover.jpg');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('You are not logged in');
    });

    it('should return 403 Forbidden when a customer (role: user) attempts to upload media', async () => {
      mockAuthUser(mockBuyer);
      const buyerToken = signTestToken(mockBuyer._id);

      const res = await request(app)
        .post(`/api/v1/products/${mockProduct._id}/images`)
        .set('Cookie', `jwt=${buyerToken}`)
        .attach('imageCover', genuineJpegBuffer, 'cover.jpg');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission');
    });

    it('should return 403 Forbidden when a seller attempts to modify another seller product (IDOR Guard)', async () => {
      // Authenticate as Rival Seller
      mockAuthUser(mockRivalSeller);
      const rivalToken = signTestToken(mockRivalSeller._id);

      // Product belongs to mockSeller (ID: 65f1a1b2c3d4e5f6a7b8c9d2)
      vi.spyOn(Product, 'findById').mockResolvedValue({
        ...mockProduct,
        seller: mockSeller._id,
      });

      const res = await request(app)
        .post(`/api/v1/products/${mockProduct._id}/images`)
        .set('Cookie', `jwt=${rivalToken}`)
        .attach('imageCover', genuineJpegBuffer, 'cover.jpg');

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not have permission to manage this product');
    });

    it('should return 404 when product ID does not exist', async () => {
      mockAuthUser(mockSeller);
      const sellerToken = signTestToken(mockSeller._id);

      vi.spyOn(Product, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/products/65f1a1b2c3d4e5f6a7b8c9d9/images')
        .set('Cookie', `jwt=${sellerToken}`)
        .attach('imageCover', genuineJpegBuffer, 'cover.jpg');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('No product found with that ID');
    });
  });

  // =========================================================================
  // 3. CRYPTOGRAPHIC MAGIC BYTE VERIFICATION & BOUNDARY DEFENSE
  // =========================================================================
  describe('Cryptographic Magic Byte Verification on Uploads', () => {
    it('should block spoofed image files (Module 02 Polyglot Defense) with 400 Bad Request', async () => {
      mockAuthUser(mockSeller);
      const sellerToken = signTestToken(mockSeller._id);

      vi.spyOn(Product, 'findById').mockResolvedValue({
        ...mockProduct,
        seller: mockSeller._id,
      });

      const res = await request(app)
        .post(`/api/v1/products/${mockProduct._id}/images`)
        .set('Cookie', `jwt=${sellerToken}`)
        .attach('imageCover', fakeImageBuffer, 'malicious_script.jpg');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain('failed binary magic byte inspection');
    });

    it('should allow authentic JPEG cover image upload and update product', async () => {
      mockAuthUser(mockSeller);
      const sellerToken = signTestToken(mockSeller._id);

      vi.spyOn(Product, 'findById').mockResolvedValue({
        ...mockProduct,
        seller: mockSeller._id,
      });

      const updatedProduct = {
        ...mockProduct,
        imageCover: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
      };
      vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue(updatedProduct);

      const res = await request(app)
        .post(`/api/v1/products/${mockProduct._id}/images`)
        .set('Cookie', `jwt=${sellerToken}`)
        .attach('imageCover', genuineJpegBuffer, 'authentic_headphones.jpg');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Product images uploaded and processed successfully');
      expect(res.body.data.product.imageCover).toBeDefined();
    });

    it('should allow multi-angle gallery image uploads (up to 5 images)', async () => {
      mockAuthUser(mockSeller);
      const sellerToken = signTestToken(mockSeller._id);

      vi.spyOn(Product, 'findById').mockResolvedValue({
        ...mockProduct,
        seller: mockSeller._id,
      });

      const updatedProduct = {
        ...mockProduct,
        images: [
          'https://images.unsplash.com/photo-1?w=800',
          'https://images.unsplash.com/photo-2?w=800',
        ],
      };
      vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue(updatedProduct);

      const res = await request(app)
        .post(`/api/v1/products/${mockProduct._id}/images`)
        .set('Cookie', `jwt=${sellerToken}`)
        .attach('images', genuineJpegBuffer, 'side_view.jpg')
        .attach('images', genuineJpegBuffer, 'top_view.jpg');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.product.images.length).toBe(2);
    });

    it('should allow Admin to upload media to any product regardless of seller ownership', async () => {
      mockAuthUser(mockAdmin);
      const adminToken = signTestToken(mockAdmin._id);

      vi.spyOn(Product, 'findById').mockResolvedValue({
        ...mockProduct,
        seller: mockSeller._id, // Owned by seller, but admin is modifying
      });

      vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue(mockProduct);

      const res = await request(app)
        .post(`/api/v1/products/${mockProduct._id}/images`)
        .set('Cookie', `jwt=${adminToken}`)
        .attach('imageCover', genuineJpegBuffer, 'admin_override.jpg');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });
});
