const express = require('express');
const cartController = require('../controllers/cartController');
const authController = require('../controllers/authController');

const router = express.Router();

// ============================================================================
// 1) CART SYNCHRONIZATION (Guest or Authenticated)
// ============================================================================
router.post('/sync', authController.protectOptional, cartController.syncCart);

// ============================================================================
// 2) AUTHENTICATED PERSISTED CART OPERATIONS
// ============================================================================
router.use(authController.protect);

router
  .route('/')
  .get(cartController.getCart)
  .delete(cartController.clearCart);

router.post('/items', cartController.addToCart);

router
  .route('/items/:productId')
  .patch(cartController.updateCartItem)
  .delete(cartController.removeFromCart);

module.exports = router;
