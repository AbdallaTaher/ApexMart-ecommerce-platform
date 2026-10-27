const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'A cart item must reference a product'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [99, 'Quantity cannot exceed 99 items per product'],
      default: 1,
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A cart must belong to an authenticated user'],
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for item count
cartSchema.virtual('totalItems').get(function () {
  return this.items ? this.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
