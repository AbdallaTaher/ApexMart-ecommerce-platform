const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// mergeParams: true allows access to parent parameters (e.g. :productId from /api/v1/products/:productId/reviews)
const router = express.Router({ mergeParams: true });

// Ratings distribution and breakdown statistics
router.get('/stats', reviewController.getProductReviewStats);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.setProductUserIds,
    reviewController.checkDuplicateReview,
    reviewController.checkVerifiedBuyer,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.protect,
    reviewController.checkReviewOwnership,
    reviewController.updateReview
  )
  .delete(
    authController.protect,
    reviewController.checkReviewOwnership,
    reviewController.deleteReview
  );

// Helpful voting endpoint
router.post(
  '/:id/vote',
  authController.protect,
  reviewController.voteHelpfulReview
);

module.exports = router;
