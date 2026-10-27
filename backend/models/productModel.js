const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A product must have a title / name'],
      trim: true,
      minlength: [3, 'Product name must have at least 3 characters'],
      maxlength: [150, 'Product name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'A product must have a detailed description'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'A product must have a price'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    priceDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Discounted price cannot be negative'],
      validate: {
        // Custom validator (runs on CREATE, SAVE, and UPDATE)
        validator: function (val) {
          if (!val || val === 0) return true;
          let basePrice = this.price;
          if (basePrice === undefined && typeof this.getUpdate === 'function') {
            const update = this.getUpdate();
            basePrice = update?.price || update?.$set?.price;
          }
          if (basePrice === undefined) return true;
          return val < basePrice;
        },
        message: 'Discount price ({VALUE}) must be strictly less than regular price',
      },
    },
    effectivePrice: {
      type: Number,
      index: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'A product must belong to a category'],
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'A product must specify a brand or manufacturer'],
      trim: true,
      default: 'ApexMart',
      index: true,
    },
    seller: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A product must be listed by an authenticated seller or admin'],
      index: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A product must have a primary cover image'],
      default: 'default-product.jpg',
    },
    images: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: [true, 'A product must specify available stock count'],
      min: [0, 'Stock cannot be negative'],
      default: 10,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1.0, 'Rating must be at least 1.0'],
      max: [5.0, 'Rating cannot exceed 5.0'],
      set: (val) => Math.round(val * 10) / 10, // e.g. 4.6666 -> 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeal: {
      type: Boolean,
      default: false,
      index: true,
    },
    dealDiscountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    badge: {
      type: String,
      enum: {
        values: ['Best Seller', "Amazon's Choice", 'Limited Deal', 'New Arrival', 'None'],
        message: 'Badge must be either Best Seller, Amazon Choice, Limited Deal, New Arrival, or None',
      },
      default: 'None',
    },
    specifications: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// High-frequency compound indexes to prevent slow full-collection scans
productSchema.index({ category: 1, price: 1 });
productSchema.index({ category: 1, effectivePrice: 1 });
productSchema.index({ category: 1, ratingsAverage: -1 });
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ effectivePrice: 1, ratingsAverage: -1 });
productSchema.index({ isDeal: 1, dealDiscountPercentage: -1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ seller: 1, createdAt: -1 });
productSchema.index({ slug: 1, isActive: 1 });

// Full-text search index for fast keyword queries
productSchema.index(
  { name: 'text', description: 'text', brand: 'text' },
  { weights: { name: 10, brand: 5, description: 1 } }
);

/**
 * Virtual: Calculate inStock boolean
 */
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

/**
 * Virtual: Calculate discount percentage
 */
productSchema.virtual('discountPercentage').get(function () {
  if (this.priceDiscount && this.priceDiscount > 0 && this.price > 0) {
    return Math.round(((this.price - this.priceDiscount) / this.price) * 100);
  }
  return 0;
});

/**
 * Virtual Populate: Connect product to its customer reviews
 */
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

/**
 * Pre-save middleware: Generate URL-safe slug from name
 */
productSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  // Automatically calculate deal discount percentage if priceDiscount is provided
  if (this.priceDiscount > 0 && this.price > 0) {
    this.dealDiscountPercentage = Math.round(
      ((this.price - this.priceDiscount) / this.price) * 100
    );
    this.isDeal = true;
  }

  // Calculate effective selling price for accurate sorting and filtering
  if (this.priceDiscount > 0) {
    this.effectivePrice = this.priceDiscount;
  } else if (this.dealDiscountPercentage > 0 && this.price > 0) {
    this.effectivePrice = Math.round(this.price * (1 - this.dealDiscountPercentage / 100));
  } else {
    this.effectivePrice = this.price;
  }

  next();
});

/**
 * Query middleware: Filter out inactive products by default
 */
productSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
