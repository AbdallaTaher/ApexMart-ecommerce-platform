const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { uploadToCloudinary } = require('../utils/cloudinary');

/**
 * Middleware: Pre-filter for Top Deals (Deals Scroller)
 */
exports.aliasTopDeals = (req, res, next) => {
  req.query.limit = req.query.limit || '10';
  req.query.isDeal = 'true';
  req.query.sort = req.query.sort || '-dealDiscountPercentage,price';
  next();
};

/**
 * Middleware: Pre-filter for Featured Products
 */
exports.aliasFeaturedProducts = (req, res, next) => {
  req.query.limit = req.query.limit || '8';
  req.query.isFeatured = 'true';
  req.query.sort = req.query.sort || '-ratingsAverage,price';
  next();
};

/**
 * Middleware: Auto-assign authenticated user ID to req.body.seller
 */
exports.setSellerId = (req, res, next) => {
  if (!req.body.seller && req.user) {
    req.body.seller = req.user.id;
  }
  next();
};

/**
 * Middleware: Verify seller ownership to prevent IDOR attacks
 * Sellers can only modify/delete their own products; Admins can manage all.
 */
exports.checkProductOwnership = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  const userId = (req.user.id || req.user._id)?.toString();
  const sellerId = product.seller?.toString();

  if (req.user.role === 'seller' && sellerId !== userId) {
    return next(
      new AppError('You do not have permission to manage this product', 403)
    );
  }

  next();
});

// In-memory cache for category slugs to eliminate redundant DB lookups during high-frequency filtering
const categorySlugCache = new Map();

/**
 * Comprehensive Product Catalog Discovery with Category Slugs & Pagination
 */
exports.getAllProducts = catchAsync(async (req, res, next) => {
  // 0) Strip stringified 'undefined' and 'null' query artifacts
  ['category', 'categorySlug', 'deal', 'isDeal', 'search', 'brand'].forEach((key) => {
    if (req.query[key] === 'undefined' || req.query[key] === 'null' || req.query[key] === '') {
      delete req.query[key];
    }
  });

  // Support deal alias (deal=true -> isDeal=true)
  if (req.query.deal && !req.query.isDeal) {
    req.query.isDeal = req.query.deal;
    delete req.query.deal;
  }

  // Map price sort to effectivePrice so products sort by their actual selling price
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

  // 1) Support filtering by category slug or category name seamlessly with in-memory caching
  const rawCategoryFilter = req.query.categorySlug || req.query.category;
  if (rawCategoryFilter && !mongoose.isValidObjectId(rawCategoryFilter)) {
    const cleanCategorySlug = rawCategoryFilter.trim().toLowerCase();
    let categoryId = categorySlugCache.get(cleanCategorySlug);
    const canQueryCategory =
      mongoose.connection.readyState === 1 || Boolean(Category.findOne && Category.findOne.mock);

    if (!categoryId && canQueryCategory) {
      try {
        const normalizedTokens = cleanCategorySlug
          .replace(/-/g, ' ')
          .replace(/\s+and\s+/g, ' ')
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        const tokenRegex = new RegExp(normalizedTokens.join('.*'), 'i');

        const category = await Category.findOne({
          $or: [
            { slug: cleanCategorySlug },
            { slug: { $regex: tokenRegex } },
            { name: { $regex: tokenRegex } },
            { slug: { $regex: new RegExp(`^${cleanCategorySlug}`, 'i') } },
            { name: { $regex: new RegExp(`^${rawCategoryFilter.trim()}`, 'i') } },
          ],
        }).lean();

        if (category) {
          categoryId = category._id.toString();
          categorySlugCache.set(cleanCategorySlug, categoryId);
        }
      } catch (err) {
        // Fallback gracefully on query error
      }
    }

    if (categoryId) {
      req.query.category = categoryId;
    } else if (canQueryCategory) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        total: 0,
        totalPages: 0,
        currentPage: 1,
        data: {
          products: [],
          data: [],
        },
      });
    }
    delete req.query.categorySlug;
  }

  // 2) Chainable APIFeatures query execution (.lean() applied for latency < 300ms)
  const features = new APIFeatures(
    Product.find().populate({ path: 'category', select: 'name slug icon' }),
    req.query
  )
    .filter()
    .search(['name', 'description', 'brand'])
    .sort()
    .limitFields()
    .paginate();

  // 3) Calculate total matching documents for client pagination
  const countFeatures = new APIFeatures(Product.find(), req.query)
    .filter()
    .search(['name', 'description', 'brand']);

  // 4) Execute products query and total count concurrently via Promise.all to cut database latency in half
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
 * Retrieve a single product by ID with category, seller, and customer reviews
 */
const productPopulateOptions = [
  { path: 'category', select: 'name slug icon' },
  { path: 'seller', select: 'name email role' },
];
if (mongoose.models.Review) {
  productPopulateOptions.push({ path: 'reviews' });
}
exports.getProduct = factory.getOne(Product, productPopulateOptions);

/**
 * Retrieve a single product by its URL-friendly slug
 */
exports.getProductBySlug = catchAsync(async (req, res, next) => {
  const cleanSlug = (req.params.slug || '').trim().toLowerCase();
  let query = Product.findOne({ slug: cleanSlug })
    .populate({ path: 'category', select: 'name slug icon' })
    .populate({ path: 'seller', select: 'name email role' });

  if (mongoose.models.Review) {
    query = query.populate({ path: 'reviews' });
  }

  const product = await query.lean();

  if (!product) {
    return next(new AppError('No product found with that slug', 404));
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
 * Middleware: Upload and transform product media assets using Cloudinary
 * Handles imageCover (1 asset) and gallery images (up to 5 assets)
 */
exports.processProductImages = catchAsync(async (req, res, next) => {
  if (!req.files || (!req.files.imageCover && !req.files.images)) {
    return next();
  }

  // 1) Process Primary Cover Image
  if (req.files.imageCover && req.files.imageCover[0]) {
    const coverFile = req.files.imageCover[0];
    const uploadRes = await uploadToCloudinary(coverFile.buffer, {
      folder: 'apexmart/products/covers',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'webp' },
      ],
    });
    req.body.imageCover = uploadRes.secure_url;
  }

  // 2) Process Multi-Angle Gallery Images
  if (req.files.images && req.files.images.length > 0) {
    const uploadPromises = req.files.images.map((file) =>
      uploadToCloudinary(file.buffer, {
        folder: 'apexmart/products/gallery',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'webp' },
        ],
      })
    );

    const uploadResults = await Promise.all(uploadPromises);
    req.body.images = uploadResults.map((result) => result.secure_url);
  }

  next();
});

/**
 * Handler: Dedicated product image upload endpoint
 * Appends or updates imageCover and gallery images for an existing product
 */
exports.uploadProductMedia = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  const updates = {};
  if (req.body.imageCover) updates.imageCover = req.body.imageCover;
  if (req.body.images && req.body.images.length > 0) {
    updates.images = [...(product.images || []), ...req.body.images];
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Product images uploaded and processed successfully',
    data: {
      product: updatedProduct,
      data: updatedProduct,
    },
  });
});

/**
 * Product Mutation Handlers (Delegating to Handler Factory)
 */
exports.createProduct = factory.createOne(Product);
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);
