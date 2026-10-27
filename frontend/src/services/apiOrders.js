import apiClient from './apiClient';

/**
 * Orders API Service Layer
 * Interfaces with Express backend /api/v1/orders endpoints
 */

/**
 * Create a new order with ACID stock deduction and Stripe PaymentIntent
 *
 * @param {Object} orderData - Order payload (orderItems, shippingAddress, deliverySpeed, paymentMethod)
 * @param {string} [idempotencyKey] - Unique UUID to prevent double-charging or duplicate orders
 * @returns {Promise<{ order: Object, clientSecret: string|null, isIdempotentReplay?: boolean }>}
 */
export async function createOrderApi(orderData, idempotencyKey) {
  const headers = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const response = await apiClient.post('/orders', orderData, { headers });
  return {
    order: response.data?.data?.order,
    clientSecret: response.data?.data?.clientSecret || null,
    isIdempotentReplay: Boolean(response.data?.isIdempotentReplay),
  };
}

/**
 * Fetch a specific order by ID (with IDOR protection)
 *
 * @param {string} orderId - MongoDB ObjectId of the order
 * @returns {Promise<Object>} Order document
 */
export async function getOrderApi(orderId) {
  const response = await apiClient.get(`/orders/${orderId}`);
  return response.data?.data?.order;
}

/**
 * Fetch the authenticated user's order history
 *
 * @param {Object} [params] - Optional query parameters (orderStatus, page, limit, sort)
 * @returns {Promise<Array<Object>>} Array of user's orders
 */
export async function getMyOrdersApi(params = {}) {
  const response = await apiClient.get('/orders/my-orders', { params });
  return response.data?.data?.orders || [];
}

/**
 * Update lifecycle status of an order (cancellation by customer, or fulfillment by admin)
 *
 * @param {string} orderId - MongoDB ObjectId of the order
 * @param {Object} statusData - { orderStatus, cancellationReason, trackingNumber, carrier }
 * @returns {Promise<Object>} Updated order document
 */
export async function updateOrderStatusApi(orderId, statusData) {
  const response = await apiClient.patch(`/orders/${orderId}/status`, statusData);
  return response.data?.data?.order;
}

/**
 * Fetch all platform orders (Admin only)
 *
 * @param {Object} [params] - Optional query parameters (orderStatus, page, limit, sort)
 * @returns {Promise<Array<Object>>} Array of platform orders
 */
export async function getAllOrdersApi(params = {}) {
  const response = await apiClient.get('/orders', { params });
  return response.data?.data?.orders || [];
}
