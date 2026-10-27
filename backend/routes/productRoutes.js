const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const { catalogSearchLimiter } = require('../utils/rateLimiters');
const { catalogCache } = require('../utils/cacheLayer');
const {
  uploadProductImages,
  verifyImageSignatures,
} = require('../utils/uploadMiddleware');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Nested route: Re-route to Review Router
router.use('/:productId/reviews', reviewRouter);

// ============================================================================
// 1) PUBLIC PRODUCT CATALOG DISCOVERY & SPECIAL FEEDS
// ============================================================================
router.get(
  '/top-deals',
  catalogSearchLimiter,
  catalogCache.middleware(180000),
  productController.aliasTopDeals,
  productController.getAllProducts
);

router.get(
  '/featured',
  catalogSearchLimiter,
  catalogCache.middleware(180000),
  productController.aliasFeaturedProducts,
  productController.getAllProducts
);

router.get(
  '/slug/:slug',
  catalogSearchLimiter,
  catalogCache.middleware(180000),
  productController.getProductBySlug
);

router
  .route('/')
  .get(
    catalogSearchLimiter,
    catalogCache.middleware(180000),
    productController.getAllProducts
  );

router
  .route('/:id')
  .get(
    catalogSearchLimiter,
    catalogCache.middleware(180000),
    productController.getProduct
  );

// ============================================================================
// 2) PROTECTED SELLER & ADMIN PRODUCT GOVERNANCE
// ============================================================================
router.use(authController.protect);
router.use(authController.restrictTo('seller', 'admin'));

router
  .route('/')
  .post(
    catalogCache.invalidator('/api/v1/products'),
    productController.setSellerId,
    uploadProductImages,
    verifyImageSignatures,
    productController.processProductImages,
    productController.createProduct
  );

// Dedicated Multi-Angle Media Upload Endpoint
router.post(
  '/:id/images',
  productController.checkProductOwnership,
  catalogCache.invalidator('/api/v1/products'),
  uploadProductImages,
  verifyImageSignatures,
  productController.processProductImages,
  productController.uploadProductMedia
);

router
  .route('/:id')
  .patch(
    catalogCache.invalidator('/api/v1/products'),
    productController.checkProductOwnership,
    uploadProductImages,
    verifyImageSignatures,
    productController.processProductImages,
    productController.updateProduct
  )
  .delete(
    catalogCache.invalidator('/api/v1/products'),
    productController.checkProductOwnership,
    productController.deleteProduct
  );

module.exports = router;
