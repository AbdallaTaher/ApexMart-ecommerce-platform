const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const AppError = require('../utils/appError');
const { authLimiter } = require('../utils/rateLimiters');

const router = express.Router();

// ============================================================================
// 1) PUBLIC AUTHENTICATION & RECOVERY ENDPOINTS
// ============================================================================
router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.route('/logout').get(authController.logout).post(authController.logout);
router.post('/forgotPassword', authLimiter, authController.forgotPassword);
router.patch('/resetPassword/:token', authLimiter, authController.resetPassword);

// Defensive Method Guards (Prevent invalid HTTP verbs from falling through)
router.all('/signup', (req, res, next) => {
  next(new AppError(`HTTP ${req.method} is not supported on /signup. Please use HTTP POST.`, 405));
});

router.all('/login', (req, res, next) => {
  next(new AppError(`HTTP ${req.method} is not supported on /login. Please use HTTP POST with your credentials.`, 405));
});

router.all('/forgotPassword', (req, res, next) => {
  next(new AppError(`HTTP ${req.method} is not supported on /forgotPassword. Please use HTTP POST with your email.`, 405));
});

// ============================================================================
// 2) PROTECTED USER SELF-SERVICE ENDPOINTS
// ============================================================================
// Enforce authentication across all subsequent endpoints
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// ============================================================================
// 3) ADMIN-ONLY GOVERNANCE ENDPOINTS
// ============================================================================
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
