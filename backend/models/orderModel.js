const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'An order item must reference a product'],
  },
  name: {
    type: String,
    required: [true, 'An order item must snapshot the product title'],
    trim: true,
  },
  imageCover: {
    type: String,
    default: 'default-product.jpg',
  },
  price: {
    type: Number,
    required: [true, 'An order item must have an authoritative price snapshot'],
    min: [0, 'Item price cannot be negative'],
  },
  quantity: {
    type: Number,
    required: [true, 'An order item must specify quantity'],
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Shipping address requires full name'],
    trim: true,
  },
  street: {
    type: String,
    required: [true, 'Shipping address requires street address'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'Shipping address requires city'],
    trim: true,
  },
  state: {
    type: String,
    trim: true,
    default: '',
  },
  postalCode: {
    type: String,
    required: [true, 'Shipping address requires postal or zip code'],
    trim: true,
  },
  country: {
    type: String,
    required: [true, 'Shipping address requires country'],
    trim: true,
    default: 'United States',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'An order must belong to an authenticated user'],
      index: true,
    },
    orderItems: {
      type: [orderItemSchema],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'An order must contain at least one valid item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'An order requires a valid shipping address'],
    },
    deliverySpeed: {
      type: String,
      enum: {
        values: ['standard', 'two_day', 'next_day'],
        message: 'Delivery speed must be either standard, two_day, or next_day',
      },
      default: 'standard',
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    // Financial Breakdown
    itemsPrice: {
      type: Number,
      required: true,
      min: [0, 'Items subtotal cannot be negative'],
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, 'Shipping fee cannot be negative'],
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, 'Tax cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
    // Payment Gateway & Settlement
    paymentMethod: {
      type: String,
      enum: {
        values: ['stripe', 'cash_on_delivery'],
        message: 'Payment method must be stripe or cash_on_delivery',
      },
      default: 'stripe',
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded'],
        message: 'Payment status must be pending, paid, failed, or refunded',
      },
      default: 'pending',
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
      index: true,
    },
    stripeClientSecret: {
      type: String,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    // Order Lifecycle States
    orderStatus: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        message: 'Order status must be pending, processing, shipped, delivered, or cancelled',
      },
      default: 'pending',
      index: true,
    },
    paidAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    carrier: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound Indexing for optimal query latency (<300ms SLA)
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ idempotencyKey: 1, user: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
