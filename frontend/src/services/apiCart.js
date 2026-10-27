import apiClient from './apiClient';

/**
 * Cart API Service Layer
 * Interfaces with Express backend /api/v1/cart endpoints
 */

/**
 * Synchronize client cart items with the server
 * Supports both anonymous guests and authenticated users.
 *
 * @param {Array<Object>} items - Array of { product: string, quantity: number }
 * @param {'merge'|'replace'} action - Merging strategy
 * @returns {Promise<Object>} Verified cart with authoritative pricing and summary
 */
export async function syncCartApi(items = [], action = 'merge') {
  const response = await apiClient.post('/cart/sync', { items, action });
  return response.data?.data?.cart;
}

/**
 * Fetch authenticated user's persisted cart from the server
 *
 * @returns {Promise<Object>} Verified cart
 */
export async function getCartApi() {
  const response = await apiClient.get('/cart');
  return response.data?.data?.cart;
}

/**
 * Add or increment an item in the user's cart
 *
 * @param {string} productId - Product ObjectId
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} Updated cart
 */
export async function addToCartApi(productId, quantity = 1) {
  const response = await apiClient.post('/cart/items', { productId, quantity });
  return response.data?.data?.cart;
}

/**
 * Update quantity of a specific item in the cart
 *
 * @param {string} productId - Product ObjectId
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>} Updated cart
 */
export async function updateCartItemApi(productId, quantity) {
  const response = await apiClient.patch(`/cart/items/${productId}`, { quantity });
  return response.data?.data?.cart;
}

/**
 * Remove an item from the cart
 *
 * @param {string} productId - Product ObjectId
 * @returns {Promise<Object>} Updated cart
 */
export async function removeFromCartApi(productId) {
  const response = await apiClient.delete(`/cart/items/${productId}`);
  return response.data?.data?.cart;
}

/**
 * Clear all items from the cart
 *
 * @returns {Promise<Object>} Empty cart
 */
export async function clearCartApi() {
  const response = await apiClient.delete('/cart');
  return response.data?.data?.cart;
}
