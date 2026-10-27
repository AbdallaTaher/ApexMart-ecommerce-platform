const Category = require('../models/categoryModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Public category retrieval delegating to generic handler factory
 */
exports.getAllCategories = factory.getAll(Category);
exports.getCategory = factory.getOne(Category);

/**
 * Retrieve single category by URL slug
 */
exports.getCategoryBySlug = catchAsync(async (req, res, next) => {
  const cleanSlug = (req.params.slug || '').trim().toLowerCase();
  const category = await Category.findOne({ slug: cleanSlug }).lean();

  if (!category) {
    return next(new AppError('No category found with that slug', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      category,
      data: category,
    },
  });
});

/**
 * Administrative category mutation handlers
 */
exports.createCategory = factory.createOne(Category);
exports.updateCategory = factory.updateOne(Category);
exports.deleteCategory = factory.deleteOne(Category);
