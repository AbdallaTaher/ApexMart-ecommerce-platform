const mongoose = require('mongoose');
const Product = require('../models/productModel');

/**
 * Calculate the authoritative server-side unit price for a product
 * Takes into account active deal percentages and direct price discounts.
 *
 * @param {Object} product - Product document or plain object
 * @returns {number} Current effective unit price
 */
function calculateCurrentPrice(product) {
  if (!product) return 0;

  if (product.priceDiscount && product.priceDiscount > 0) {
    return product.priceDiscount;
  }

  if (product.isDeal && product.dealDiscountPercentage > 0) {
    return Math.round(product.price * (1 - product.dealDiscountPercentage / 100));
  }

  return product.price || 0;
}

/**
 * Verify cart items against live database records, calculate real-time pricing,
 * enforce inventory boundaries, and build Amazon-standard cart summaries.
 *
 * @param {Array<Object>} rawItems - Array of { product: ObjectId|string, quantity: number }
 * @returns {Promise<{ items: Array, summary: Object, hasUnavailableItems: boolean, hasStockAdjustments: boolean }>}
 */
async function verifyAndFormatCart(rawItems = []) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return {
      items: [],
      summary: {
        itemsCount: 0,
        subtotal: 0,
        freeShippingThreshold: 35.0,
        freeShippingEligible: false,
        amountUntilFreeShipping: 35.0,
        shippingFee: 0,
        estimatedTax: 0,
        total: 0,
      },
      hasUnavailableItems: false,
      hasStockAdjustments: false,
    };
  }

  // 1) Extract and sanitize valid ObjectIds
  const productIds = rawItems
    .map((item) => {
      const id = item.product?._id || item.product || item.productId;
      return typeof id === 'string' || id instanceof mongoose.Types.ObjectId ? id.toString() : null;
    })
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

  // 2) Batch query active products from MongoDB
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let hasUnavailableItems = false;
  let hasStockAdjustments = false;

  // 3) Process and verify each line item
  const verifiedItems = rawItems
    .map((item) => {
      const rawId = item.product?._id || item.product || item.productId;
      const productIdStr = rawId ? rawId.toString() : null;

      // Ensure positive integer quantity between 1 and 99
      let requestedQty = parseInt(item.quantity, 10);
      if (isNaN(requestedQty) || requestedQty < 1) requestedQty = 1;
      if (requestedQty > 99) requestedQty = 99;

      const product = productIdStr ? productMap.get(productIdStr) : null;

      // Case A: Product not found or soft-deleted/inactive
      if (!product || product.isActive === false) {
        hasUnavailableItems = true;
        return {
          product: {
            _id: productIdStr,
            name: item.name || 'Unavailable Product',
            imageCover: item.imageCover || 'default-product.jpg',
            price: item.price || 0,
            stock: 0,
            isActive: false,
          },
          quantity: requestedQty,
          effectiveQuantity: 0,
          unitPrice: 0,
          lineTotal: 0,
          status: 'UNAVAILABLE',
          isAvailable: false,
          availableStock: 0,
          message: 'This product is no longer available or has been discontinued.',
        };
      }

      const unitPrice = calculateCurrentPrice(product);

      // Case B: Completely out of stock
      if (product.stock === 0) {
        hasUnavailableItems = true;
        return {
          product: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            imageCover: product.imageCover,
            brand: product.brand,
            badge: product.badge,
            price: product.price,
            priceDiscount: product.priceDiscount,
            stock: 0,
            isActive: true,
          },
          quantity: requestedQty,
          effectiveQuantity: 0,
          unitPrice,
          lineTotal: 0,
          status: 'OUT_OF_STOCK',
          isAvailable: false,
          availableStock: 0,
          message: 'Item is currently out of stock.',
        };
      }

      // Case C: Stock is limited (requested quantity exceeds available inventory)
      if (requestedQty > product.stock) {
        hasStockAdjustments = true;
        const effectiveQty = product.stock;
        const lineTotal = Math.round(unitPrice * effectiveQty * 100) / 100;

        return {
          product: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            imageCover: product.imageCover,
            brand: product.brand,
            badge: product.badge,
            price: product.price,
            priceDiscount: product.priceDiscount,
            stock: product.stock,
            isActive: true,
          },
          quantity: requestedQty,
          effectiveQuantity: effectiveQty,
          unitPrice,
          lineTotal,
          status: 'LIMITED_STOCK',
          isAvailable: true,
          availableStock: product.stock,
          message: `Only ${product.stock} items left in stock. Quantity has been updated.`,
        };
      }

      // Case D: Full stock available
      const lineTotal = Math.round(unitPrice * requestedQty * 100) / 100;
      return {
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          imageCover: product.imageCover,
          brand: product.brand,
          badge: product.badge,
          price: product.price,
          priceDiscount: product.priceDiscount,
          stock: product.stock,
          isActive: true,
        },
        quantity: requestedQty,
        effectiveQuantity: requestedQty,
        unitPrice,
        lineTotal,
        status: 'IN_STOCK',
        isAvailable: true,
        availableStock: product.stock,
        message: 'In stock',
      };
    })
    .filter(Boolean);

  // 4) Calculate financial totals and free shipping threshold
  const availableItems = verifiedItems.filter(
    (item) => item.isAvailable && item.effectiveQuantity > 0
  );

  const itemsCount = availableItems.reduce(
    (sum, item) => sum + item.effectiveQuantity,
    0
  );

  const subtotal = Math.round(
    availableItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100
  ) / 100;

  const freeShippingThreshold = 35.0;
  const freeShippingEligible = subtotal >= freeShippingThreshold && subtotal > 0;
  const amountUntilFreeShipping = freeShippingEligible || subtotal === 0
    ? 0
    : Math.round((freeShippingThreshold - subtotal) * 100) / 100;

  const shippingFee = subtotal === 0 || freeShippingEligible ? 0 : 5.99;
  const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + shippingFee + estimatedTax) * 100) / 100;

  const summary = {
    itemsCount,
    subtotal,
    freeShippingThreshold,
    freeShippingEligible,
    amountUntilFreeShipping,
    shippingFee,
    estimatedTax,
    total,
  };

  return {
    items: verifiedItems,
    summary,
    hasUnavailableItems,
    hasStockAdjustments,
  };
}

module.exports = {
  calculateCurrentPrice,
  verifyAndFormatCart,
};
