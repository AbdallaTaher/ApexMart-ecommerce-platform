const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const AuditLog = require('../models/auditLogModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * 1) GET /api/v1/admin/analytics
 * Computes platform-wide GMV, order health, customer/seller demographics,
 * 30-day daily trajectory for charts, and top-selling products.
 */
exports.getPlatformAnalytics = catchAsync(async (req, res, next) => {
  // A) GMV & Financial Breakdown
  const gmvAggregation = await Order.aggregate([
    {
      $group: {
        _id: null,
        grossMerchandiseValue: {
          $sum: {
            $cond: [{ $ne: ['$orderStatus', 'cancelled'] }, '$totalPrice', 0],
          },
        },
        settledRevenue: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0],
          },
        },
        totalOrdersCount: { $sum: 1 },
        completedOrdersCount: {
          $sum: {
            $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0],
          },
        },
        activeOrdersCount: {
          $sum: {
            $cond: [
              { $in: ['$orderStatus', ['pending', 'processing', 'shipped']] },
              1,
              0,
            ],
          },
        },
        cancelledOrdersCount: {
          $sum: {
            $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0],
          },
        },
        totalUnitsSold: {
          $sum: {
            $cond: [
              { $ne: ['$orderStatus', 'cancelled'] },
              { $sum: '$orderItems.quantity' },
              0,
            ],
          },
        },
      },
    },
  ]);

  const financialStats = gmvAggregation[0] || {
    grossMerchandiseValue: 0,
    settledRevenue: 0,
    totalOrdersCount: 0,
    completedOrdersCount: 0,
    activeOrdersCount: 0,
    cancelledOrdersCount: 0,
    totalUnitsSold: 0,
  };

  // B) User Demographics (Buyers vs Sellers vs Admins)
  const userAggregation = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  const userStats = {
    total: 0,
    buyers: 0,
    sellers: 0,
    admins: 0,
  };

  userAggregation.forEach((item) => {
    userStats.total += item.count;
    if (item._id === 'user') userStats.buyers = item.count;
    if (item._id === 'seller') userStats.sellers = item.count;
    if (item._id === 'admin') userStats.admins = item.count;
  });

  // C) Product Catalog Inventory Health
  const productAggregation = await Product.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        active: [{ $match: { stock: { $gt: 5 } } }, { $count: 'count' }],
        lowStock: [{ $match: { stock: { $gt: 0, $lte: 5 } } }, { $count: 'count' }],
        outOfStock: [{ $match: { stock: 0 } }, { $count: 'count' }],
      },
    },
  ]);

  const pData = productAggregation[0] || {};
  const productStats = {
    total: pData.total?.[0]?.count || 0,
    active: pData.active?.[0]?.count || 0,
    lowStock: pData.lowStock?.[0]?.count || 0,
    outOfStock: pData.outOfStock?.[0]?.count || 0,
  };

  // D) 30-Day Platform Sales Trajectory (Continuous Daily Series)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const trajectoryAgg = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
        orderStatus: { $ne: 'cancelled' },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        gmv: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 },
        unitsSold: { $sum: { $sum: '$orderItems.quantity' } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dateMap = new Map();
  trajectoryAgg.forEach((item) => {
    dateMap.set(item._id, {
      date: item._id,
      gmv: Math.round(item.gmv * 100) / 100,
      orderCount: item.orderCount,
      unitsSold: item.unitsSold,
    });
  });

  const dailyTrajectory = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyTrajectory.push(
      dateMap.get(key) || {
        date: key,
        gmv: 0,
        orderCount: 0,
        unitsSold: 0,
      }
    );
  }

  // E) Top Selling Products Across Platform
  const topProducts = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        title: { $first: '$orderItems.title' },
        imageCover: { $first: '$orderItems.imageCover' },
        price: { $first: '$orderItems.price' },
        unitsSold: { $sum: '$orderItems.quantity' },
        revenue: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
        },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  // F) Recent Platform Orders
  const recentOrders = await Order.find()
    .sort('-createdAt')
    .limit(8)
    .populate('user', 'name email photo');

  // G) Recent Audit Trail Items
  const recentAuditLogs = await AuditLog.find()
    .sort('-createdAt')
    .limit(6);

  res.status(200).json({
    status: 'success',
    data: {
      analytics: {
        financials: {
          gmv: Math.round(financialStats.grossMerchandiseValue * 100) / 100,
          settledRevenue: Math.round(financialStats.settledRevenue * 100) / 100,
          totalOrders: financialStats.totalOrdersCount,
          completedOrders: financialStats.completedOrdersCount,
          activeOrders: financialStats.activeOrdersCount,
          cancelledOrders: financialStats.cancelledOrdersCount,
          totalUnitsSold: financialStats.totalUnitsSold,
        },
        users: userStats,
        catalog: productStats,
        trajectory: dailyTrajectory,
        topProducts,
        recentOrders,
        recentAuditLogs,
      },
    },
  });
});

