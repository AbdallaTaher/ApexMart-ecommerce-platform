import { describe, it, expect, vi } from 'vitest';
const APIFeatures = require('../../backend/utils/apiFeatures');

describe('APIFeatures Class Unit Tests', () => {
  it('should filter query parameters and transform operators into MongoDB syntax ($gte, $lte, etc.)', () => {
    const mockQuery = { find: vi.fn().mockReturnThis() };
    const queryString = {
      price: { gte: '100', lte: '500' },
      category: 'electronics',
      page: '2',
      sort: '-price',
      limit: '10',
      fields: 'name,price',
    };

    const features = new APIFeatures(mockQuery, queryString);
    features.filter();

    expect(mockQuery.find).toHaveBeenCalledWith({
      price: { $gte: '100', $lte: '500' },
      category: 'electronics',
    });
  });

  it('should format sort parameter correctly or fallback to default sort', () => {
    const mockQueryWithSort = { sort: vi.fn().mockReturnThis() };
    const featuresWithSort = new APIFeatures(mockQueryWithSort, {
      sort: 'price,-ratingsAverage',
    });
    featuresWithSort.sort();
    expect(mockQueryWithSort.sort).toHaveBeenCalledWith('price -ratingsAverage');

    const mockQueryDefault = { sort: vi.fn().mockReturnThis() };
    const featuresDefault = new APIFeatures(mockQueryDefault, {});
    featuresDefault.sort();
    expect(mockQueryDefault.sort).toHaveBeenCalledWith('-createdAt _id');
  });

  it('should format field limiting projection or exclude __v by default', () => {
    const mockQueryWithFields = { select: vi.fn().mockReturnThis() };
    const featuresWithFields = new APIFeatures(mockQueryWithFields, {
      fields: 'title,price,discountPrice',
    });
    featuresWithFields.limitFields();
    expect(mockQueryWithFields.select).toHaveBeenCalledWith(
      'title price discountPrice'
    );

    const mockQueryDefault = { select: vi.fn().mockReturnThis() };
    const featuresDefault = new APIFeatures(mockQueryDefault, {});
    featuresDefault.limitFields();
    expect(mockQueryDefault.select).toHaveBeenCalledWith('-__v');
  });

  it('should calculate pagination skip and limit correctly', () => {
    const mockQuery = {
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };
    const features = new APIFeatures(mockQuery, { page: '3', limit: '25' });
    features.paginate();

    // page 3 with limit 25 -> skip = (3 - 1) * 25 = 50
    expect(mockQuery.skip).toHaveBeenCalledWith(50);
    expect(mockQuery.limit).toHaveBeenCalledWith(25);
  });

  it('should apply regex search across specified fields when search or q is provided', () => {
    const mockQuery = { find: vi.fn().mockReturnThis() };
    const features = new APIFeatures(mockQuery, { search: 'wireless earbuds' });
    features.search(['name', 'description']);

    expect(mockQuery.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'wireless earbuds', $options: 'i' } },
        { description: { $regex: 'wireless earbuds', $options: 'i' } },
      ],
    });
  });
});
