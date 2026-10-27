const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Category = require('../models/categoryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { catalogCache } = require('../utils/cacheLayer');

/**
 * Controller: Get Seller Analytics Dashboard Metrics
 * Calculates store revenue, units sold, order count, trajectory, and inventory health.
 */
exports.getSellerAnalytics = catchAsync(async (req, res, next) => {
  const sellerIdStr = (req.user.id || req.user._id)?.toString();
  const sellerObjectId = new mongoose.Types.ObjectId(sellerIdStr);

  // 1) Inventory & Product Metrics (Executed concurrently via Promise.all)
  const [
    totalProducts,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
    ratingStats,
  ] = await Promise.all([
    Product.countDocuments({ seller: sellerObjectId }),
    Product.countDocuments({ seller: sellerObjectId, isActive: true }),
    Product.countDocuments({
      seller: sellerObjectId,
      stock: { $gt: 0, $lte: 10 },
      isActive: true,
    }),
    Product.countDocuments({
      seller: sellerObjectId,
      stock: { $lte: 0 },
      isActive: true,
    }),
    Product.aggregate([
      { $match: { seller: sellerObjectId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$ratingsAverage' },
          totalReviews: { $sum: '$ratingsQuantity' },
        },
      },
    ]),
  ]);

  // 2) Aggregated Financial Performance from Orders
  const orderSummary = await Order.aggregate([
    {
      $match: {
        'orderItems.seller': sellerObjectId,
        orderStatus: { $ne: 'cancelled' },
      },
    },
    { $unwind: '$orderItems' },
    {
      $match: {
        'orderItems.seller': sellerObjectId,
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
        },
        totalUnitsSold: { $sum: '$orderItems.quantity' },
        orderIds: { $addToSet: '$_id' },
      },
    },
  ]);

  const totalRevenue = orderSummary[0]?.totalRevenue
    ? Math.round(orderSummary[0].totalRevenue * 100) / 100
    : 0;
  const totalUnitsSold = orderSummary[0]?.totalUnitsSold || 0;
  const totalOrders = orderSummary[0]?.orderIds?.length || 0;

  // 3) Sales Trajectory (Daily performance for trajectory chart)
  const salesTrajectory = await Order.aggregate([
    {
      $match: {
        'orderItems.seller': sellerObjectId,
        orderStatus: { $ne: 'cancelled' },
      },
    },
    { $unwind: '$orderItems' },
    {
      $match: {
        'orderItems.seller': sellerObjectId,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        revenue: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
        },
        unitsSold: { $sum: '$orderItems.quantity' },
        orderIds: { $addToSet: '$_id' },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        revenue: { $round: ['$revenue', 2] },
        unitsSold: 1,
        orders: { $size: '$orderIds' },
      },
    },
    { $sort: { date: 1 } },
  ]);

  // 4) Top Performing Products by Revenue
  const topProducts = await Order.aggregate([
    {
      $match: {
        'orderItems.seller': sellerObjectId,
        orderStatus: { $ne: 'cancelled' },
      },
    },
    { $unwind: '$orderItems' },
    {
      $match: {
        'orderItems.seller': sellerObjectId,
      },
    },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        imageCover: { $first: '$orderItems.imageCover' },
        unitsSold: { $sum: '$orderItems.quantity' },
        revenue: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
        },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 1,
        productId: '$_id',
        name: 1,
        imageCover: 1,
        unitsSold: 1,
        revenue: { $round: ['$revenue', 2] },
      },
    },
  ]);

  // 5) Recent Orders containing seller's items
  const recentOrdersRaw = await Order.find({
    'orderItems.seller': sellerObjectId,
  })
    .sort('-createdAt')
    .limit(10)
    .populate('user', 'name email')
    .lean();

  const recentOrders = recentOrdersRaw.map((order) => {
    const sellerItems = (order.orderItems || []).filter(
      (item) => item.seller?.toString() === sellerIdStr
    );
    const sellerOrderRevenue = sellerItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    return {
      _id: order._id,
      createdAt: order.createdAt,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      buyerName: order.user?.name || order.shippingAddress?.fullName || 'Customer',
      buyerEmail: order.user?.email || '',
      itemsCount: sellerItems.reduce((acc, item) => acc + item.quantity, 0),
      sellerRevenue: Math.round(sellerOrderRevenue * 100) / 100,
      items: sellerItems,
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      metrics: {
        totalRevenue,
        totalUnitsSold,
        totalOrders,
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        averageRating: ratingStats[0]?.avgRating
          ? Math.round(ratingStats[0].avgRating * 10) / 10
          : 0,
        totalReviews: ratingStats[0]?.totalReviews || 0,
      },
      salesTrajectory,
      topProducts,
      recentOrders,
    },
  });
});

/**
 * Controller: Get Seller's Own Products Inventory (with search, sort, filter, pagination)
 */
