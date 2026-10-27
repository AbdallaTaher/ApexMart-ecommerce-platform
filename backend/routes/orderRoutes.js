const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');
const { orderCheckoutLimiter } = require('../utils/rateLimiters');

const router = express.Router();

// All order operations require authenticated session
router.use(authController.protect);

router
  .route('/')
  .post(orderCheckoutLimiter, orderController.createOrder)
  .get(authController.restrictTo('admin'), orderController.getAllOrders);

router.route('/my-orders').get(orderController.getMyOrders);

router.route('/:id').get(orderController.getOrder);

router.route('/:id/status').patch(orderController.updateOrderStatus);

module.exports = router;
