import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../frontend/src/services/apiClient';
import {
  getProducts,
  getTopDeals,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  getCategories,
  getCategoryBySlug,
} from '../../frontend/src/services/apiProducts';

describe('Product & Catalog Service Unit Tests (apiProducts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should query /products with properly formatted URLSearchParams', async () => {
    const mockResponse = {
      data: {
        status: 'success',
        results: 2,
        total: 50,
        totalPages: 3,
        currentPage: 1,
        data: {
          products: [
            { _id: 'p1', name: 'Product 1', price: 100 },
            { _id: 'p2', name: 'Product 2', price: 200 },
          ],
        },
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

    const result = await getProducts({
      page: 1,
      limit: 20,
      sort: '-price',
      search: 'wireless headphones',
      categorySlug: 'electronics',
      'price[gte]': '50',
      'price[lte]': '300',
      'ratingsAverage[gte]': '4',
    });

    expect(getSpy).toHaveBeenCalledTimes(1);
    const calledUrl = getSpy.mock.calls[0][0];

    expect(calledUrl).toContain('/products?');
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('limit=20');
    expect(calledUrl).toContain('sort=-price');
    expect(calledUrl).toContain('search=wireless+headphones');
    expect(calledUrl).toContain('categorySlug=electronics');
    expect(calledUrl).toContain('price%5Bgte%5D=50');
    expect(calledUrl).toContain('price%5Blte%5D=300');
    expect(calledUrl).toContain('ratingsAverage%5Bgte%5D=4');

    expect(result.products).toHaveLength(2);
    expect(result.total).toBe(50);
    expect(result.totalPages).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.results).toBe(2);
  });

  it('should ignore empty, null, or undefined parameters in getProducts', async () => {
    const mockResponse = {
      data: {
        status: 'success',
        results: 1,
        total: 1,
        totalPages: 1,
        currentPage: 1,
        data: { products: [{ _id: 'p1', name: 'Test' }] },
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

    await getProducts({
      page: 1,
      search: '',
      category: null,
      sort: undefined,
    });

    const calledUrl = getSpy.mock.calls[0][0];
    expect(calledUrl).toBe('/products?page=1');
  });

  it('should fetch top deals from /products/top-deals with custom limit', async () => {
    const mockDeals = [
      { _id: 'd1', name: 'Deal Product 1', dealDiscountPercentage: 30 },
      { _id: 'd2', name: 'Deal Product 2', dealDiscountPercentage: 20 },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { data: { products: mockDeals } },
    });

    const deals = await getTopDeals(5);

    expect(getSpy).toHaveBeenCalledWith('/products/top-deals?limit=5');
    expect(deals).toHaveLength(2);
    expect(deals[0].dealDiscountPercentage).toBe(30);
  });

  it('should fetch featured products from /products/featured', async () => {
    const mockFeatured = [{ _id: 'f1', name: 'Featured Item', isFeatured: true }];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { data: { products: mockFeatured } },
    });

    const featured = await getFeaturedProducts(4);

    expect(getSpy).toHaveBeenCalledWith('/products/featured?limit=4');
    expect(featured).toHaveLength(1);
  });

  it('should fetch a single product by slug and id', async () => {
    const mockProduct = { _id: 'prod123', slug: 'apex-laptop-pro', name: 'Apex Laptop' };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { data: { product: mockProduct } },
    });

    const bySlug = await getProductBySlug('apex-laptop-pro');
    expect(getSpy).toHaveBeenCalledWith('/products/slug/apex-laptop-pro');
    expect(bySlug.slug).toBe('apex-laptop-pro');

    const byId = await getProductById('prod123');
    expect(getSpy).toHaveBeenCalledWith('/products/prod123');
    expect(byId._id).toBe('prod123');
  });

  it('should fetch all categories sorted by name', async () => {
    const mockCats = [
      { _id: 'c1', name: 'Computers', slug: 'computers' },
      { _id: 'c2', name: 'Electronics', slug: 'electronics' },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { data: { categories: mockCats } },
    });

    const categories = await getCategories();
    expect(getSpy).toHaveBeenCalledWith('/categories?sort=name');
    expect(categories).toHaveLength(2);
  });

  it('should fetch category by slug', async () => {
    const mockCat = { _id: 'c1', name: 'Electronics', slug: 'electronics' };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { data: { category: mockCat } },
    });

    const category = await getCategoryBySlug('electronics');
    expect(getSpy).toHaveBeenCalledWith('/categories/slug/electronics');
    expect(category.name).toBe('Electronics');
  });
});