/**
 * 2) GET /api/v1/admin/users
 * Retrieve users with search, role filtering, sorting, and pagination.
 */
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.role && ['user', 'seller', 'admin'].includes(req.query.role)) {
    filter.role = req.query.role;
  }

  const queryBuilder = User.find(filter);
  const features = new APIFeatures(queryBuilder, req.query)
    .search(['name', 'email'])
    .sort()
    .paginate();

  const totalCount = await User.countDocuments(filter);
  const users = await features.query;

  res.status(200).json({
    status: 'success',
    results: users.length,
    totalCount,
    data: {
      users,
    },
  });
});

/**
 * 3) PATCH /api/v1/admin/users/:id/role
 * Admin updates a user's role with self-demotion protection and immutable audit trail.
 */
exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  const VALID_ROLES = ['user', 'seller', 'admin'];
  if (!role || !VALID_ROLES.includes(role)) {
    return next(
      new AppError(`Invalid role. Valid roles are: ${VALID_ROLES.join(', ')}`, 400)
    );
  }

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Prevent admin from demoting themselves to avoid lockout
  const currentUserId = (req.user.id || req.user._id).toString();
  if (currentUserId === id.toString() && role !== 'admin') {
    return next(
      new AppError('Security violation: Administrators cannot revoke their own admin privileges.', 400)
    );
  }

  const previousRole = user.role;
  user.role = role;
  await user.save({ validateBeforeSave: false });

  // Record immutable audit log
  await logAuditEvent({
    req,
    action: 'USER_ROLE_UPDATED',
    entity: 'User',
    entityId: user._id,
    details: {
      targetUserEmail: user.email,
      previousRole,
      newRole: role,
      performedBy: req.user.email,
    },
    severity: role === 'admin' ? 'critical' : 'warning',
  });

  res.status(200).json({
    status: 'success',
    message: `User role successfully updated to ${role}`,
    data: {
      user,
    },
  });
});

/**
 * 4) GET /api/v1/admin/audit-logs
 * Query immutable audit logs with search, severity filtering, sorting, and pagination.
 */
exports.getAuditLogs = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.severity && ['info', 'warning', 'critical'].includes(req.query.severity)) {
    filter.severity = req.query.severity;
  }
  if (req.query.action) {
    filter.action = req.query.action;
  }
  if (req.query.entity) {
    filter.entity = req.query.entity;
  }

  const queryBuilder = AuditLog.find(filter);
  const features = new APIFeatures(queryBuilder, req.query)
    .search(['action', 'entity', 'entityId', 'ipAddress', 'userAgent'])
    .sort()
    .paginate();

  const totalCount = await AuditLog.countDocuments(filter);
  const auditLogs = await features.query;

  res.status(200).json({
    status: 'success',
    results: auditLogs.length,
    totalCount,
    data: {
      auditLogs,
    },
  });
});

/**
 * 5) GET /api/v1/admin/audit-logs/stats
 * Quick summary of audit log severity distribution and top actions.
 */
exports.getAuditStats = catchAsync(async (req, res, next) => {
  const stats = await AuditLog.aggregate([
    {
      $facet: {
        bySeverity: [
          {
            $group: {
              _id: '$severity',
              count: { $sum: 1 },
            },
          },
        ],
        topActions: [
          {
            $group: {
              _id: '$action',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats: stats[0] || {},
    },
  });
});
