/**
 * Generic APIFeatures class for MongoDB / Mongoose queries.
 * Provides chainable query manipulation: filtering, searching, sorting, field limiting, and pagination.
 */
class APIFeatures {
  /**
   * @param {Object} query - Mongoose Query object (e.g. Product.find())
   * @param {Object} queryString - Express req.query object
   */
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString || {};
  }

  /**
   * 1) Filtering: Exclude control parameters and support MongoDB operators ($gte, $gt, $lte, $lt)
   * Example: ?price[gte]=50&category=electronics
   */
  filter() {
    // 1A) Filtering out pagination, sorting, search, and projection fields
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'q'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced filtering: Convert operators (gte, gt, lte, lt) to MongoDB syntax ($gte, $gt, etc.)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  /**
   * 2) Search: Keyword regex search across specified fields (case-insensitive)
   * Example: ?search=phone or ?q=wireless
   * @param {Array<string>} [fields=['name', 'description', 'brand']]
   */
  search(fields = ['name', 'description', 'brand']) {
    const searchTerm = this.queryString.search || this.queryString.q;
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      const trimmed = searchTerm.trim();
      const regex = { $regex: trimmed, $options: 'i' };
      const orConditions = fields.map((field) => ({ [field]: regex }));
      this.query = this.query.find({ $or: orConditions });
    }
    return this;
  }

  /**
   * 3) Sorting: Sort documents ascending or descending by specified fields
   * Example: ?sort=price,-ratingsAverage
   */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default: Sort by newest first, then stable _id
      this.query = this.query.sort('-createdAt _id');
    }

    return this;
  }

  /**
   * 4) Field Limiting (Projection): Return only selected fields to optimize bandwidth
   * Example: ?fields=name,price,ratingsAverage
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // Exclude internal Mongoose version key by default
      this.query = this.query.select('-__v');
    }

    return this;
  }

  /**
   * 5) Pagination: Limit the number of records returned per page
   * Example: ?page=2&limit=20
   */
  paginate() {
    const page = Math.max(1, parseInt(this.queryString.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(this.queryString.limit, 10) || 20));
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