exports.getSellerProducts = catchAsync(async (req, res, next) => {
  const sellerId = req.user.id || req.user._id;

  // Enforce query restriction to seller's own products
  const baseFilter = { seller: sellerId };

  if (req.query.sort) {
    req.query.sort = req.query.sort
      .split(',')
      .map((s) => {
        const trimmed = s.trim();
        if (trimmed === 'price') return 'effectivePrice';
        if (trimmed === '-price') return '-effectivePrice';
        return trimmed;
      })
      .join(',');
  }

  const features = new APIFeatures(
    Product.find(baseFilter).populate({ path: 'category', select: 'name slug icon' }),
    req.query
  )
    .filter()
    .search(['name', 'description', 'brand'])
    .sort()
    .limitFields()
    .paginate();

  const countFeatures = new APIFeatures(Product.find(baseFilter), req.query)
    .filter()
    .search(['name', 'description', 'brand']);

  const [products, total] = await Promise.all([
    features.query.lean(),
    countFeatures.query.countDocuments(),
  ]);

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const totalPages = Math.ceil(total / limit) || 1;

  res.status(200).json({
    status: 'success',
    results: products.length,
    total,
    totalPages,
    currentPage: page,
    data: {
      products,
      data: products,
    },
  });
});

/**
 * Controller: Get Single Seller Product (IDOR Protected)
 */
exports.getSellerProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug icon')
    .lean();

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  // IDOR Protection: Must be the owner seller or an admin
  const userId = (req.user.id || req.user._id)?.toString();
  const sellerId = product.seller?.toString();

  if (req.user.role === 'seller' && sellerId !== userId) {
    return next(
      new AppError('You do not have permission to access or manage this product', 403)
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      product,
      data: product,
    },
  });
});

/**
 * Controller: Create Product for Authenticated Seller Store
 */
exports.createSellerProduct = catchAsync(async (req, res, next) => {
  // Enforce seller ID ownership
  req.body.seller = req.user.id || req.user._id;

  // Resolve category if passed as slug/name string
  if (req.body.category && !mongoose.isValidObjectId(req.body.category)) {
    const categoryDoc = await Category.findOne({
      $or: [
        { slug: req.body.category.toLowerCase() },
        { name: { $regex: new RegExp(`^${req.body.category}`, 'i') } },
      ],
    }).lean();

    if (categoryDoc) {
      req.body.category = categoryDoc._id;
    }
  }

  const product = await Product.create(req.body);

  // Invalidate catalog cache
  catalogCache.invalidate('/api/v1/products');

  res.status(201).json({
    status: 'success',
    data: {
      product,
      data: product,
    },
  });
});

/**
 * Controller: Update Seller Product (IDOR Protected & Prevents Seller Reassignment)
 */
exports.updateSellerProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  // IDOR Protection Check
  const userId = (req.user.id || req.user._id)?.toString();
  const sellerId = product.seller?.toString();

  if (req.user.role === 'seller' && sellerId !== userId) {
    return next(
      new AppError('You do not have permission to manage this product', 403)
    );
  }

  // Prevent modifying seller ownership via update
  delete req.body.seller;

  // Resolve category if updated
  if (req.body.category && !mongoose.isValidObjectId(req.body.category)) {
    const categoryDoc = await Category.findOne({
      $or: [
        { slug: req.body.category.toLowerCase() },
        { name: { $regex: new RegExp(`^${req.body.category}`, 'i') } },
      ],
    }).lean();

    if (categoryDoc) {
      req.body.category = categoryDoc._id;
    }
  }

  const finalPrice = req.body.price !== undefined ? parseFloat(req.body.price) : product.price;
  const finalDiscount = req.body.priceDiscount !== undefined ? parseFloat(req.body.priceDiscount) : product.priceDiscount;
  const finalDealPct = req.body.dealDiscountPercentage !== undefined ? parseInt(req.body.dealDiscountPercentage, 10) : product.dealDiscountPercentage;

  if (finalDiscount > 0) {
    req.body.effectivePrice = finalDiscount;
  } else if (finalDealPct > 0 && finalPrice > 0) {
    req.body.effectivePrice = Math.round(finalPrice * (1 - finalDealPct / 100));
  } else if (finalPrice !== undefined) {
    req.body.effectivePrice = finalPrice;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('category', 'name slug icon');

  // Invalidate catalog cache
  catalogCache.invalidate('/api/v1/products');

  res.status(200).json({
    status: 'success',
    data: {
      product: updatedProduct,
      data: updatedProduct,
    },
  });
});

/**
 * Controller: Delete Seller Product (IDOR Protected)
 */
exports.deleteSellerProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  // IDOR Protection Check
  const userId = (req.user.id || req.user._id)?.toString();
  const sellerId = product.seller?.toString();

  if (req.user.role === 'seller' && sellerId !== userId) {
    return next(
      new AppError('You do not have permission to manage this product', 403)
    );
  }

  await Product.findByIdAndDelete(req.params.id);

  // Invalidate catalog cache
  catalogCache.invalidate('/api/v1/products');

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
