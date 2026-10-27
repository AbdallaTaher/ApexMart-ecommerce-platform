import { describe, it, expect, beforeEach, vi } from 'vitest';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../backend/app');
const Review = require('../../backend/models/reviewModel');
const Order = require('../../backend/models/orderModel');
const User = require('../../backend/models/userModel');
const { catalogCache } = require('../../backend/utils/cacheLayer');

describe('Customer Review Verification & Ratings Engine Suite (Slice 7 - Task 26)', () => {
  const TEST_JWT_SECRET = 'apexmart-super-secure-and-ultra-long-jwt-secret-key-32-chars-prod';

  const buyerA = {
    _id: '65f1a1b2c3d4e5f6a7b8c9d1',
    id: '65f1a1b2c3d4e5f6a7b8c9d1',
    name: 'Sarah Connor',
    email: 'sarah@apexmart.com',
    role: 'user',
    active: true,
    changedPasswordAfter: vi.fn().mockReturnValue(false),
    loggedOutAfter: vi.fn().mockReturnValue(false),
  };

  const buyerB = {
    _id: '65f1a1b2c3d4e5f6a7b8c9d2',
    id: '65f1a1b2c3d4e5f6a7b8c9d2',
    name: 'John Connor',
    email: 'john@apexmart.com',
    role: 'user',
    active: true,
    changedPasswordAfter: vi.fn().mockReturnValue(false),
    loggedOutAfter: vi.fn().mockReturnValue(false),
  };

  const adminUser = {
    _id: '65f1a1b2c3d4e5f6a7b8c9d3',
    id: '65f1a1b2c3d4e5f6a7b8c9d3',
    name: 'Platform Admin',
    email: 'admin@apexmart.com',
    role: 'admin',
    active: true,
    changedPasswordAfter: vi.fn().mockReturnValue(false),
    loggedOutAfter: vi.fn().mockReturnValue(false),
  };

  const testProductId = '65f1a1b2c3d4e5f6a7b8c910';
  const testReviewId = '65f1a1b2c3d4e5f6a7b8c999';

  const signToken = (userId) => {
    return jwt.sign(
      { id: userId.toString(), iat: Math.floor(Date.now() / 1000) - 10 },
      TEST_JWT_SECRET,
      { expiresIn: '7d' }
    );
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    vi.spyOn(catalogCache, 'clear');

    // Default User lookup mock
    vi.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id?.toString();
      if (idStr === buyerA._id) return Promise.resolve(buyerA);
      if (idStr === buyerB._id) return Promise.resolve(buyerB);
      if (idStr === adminUser._id) return Promise.resolve(adminUser);
      return Promise.resolve(null);
    });
  });

  // ==========================================================================
  // 1. AUTHENTICATION GATES
  // ==========================================================================
  describe('1. Authentication Security Gates', () => {
    it('POST /api/v1/products/:productId/reviews - rejects unauthenticated submission with 401', async () => {
      const res = await request(app)
        .post(`/api/v1/products/${testProductId}/reviews`)
        .send({
          title: 'Great headphones',
          review: 'Outstanding battery life and great noise cancellation.',
          rating: 5,
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not logged in/i);
    });

    it('PATCH /api/v1/reviews/:id - rejects unauthenticated modification with 401', async () => {
      const res = await request(app)
        .patch(`/api/v1/reviews/${testReviewId}`)
        .send({
          review: 'Updated review content without login.',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not logged in/i);
    });

    it('DELETE /api/v1/reviews/:id - rejects unauthenticated deletion with 401', async () => {
      const res = await request(app).delete(`/api/v1/reviews/${testReviewId}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not logged in/i);
    });

    it('POST /api/v1/reviews/:id/vote - rejects unauthenticated helpful vote with 401', async () => {
      const res = await request(app).post(`/api/v1/reviews/${testReviewId}/vote`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not logged in/i);
    });
  });

  // ==========================================================================
  // 2. VERIFIED BUYER ENFORCEMENT & NON-BUYER BLOCKING
  // ==========================================================================
  describe('2. Verified Buyer Anti-Spam Enforcement', () => {
    it('POST /api/v1/products/:productId/reviews - blocks customer who has never ordered the product with 403', async () => {
      const token = signToken(buyerB._id);

      // No qualifying order exists for Buyer B
      vi.spyOn(Order, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      // No previous review exists
      vi.spyOn(Review, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post(`/api/v1/products/${testProductId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Fake Review',
          review: 'I never purchased this item but I want to leave a review.',
          rating: 1,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe(
        'Only verified buyers who have purchased this product can submit a customer review.'
      );
    });

    it('POST /api/v1/products/:productId/reviews - blocks customer if their only order was cancelled with 403', async () => {
      const token = signToken(buyerA._id);

      // Order query excludes cancelled orders -> returns null
      vi.spyOn(Order, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      vi.spyOn(Review, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post(`/api/v1/products/${testProductId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Cancelled order',
          review: 'My order was cancelled before shipping, leaving review anyway.',
          rating: 2,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe(
        'Only verified buyers who have purchased this product can submit a customer review.'
      );
    });

    it('POST /api/v1/products/:productId/reviews - allows verified buyer with an active order and marks isVerifiedPurchase: true', async () => {
      const token = signToken(buyerA._id);

      // Buyer A has an active order containing testProductId
      vi.spyOn(Order, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: '65f1a1b2c3d4e5f6a7b8c888',
          user: buyerA._id,
          orderStatus: 'shipped',
          paymentStatus: 'paid',
        }),
      });

      // No duplicate review exists
      vi.spyOn(Review, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const mockCreatedReview = {
        _id: testReviewId,
        title: 'Outstanding quality!',
        review: 'These headphones exceeded all my expectations. The sound is clear and build quality is premium.',
        rating: 5,
        isVerifiedPurchase: true,
        product: testProductId,
        user: buyerA._id,
      };

      vi.spyOn(Review, 'create').mockResolvedValue(mockCreatedReview);
      vi.spyOn(Review, 'calcAverageRatings').mockResolvedValue();

      const res = await request(app)
        .post(`/api/v1/products/${testProductId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Outstanding quality!',
          review: 'These headphones exceeded all my expectations. The sound is clear and build quality is premium.',
          rating: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.isVerifiedPurchase).toBe(true);
      expect(res.body.data.data.rating).toBe(5);
    });

    it('POST /api/v1/products/:productId/reviews - allows admin override even without purchase order', async () => {
      const adminToken = signToken(adminUser._id);

      // Admin has no qualifying order
      vi.spyOn(Order, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      vi.spyOn(Review, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const mockAdminReview = {
        _id: testReviewId,
        title: 'Staff Pick Recommendation',
        review: 'ApexMart staff verification testing review for platform catalog.',
        rating: 5,
        isVerifiedPurchase: true,
        product: testProductId,
        user: adminUser._id,
      };

      vi.spyOn(Review, 'create').mockResolvedValue(mockAdminReview);
      vi.spyOn(Review, 'calcAverageRatings').mockResolvedValue();

      const res = await request(app)
        .post(`/api/v1/products/${testProductId}/reviews`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Staff Pick Recommendation',
          review: 'ApexMart staff verification testing review for platform catalog.',
          rating: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.data.isVerifiedPurchase).toBe(true);
    });
  });

  // ==========================================================================
  // 3. DUPLICATE REVIEW PREVENTION
  // ==========================================================================
  describe('3. Duplicate Review Prevention', () => {
    it('POST /api/v1/products/:productId/reviews - rejects second review by same customer with 400', async () => {
      const token = signToken(buyerA._id);

      // An existing review is found for this user and product
      vi.spyOn(Review, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: testReviewId,
          product: testProductId,
          user: buyerA._id,
        }),
      });

      const res = await request(app)
        .post(`/api/v1/products/${testProductId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Second review attempt',
          review: 'Trying to submit a second review for the exact same product.',
          rating: 4,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('You have already submitted a review for this product.');
    });
  });

  // ==========================================================================
  // 4. STAR DISTRIBUTION STATS AGGREGATION
  // ==========================================================================
  describe('4. Ratings & Star Distribution Stats Aggregation', () => {
    it('GET /api/v1/products/:productId/reviews/stats - calculates star percentage breakdown correctly', async () => {
      vi.spyOn(Review, 'aggregate').mockResolvedValue([
        { _id: 5, count: 4 },
        { _id: 4, count: 1 },
      ]);

      const res = await request(app).get(`/api/v1/products/${testProductId}/reviews/stats`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.totalReviews).toBe(5);
      expect(res.body.data.distribution['5']).toBe(4);
      expect(res.body.data.distribution['4']).toBe(1);
      expect(res.body.data.percentages['5']).toBe(80); // 4 / 5 = 80%
      expect(res.body.data.percentages['4']).toBe(20); // 1 / 5 = 20%
      expect(res.body.data.percentages['1']).toBe(0);
    });

    it('GET /api/v1/products/:productId/reviews/stats - handles zero reviews gracefully', async () => {
      vi.spyOn(Review, 'aggregate').mockResolvedValue([]);

      const res = await request(app).get(`/api/v1/products/${testProductId}/reviews/stats`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalReviews).toBe(0);
      expect(res.body.data.percentages['5']).toBe(0);
      expect(res.body.data.distribution['5']).toBe(0);
    });
  });

  // ==========================================================================
  // 5. IDOR & OWNERSHIP PROTECTION (UPDATE / DELETE)
  // ==========================================================================
  describe('5. IDOR & Review Ownership Enforcement', () => {
    const existingReviewDoc = {
      _id: testReviewId,
      product: testProductId,
      user: buyerA._id,
      review: 'Original review by Buyer A',
      rating: 5,
    };

    it('PATCH /api/v1/reviews/:id - blocks non-author from updating review with 403', async () => {
      const attackerToken = signToken(buyerB._id);

      vi.spyOn(Review, 'findById').mockResolvedValue(existingReviewDoc);

      const res = await request(app)
        .patch(`/api/v1/reviews/${testReviewId}`)
        .set('Authorization', `Bearer ${attackerToken}`)
        .send({
          review: 'Tampered review content by Buyer B',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('You do not have permission to modify or delete this review.');
    });

    it('DELETE /api/v1/reviews/:id - blocks non-author from deleting review with 403', async () => {
      const attackerToken = signToken(buyerB._id);

      vi.spyOn(Review, 'findById').mockResolvedValue(existingReviewDoc);

      const res = await request(app)
        .delete(`/api/v1/reviews/${testReviewId}`)
        .set('Authorization', `Bearer ${attackerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('You do not have permission to modify or delete this review.');
    });

    it('PATCH /api/v1/reviews/:id - allows author to update their own review', async () => {
      const authorToken = signToken(buyerA._id);

      vi.spyOn(Review, 'findById').mockResolvedValue(existingReviewDoc);
      vi.spyOn(Review, 'findByIdAndUpdate').mockResolvedValue({
        ...existingReviewDoc,
        review: 'Updated review content by original author.',
      });

      const res = await request(app)
        .patch(`/api/v1/reviews/${testReviewId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          review: 'Updated review content by original author.',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.data.review).toBe('Updated review content by original author.');
    });

    it('DELETE /api/v1/reviews/:id - allows platform admin to delete any review', async () => {
      const adminToken = signToken(adminUser._id);

      vi.spyOn(Review, 'findById').mockResolvedValue(existingReviewDoc);
      vi.spyOn(Review, 'findByIdAndDelete').mockResolvedValue(existingReviewDoc);

      const res = await request(app)
        .delete(`/api/v1/reviews/${testReviewId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });

  // ==========================================================================
  // 6. HELPFUL VOTING SYSTEM
  // ==========================================================================
  describe('6. Helpful Voting Mechanics', () => {
    it('POST /api/v1/reviews/:id/vote - rejects review author voting on their own review with 400', async () => {
      const authorToken = signToken(buyerA._id);

      vi.spyOn(Review, 'findById').mockResolvedValue({
        _id: testReviewId,
        user: buyerA._id,
        helpfulVotes: 0,
        votedUsers: [],
      });

      const res = await request(app)
        .post(`/api/v1/reviews/${testReviewId}/vote`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('You cannot vote on your own review.');
    });

    it('POST /api/v1/reviews/:id/vote - increments vote when another user votes helpful', async () => {
      const voterToken = signToken(buyerB._id);

      vi.spyOn(Review, 'findById').mockResolvedValue({
        _id: testReviewId,
        user: buyerA._id,
        helpfulVotes: 0,
        votedUsers: [],
      });

      vi.spyOn(Review, 'findByIdAndUpdate').mockResolvedValue({
        _id: testReviewId,
        user: buyerA._id,
        helpfulVotes: 1,
        votedUsers: [buyerB._id],
      });

      const res = await request(app)
        .post(`/api/v1/reviews/${testReviewId}/vote`)
        .set('Authorization', `Bearer ${voterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.helpfulVotes).toBe(1);
      expect(res.body.data.hasVoted).toBe(true);
    });

    it('POST /api/v1/reviews/:id/vote - toggles and retracts vote if user clicks again', async () => {
      const voterToken = signToken(buyerB._id);

      // User already voted
      vi.spyOn(Review, 'findById').mockResolvedValue({
        _id: testReviewId,
        user: buyerA._id,
        helpfulVotes: 1,
        votedUsers: [buyerB._id],
      });

      vi.spyOn(Review, 'findByIdAndUpdate').mockResolvedValue({
        _id: testReviewId,
        user: buyerA._id,
        helpfulVotes: 0,
        votedUsers: [],
      });

      const res = await request(app)
        .post(`/api/v1/reviews/${testReviewId}/vote`)
        .set('Authorization', `Bearer ${voterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.helpfulVotes).toBe(0);
      expect(res.body.data.hasVoted).toBe(false);
    });
  });
});
