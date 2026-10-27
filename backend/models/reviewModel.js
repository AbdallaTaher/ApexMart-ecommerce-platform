const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review text cannot be empty!'],
      trim: true,
      minlength: [5, 'Review must be at least 5 characters long'],
      maxlength: [3000, 'Review cannot exceed 3000 characters'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, 'Review headline cannot exceed 120 characters'],
      default: '',
    },
    rating: {
      type: Number,
      required: [true, 'A review must have a star rating between 1 and 5'],
      min: [1, 'Rating must be at least 1.0'],
      max: [5, 'Rating cannot exceed 5.0'],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product.'],
      index: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
      index: true,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    votedUsers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate reviews: Each user can only review a given product once
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// High-frequency sorting indexes
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ product: 1, rating: -1 });

/**
 * Query Middleware: Automatically populate author info (name, photo)
 */
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

/**
 * Static aggregation method: Recalculate average ratings and total review count on the parent Product
 */
reviewSchema.statics.calcAverageRatings = async function (productId) {
  if (!productId) return;

  const targetId =
    typeof productId === 'string'
      ? new mongoose.Types.ObjectId(productId)
      : productId;

  const stats = await this.aggregate([
    {
      $match: { product: targetId },
    },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const Product = mongoose.model('Product');

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(targetId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    // If all reviews for the product were deleted, reset to defaults
    await Product.findByIdAndUpdate(targetId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }

  // Invalidate Redis/In-memory catalog cache so product list & detail serve updated ratings immediately
  try {
    const { catalogCache } = require('../utils/cacheLayer');
    if (catalogCache && typeof catalogCache.clear === 'function') {
      catalogCache.clear();
    }
  } catch (err) {
    // Non-fatal if cacheLayer is not loaded in unit test environments
  }
};

/**
 * Document Middleware: Post-save hook to recalculate product ratings
 */
reviewSchema.post('save', async function () {
  // 'this' points to current review instance
  await this.constructor.calcAverageRatings(this.product);
});

/**
 * Query Middleware: Recalculate product ratings upon findOneAndUpdate and findOneAndDelete
 */
reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.product);
  }
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.product);
  }
});

/**
 * Document Middleware: Support doc.deleteOne()
 */
reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.calcAverageRatings(this.product);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
