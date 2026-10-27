import apiClient from './apiClient';

/**
 * Product & Catalog API Service Layer
 * Interfaces with backend Express API endpoints: /api/v1/products and /api/v1/categories
 */

/**
 * Fetch paginated, filtered, and sorted product catalog
 * @param {Object} params - Query parameters (page, limit, sort, search, category, isDeal, price, ratingsAverage)
 * @returns {Promise<{ products: Array, total: number, totalPages: number, currentPage: number, results: number }>}
 */
export async function getProducts(params = {}) {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });

  const response = await apiClient.get(`/products?${queryParams.toString()}`);
  return {
    products: response.data?.data?.products || response.data?.data?.data || [],
    total: response.data?.total || 0,
    totalPages: response.data?.totalPages || 1,
    currentPage: response.data?.currentPage || 1,
    results: response.data?.results || 0,
  };
}

/**
 * Fetch Top Deals feed (aliasTopDeals backend route)
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getTopDeals(limit = 10) {
  const response = await apiClient.get(`/products/top-deals?limit=${limit}`);
  return response.data?.data?.products || response.data?.data?.data || [];
}

/**
 * Fetch Featured Products feed (aliasFeaturedProducts backend route)
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getFeaturedProducts(limit = 8) {
  const response = await apiClient.get(`/products/featured?limit=${limit}`);
  return response.data?.data?.products || response.data?.data?.data || [];
}

/**
 * Fetch a single product by its URL-friendly slug
 * @param {string} slug
 * @returns {Promise<Object>}
 */
export async function getProductBySlug(slug) {
  const response = await apiClient.get(`/products/slug/${slug}`);
  return response.data?.data?.product || response.data?.data?.data;
}

/**
 * Fetch a single product by its MongoDB ObjectID
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getProductById(id) {
  const response = await apiClient.get(`/products/${id}`);
  return response.data?.data?.product || response.data?.data?.data;
}

/**
 * Fetch all categories with product counts and slugs
 * @returns {Promise<Array>}
 */
export async function getCategories() {
  const response = await apiClient.get('/categories?sort=name');
  return response.data?.data?.categories || response.data?.data?.data || [];
}

/**
 * Fetch a category by its slug
 * @param {string} slug
 * @returns {Promise<Object>}
 */
export async function getCategoryBySlug(slug) {
  const response = await apiClient.get(`/categories/slug/${slug}`);
  return response.data?.data?.category || response.data?.data?.data;
}
