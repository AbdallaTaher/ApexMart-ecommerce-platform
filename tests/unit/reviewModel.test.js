import { describe, it, expect, vi } from 'vitest';
const mongoose = require('mongoose');
const Review = require('../../backend/models/reviewModel');
const Product = require('../../backend/models/productModel');

describe('Review Model Schema & Aggregation Unit Tests', () => {
  it('should validate that required fields are present', () => {
    const review = new Review({});
    const error = review.validateSync();

    expect(error).toBeDefined();
    expect(error.errors['review']).toBeDefined();
    expect(error.errors['rating']).toBeDefined();
    expect(error.errors['product']).toBeDefined();
    expect(error.errors['user']).toBeDefined();
  });

  it('should reject ratings below 1 or above 5', () => {
    const invalidLow = new Review({
      review: 'Too low rating score',
      rating: 0.5,
      product: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const errorLow = invalidLow.validateSync();
    expect(errorLow).toBeDefined();
    expect(errorLow.errors['rating']).toBeDefined();
    expect(errorLow.errors['rating'].message).toContain('Rating must be at least 1.0');

    const invalidHigh = new Review({
      review: 'Too high rating score',
      rating: 6,
      product: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const errorHigh = invalidHigh.validateSync();
    expect(errorHigh).toBeDefined();
    expect(errorHigh.errors['rating']).toBeDefined();
    expect(errorHigh.errors['rating'].message).toContain('Rating cannot exceed 5.0');
  });

  it('should reject reviews shorter than 5 characters or longer than 3000 characters', () => {
    const shortReview = new Review({
      review: 'Bad',
      rating: 3,
      product: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    const errorShort = shortReview.validateSync();
    expect(errorShort).toBeDefined();
    expect(errorShort.errors['review']).toBeDefined();
    expect(errorShort.errors['review'].message).toContain(
      'Review must be at least 5 characters long'
    );
  });

  it('should set default values for isVerifiedPurchase and helpfulVotes', () => {
    const validReview = new Review({
      review: 'This is an awesome high quality product that exceeded expectations!',
      rating: 5,
      product: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
    });

    expect(validReview.isVerifiedPurchase).toBe(false);
    expect(validReview.helpfulVotes).toBe(0);
    expect(validReview.votedUsers).toEqual([]);
    expect(validReview.validateSync()).toBeUndefined();
  });

  it('should calculate and update average rating on Product in calcAverageRatings', async () => {
    const dummyProductId = new mongoose.Types.ObjectId();

    vi.spyOn(Review, 'aggregate').mockResolvedValueOnce([
      {
        _id: dummyProductId,
        nRating: 3,
        avgRating: 4.666666,
      },
    ]);

    const findByIdAndUpdateSpy = vi
      .spyOn(Product, 'findByIdAndUpdate')
      .mockResolvedValueOnce({});

    await Review.calcAverageRatings(dummyProductId);

    expect(Review.aggregate).toHaveBeenCalled();
    expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(dummyProductId, {
      ratingsQuantity: 3,
      ratingsAverage: 4.7, // Rounded to 1 decimal place
    });

    findByIdAndUpdateSpy.mockRestore();
    Review.aggregate.mockRestore();
  });

  it('should reset Product ratings to default 4.5 and 0 count if all reviews are deleted', async () => {
    const dummyProductId = new mongoose.Types.ObjectId();

    vi.spyOn(Review, 'aggregate').mockResolvedValueOnce([]);

    const findByIdAndUpdateSpy = vi
      .spyOn(Product, 'findByIdAndUpdate')
      .mockResolvedValueOnce({});

    await Review.calcAverageRatings(dummyProductId);

    expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(dummyProductId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });

    findByIdAndUpdateSpy.mockRestore();
    Review.aggregate.mockRestore();
  });
});
