const express = require('express');
const categoryController = require('../controllers/categoryController');
const authController = require('../controllers/authController');
const { catalogSearchLimiter } = require('../utils/rateLimiters');
const { catalogCache } = require('../utils/cacheLayer');

const router = express.Router();

// ============================================================================
// 1) PUBLIC CATEGORY DISCOVERY
// ============================================================================
router.get(
  '/',
  catalogSearchLimiter,
  catalogCache.middleware(10 * 60 * 1000),
  categoryController.getAllCategories
);

router.get(
  '/slug/:slug',
  catalogSearchLimiter,
  catalogCache.middleware(10 * 60 * 1000),
  categoryController.getCategoryBySlug
);

router.get(
  '/:id',
  catalogSearchLimiter,
  catalogCache.middleware(10 * 60 * 1000),
  categoryController.getCategory
);

// ============================================================================
// 2) PROTECTED ADMINISTRATIVE CATEGORY GOVERNANCE
// ============================================================================
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router.post(
  '/',
  catalogCache.invalidator(['/api/v1/categories', '/api/v1/products']),
  categoryController.createCategory
);

router
  .route('/:id')
  .patch(
    catalogCache.invalidator(['/api/v1/categories', '/api/v1/products']),
    categoryController.updateCategory
  )
  .delete(
    catalogCache.invalidator(['/api/v1/categories', '/api/v1/products']),
    categoryController.deleteCategory
  );

module.exports = router;
