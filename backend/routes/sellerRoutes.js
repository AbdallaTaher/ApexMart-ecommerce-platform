const express = require('express');
const sellerController = require('../controllers/sellerController');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const { catalogCache } = require('../utils/cacheLayer');
const {
  uploadProductImages,
  verifyImageSignatures,
} = require('../utils/uploadMiddleware');

const router = express.Router();

// Enforce authentication & seller/admin authorization on all seller routes
router.use(authController.protect);
router.use(authController.restrictTo('seller', 'admin'));

// 1) Seller Analytics Dashboard Route
router.get('/analytics', sellerController.getSellerAnalytics);

// 2) Seller Inventory CRUD Routes
router
  .route('/products')
  .get(sellerController.getSellerProducts)
  .post(
    catalogCache.invalidator('/api/v1/products'),
    uploadProductImages,
    verifyImageSignatures,
    productController.processProductImages,
    sellerController.createSellerProduct
  );

router
  .route('/products/:id')
  .get(sellerController.getSellerProduct)
  .patch(
    catalogCache.invalidator('/api/v1/products'),
    uploadProductImages,
    verifyImageSignatures,
    productController.processProductImages,
    sellerController.updateSellerProduct
  )
  .delete(
    catalogCache.invalidator('/api/v1/products'),
    sellerController.deleteSellerProduct
  );

// 3) Dedicated Product Media Upload Route
router.post(
  '/products/:id/images',
  catalogCache.invalidator('/api/v1/products'),
  uploadProductImages,
  verifyImageSignatures,
  productController.processProductImages,
  productController.uploadProductMedia
);

module.exports = router;
