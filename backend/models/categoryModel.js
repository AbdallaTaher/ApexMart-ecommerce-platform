const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A category must have a name'],
      unique: true,
      trim: true,
      minlength: [2, 'A category name must be at least 2 characters long'],
      maxlength: [50, 'A category name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Category description cannot exceed 500 characters'],
    },
    image: {
      type: String,
      default: 'default-category.jpg',
    },
    icon: {
      type: String,
      default: 'tag',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// High-frequency compound indexes
categorySchema.index({ slug: 1, isActive: 1 });
categorySchema.index({ displayOrder: 1, name: 1 });

/**
 * Pre-save middleware: Generate URL-safe slug from name
 */
categorySchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

/**
 * Query middleware: Automatically filter out inactive categories
 */
categorySchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
