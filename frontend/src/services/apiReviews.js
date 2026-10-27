import apiClient from './apiClient';

/**
 * Reviews API Service Layer
 * Interfaces with Express backend /api/v1/products/:productId/reviews and /api/v1/reviews
 */

/**
 * Fetch reviews for a specific product
 *
 * @param {string} productId - MongoDB ObjectId of the product
 * @param {Object} [params] - Query parameters (page, limit, sort, rating)
 * @returns {Promise<{ reviews: Array<Object>, results: number, total: number }>}
 */
export async function getProductReviewsApi(productId, params = {}) {
  const response = await apiClient.get(`/products/${productId}/reviews`, { params });
  return {
    reviews: response.data?.data?.reviews || [],
    results: response.data?.results || 0,
    total: response.data?.total || 0,
  };
}

/**
 * Fetch star rating distribution breakdown statistics for a product
 *
 * @param {string} productId - MongoDB ObjectId of the product
 * @returns {Promise<{ totalReviews: number, distribution: Object, percentages: Object }>}
 */
export async function getProductReviewStatsApi(productId) {
  const response = await apiClient.get(`/products/${productId}/reviews/stats`);
  return response.data?.data || { totalReviews: 0, distribution: {}, percentages: {} };
}

/**
 * Submit a customer review for a product (verified buyers only)
 *
 * @param {string} productId - MongoDB ObjectId of the product
 * @param {Object} reviewData - { rating, title, review }
 * @returns {Promise<Object>} Created review document
 */
export async function createProductReviewApi(productId, reviewData) {
  const response = await apiClient.post(`/products/${productId}/reviews`, reviewData);
  return response.data?.data?.data || response.data?.data?.review;
}

/**
 * Cast or retract a helpful vote on a review
 *
 * @param {string} reviewId - MongoDB ObjectId of the review
 * @returns {Promise<{ review: Object, helpfulVotes: number, hasVoted: boolean }>}
 */
export async function voteHelpfulReviewApi(reviewId) {
  const response = await apiClient.post(`/reviews/${reviewId}/vote`);
  return response.data?.data;
}

/**
 * Delete a review (author or admin)
 *
 * @param {string} reviewId - MongoDB ObjectId of the review
 * @returns {Promise<void>}
 */
export async function deleteReviewApi(reviewId) {
  await apiClient.delete(`/reviews/${reviewId}`);
}
