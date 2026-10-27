const mongoose = require('mongoose');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { verifyAndFormatCart, calculateCurrentPrice } = require('../utils/cartHelper');

/**
 * Cart Synchronization Controller
 * Supports both guest users (session-less validation) and authenticated users (DB persistence).
 * Enforces live inventory verification, price freshness, and Amazon Prime free shipping calculations.
 */

/**
 * Synchronize client cart with server
 * POST /api/v1/cart/sync
 * Public/Guest or Authenticated (via protectOptional)
 */
exports.syncCart = catchAsync(async (req, res, next) => {
  const { items: rawItems = [], action = 'merge' } = req.body;

  if (rawItems && !Array.isArray(rawItems)) {
    return next(new AppError('Items payload must be an array of cart items', 400));
  }

  // 1) Guest User Workflow (Stateless Verification)
  if (!req.user) {
    const verifiedResult = await verifyAndFormatCart(rawItems);
    return res.status(200).json({
      status: 'success',
      data: {
        cart: verifiedResult,
      },
    });
  }

  // 2) Authenticated User Workflow (Database Persistence)
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  let mergedItems = [];

  if (action === 'replace') {
    // Completely replace server cart with incoming client items
    mergedItems = rawItems;
  } else {
    // Merge client items with existing database items
    const itemMap = new Map();

    // Load existing items from DB
    cart.items.forEach((item) => {
      const pId = item.product.toString();
      itemMap.set(pId, item.quantity);
    });

    // Merge incoming items
    rawItems.forEach((incoming) => {
      const pId = (incoming.product?._id || incoming.product || incoming.productId)?.toString();
      if (!pId) return;

      const incomingQty = parseInt(incoming.quantity, 10) || 1;
      const existingQty = itemMap.get(pId) || 0;

      // When merging, increment quantity (clamped to max 99)
      itemMap.set(pId, Math.min(existingQty + incomingQty, 99));
    });

    mergedItems = Array.from(itemMap.entries()).map(([product, quantity]) => ({
      product,
      quantity,
    }));
  }

  // Verify stock & calculate authoritative prices
  const verifiedResult = await verifyAndFormatCart(mergedItems);

  // Persist only available/valid items with positive quantity
  cart.items = verifiedResult.items
    .filter((item) => item.effectiveQuantity > 0)
    .map((item) => ({
      product: item.product._id,
      quantity: item.effectiveQuantity,
      price: item.unitPrice,
    }));

  await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      cart: verifiedResult,
    },
  });
});

/**
 * Retrieve authenticated user's cart
 * GET /api/v1/cart
 * Protected (requires auth)
 */
exports.getCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Always re-verify items against current live product stock and price
  const verifiedResult = await verifyAndFormatCart(cart.items);

  // If any stock discrepancies or price updates were detected, update the saved cart
  if (verifiedResult.hasUnavailableItems || verifiedResult.hasStockAdjustments) {
    cart.items = verifiedResult.items
      .filter((item) => item.effectiveQuantity > 0)
      .map((item) => ({
        product: item.product._id,
        quantity: item.effectiveQuantity,
        price: item.unitPrice,
      }));
    await cart.save();
  }

  res.status(200).json({
    status: 'success',
    data: {
      cart: verifiedResult,
    },
  });
});

/**
 * Add or increment an item in the authenticated user's cart
 * POST /api/v1/cart/items
 * Protected (requires auth)
 */
exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return next(new AppError('Please provide a valid product ID', 400));
  }

  const requestedQty = parseInt(quantity, 10);
  if (isNaN(requestedQty) || requestedQty < 1) {
    return next(new AppError('Quantity must be an integer of at least 1', 400));
  }

  // Check product existence, activity, and stock
  const product = await Product.findById(productId);
  if (!product || product.isActive === false) {
    return next(new AppError('Product not found or no longer available', 404));
  }

  if (product.stock === 0) {
    return next(new AppError('This product is currently out of stock', 400));
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    const newQty = cart.items[existingItemIndex].quantity + requestedQty;
    if (newQty > product.stock) {
      cart.items[existingItemIndex].quantity = product.stock;
    } else {
      cart.items[existingItemIndex].quantity = Math.min(newQty, 99);
    }
  } else {
    cart.items.push({
      product: product._id,
      quantity: Math.min(requestedQty, product.stock, 99),
      price: calculateCurrentPrice(product),
    });
  }

  const verifiedResult = await verifyAndFormatCart(cart.items);

  cart.items = verifiedResult.items
    .filter((item) => item.effectiveQuantity > 0)
    .map((item) => ({
      product: item.product._id,
      quantity: item.effectiveQuantity,
      price: item.unitPrice,
    }));

  await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      cart: verifiedResult,
    },
  });
});

/**
 * Update quantity of a specific cart item
 * PATCH /api/v1/cart/items/:productId
 * Protected (requires auth)
 */
exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return next(new AppError('Invalid product ID parameter', 400));
  }

  if (quantity === undefined || isNaN(parseInt(quantity, 10))) {
    return next(new AppError('Please provide a valid quantity number', 400));
  }

  const targetQty = parseInt(quantity, 10);

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new AppError('Cart not found for this user', 404));
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    return next(new AppError('Item not found in your cart', 404));
  }

  if (targetQty <= 0) {
    // Remove item if quantity is zero or negative
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = Math.min(targetQty, 99);
  }

  const verifiedResult = await verifyAndFormatCart(cart.items);

  cart.items = verifiedResult.items
    .filter((item) => item.effectiveQuantity > 0)
    .map((item) => ({
      product: item.product._id,
      quantity: item.effectiveQuantity,
      price: item.unitPrice,
    }));

  await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      cart: verifiedResult,
    },
  });
});

/**
 * Remove an item completely from the cart
 * DELETE /api/v1/cart/items/:productId
 * Protected (requires auth)
 */
exports.removeFromCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return next(new AppError('Invalid product ID parameter', 400));
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);

  const verifiedResult = await verifyAndFormatCart(cart.items);

  cart.items = verifiedResult.items
    .filter((item) => item.effectiveQuantity > 0)
    .map((item) => ({
      product: item.product._id,
      quantity: item.effectiveQuantity,
      price: item.unitPrice,
    }));

  await cart.save();

  res.status(200).json({
    status: 'success',
    data: {
      cart: verifiedResult,
    },
  });
});

/**
 * Empty the entire shopping cart
 * DELETE /api/v1/cart
 * Protected (requires auth)
 */
exports.clearCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    cart.items = [];
    await cart.save();
  }

  const emptyCart = await verifyAndFormatCart([]);

  res.status(200).json({
    status: 'success',
    data: {
      cart: emptyCart,
    },
  });
});
