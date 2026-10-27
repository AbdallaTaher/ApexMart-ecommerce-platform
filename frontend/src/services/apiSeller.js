import apiClient from './apiClient';

/**
 * Fetch seller analytics, KPIs, sales trajectory, and inventory health metrics
 * @returns {Promise<Object>}
 */
export async function getSellerAnalytics() {
  const response = await apiClient.get('/seller/analytics');
  return response.data?.data || {};
}

/**
 * Fetch seller's own products with pagination, search, sorting, and filters
 * @param {Object} [params={}]
 * @returns {Promise<Object>}
 */
export async function getSellerProducts(params = {}) {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const url = queryString ? `/seller/products?${queryString}` : '/seller/products';

  const response = await apiClient.get(url);
  return {
    products: response.data?.data?.products || response.data?.data?.data || [],
    total: response.data?.total || 0,
    totalPages: response.data?.totalPages || 1,
    currentPage: response.data?.currentPage || 1,
    results: response.data?.results || 0,
  };
}

/**
 * Fetch a single product by ID belonging to the seller
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getSellerProduct(id) {
  const response = await apiClient.get(`/seller/products/${id}`);
  return response.data?.data?.product || response.data?.data?.data || null;
}

/**
 * Create a new product for the authenticated seller's store
 * @param {Object} productData
 * @returns {Promise<Object>}
 */
export async function createSellerProduct(productData) {
  const response = await apiClient.post('/seller/products', productData);
  return response.data?.data?.product || response.data?.data?.data;
}

/**
 * Update an existing product owned by the seller
 * @param {Object} payload
 * @param {string} payload.id
 * @param {Object} payload.productData
 * @returns {Promise<Object>}
 */
export async function updateSellerProduct({ id, productData }) {
  const response = await apiClient.patch(`/seller/products/${id}`, productData);
  return response.data?.data?.product || response.data?.data?.data;
}

/**
 * Delete a product owned by the seller
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteSellerProduct(id) {
  await apiClient.delete(`/seller/products/${id}`);
}
