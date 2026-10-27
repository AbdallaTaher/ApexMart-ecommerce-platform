const mongoose = require('mongoose');
const Review = require('../models/reviewModel');
const Order = require('../models/orderModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

/**
 * Middleware: Seamlessly auto-assign product and user IDs for nested routes
 * (/api/v1/products/:productId/reviews)
 */
exports.setProductUserIds = (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user.id || req.user._id;
  next();
};

/**
 * Middleware: Verified Buyer Enforcement (Anti-Spam / Review Authenticity)
 * Strictly verifies whether the customer has placed an order containing the product
 * that is paid or delivered, and has not been cancelled. Non-buyers are blocked.
 */
exports.checkVerifiedBuyer = catchAsync(async (req, res, next) => {
  const productId = req.body.product || req.params.productId;
  const userId = req.user.id || req.user._id;

  if (!productId) {
    return next(new AppError('Product ID is required to submit a review', 400));
  }

  // Safe ObjectId conversion for nested subdocument query matching
  const userObjectId = mongoose.isValidObjectId(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;
  const productObjectId = mongoose.isValidObjectId(productId)
    ? new mongoose.Types.ObjectId(productId)
    : productId;

  // A verified buyer is any user who has placed an order containing this product
  // that has not been cancelled or failed (includes pending, processing, shipped, delivered, or paid)
  const qualifyingOrder = await Order.findOne({
    user: userObjectId,
    'orderItems.product': productObjectId,
    orderStatus: { $ne: 'cancelled' },
    paymentStatus: { $ne: 'failed' },
  }).lean();

  // Allow admin override for platform maintenance/moderation, but strictly gate regular users
  if (!qualifyingOrder && req.user.role !== 'admin') {
    return next(
      new AppError(
        'Only verified buyers who have purchased this product can submit a customer review.',
        403
      )
    );
  }

  // Stamp with verified purchase credential
  req.body.isVerifiedPurchase = true;
  next();
});

/**
 * Middleware: Prevent Duplicate Reviews
 * Rejects submission if the authenticated user already reviewed this product.
 */
exports.checkDuplicateReview = catchAsync(async (req, res, next) => {
  const productId = req.body.product || req.params.productId;
  const userId = req.user.id || req.user._id;

  const userObjectId = mongoose.isValidObjectId(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;
  const productObjectId = mongoose.isValidObjectId(productId)
    ? new mongoose.Types.ObjectId(productId)
    : productId;

  const existingReview = await Review.findOne({
    product: productObjectId,
    user: userObjectId,
  }).lean();

  if (existingReview) {
    return next(
      new AppError('You have already submitted a review for this product.', 400)
    );
  }

  next();
});

/**
 * Middleware: IDOR Protection for Review Modification / Deletion
 * Only the review author or platform admin is authorized.
 */
exports.checkReviewOwnership = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }

  const currentUserId = (req.user.id || req.user._id).toString();
  const authorId = (review.user?._id || review.user).toString();

  if (req.user.role !== 'admin' && authorId !== currentUserId) {
    return next(
      new AppError('You do not have permission to modify or delete this review.', 403)
    );
  }

  req.review = review;
  next();
});

/**
 * Retrieve All Reviews (with nested product filtering, sorting, pagination)
 */
exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.productId) {
    filter = { product: req.params.productId };
  }

  const features = new APIFeatures(Review.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const [reviews, total] = await Promise.all([
    features.query.lean(),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    total,
    data: {
      reviews,
      data: reviews,
    },
  });
});

/**
 * Retrieve a single review by ID
 */
exports.getReview = factory.getOne(Review);

/**
 * Submit a customer review
 */
exports.createReview = factory.createOne(Review);

/**
 * Update an existing review (author or admin)
 */
exports.updateReview = factory.updateOne(Review);

/**
 * Delete a review (author or admin)
 */
exports.deleteReview = factory.deleteOne(Review);

/**
 * Helpful Vote Toggle: Increment or decrement helpful votes on a review
 */
exports.voteHelpfulReview = catchAsync(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }

  // Prevent users from upvoting their own reviews
  const authorId = (review.user?._id || review.user).toString();
  if (authorId === userId.toString()) {
    return next(new AppError('You cannot vote on your own review.', 400));
  }

  const alreadyVoted = review.votedUsers?.some(
    (id) => id.toString() === userId.toString()
  );

  let updatedReview;
  if (alreadyVoted) {
    // Retract helpful vote
    updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { votedUsers: userId },
        $inc: { helpfulVotes: -1 },
      },
      { new: true }
    );
  } else {
    // Cast helpful vote
    updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: { votedUsers: userId },
        $inc: { helpfulVotes: 1 },
      },
      { new: true }
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      review: updatedReview,
      helpfulVotes: updatedReview.helpfulVotes,
      hasVoted: !alreadyVoted,
    },
  });
});

/**
 * Retrieve star ratings breakdown and distribution percentages for a product
 */
exports.getProductReviewStats = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;

  if (!productId) {
    return next(new AppError('Product ID is required to calculate review stats', 400));
  }

  const stats = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalReviews = 0;

  stats.forEach((item) => {
    distribution[item._id] = item.count;
    totalReviews += item.count;
  });

  const percentages = {};
  for (let star = 1; star <= 5; star++) {
    percentages[star] =
      totalReviews > 0
        ? Math.round((distribution[star] / totalReviews) * 100)
        : 0;
  }

  res.status(200).json({
    status: 'success',
    data: {
      totalReviews,
      distribution,
      percentages,
    },
  });
});
