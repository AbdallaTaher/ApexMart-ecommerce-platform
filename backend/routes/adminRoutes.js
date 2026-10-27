const express = require('express');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

const router = express.Router();

// Enforce authentication & strict platform admin RBAC on all admin routes
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

// 1) Platform Analytics (GMV, Demographics, Inventory Health & 30-Day Trajectory)
router.get('/analytics', adminController.getPlatformAnalytics);

// 2) User Management & RBAC Governance
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', adminController.updateUserRole);

// 3) Immutable Audit Trail Endpoints
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/audit-logs/stats', adminController.getAuditStats);

module.exports = router;
