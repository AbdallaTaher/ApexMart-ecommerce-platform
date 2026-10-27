import { useQuery } from '@tanstack/react-query';
import { getProductReviewsApi } from '../../../services/apiReviews';

/**
 * Custom React Query Hook to retrieve customer reviews for a product
 * Supports pagination, sorting (e.g. -createdAt, -rating, -helpfulVotes), and star filtering
 *
 * @param {string} productId - MongoDB ObjectId of the product
 * @param {Object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @param {string} [options.sort='-createdAt']
 * @param {number} [options.rating]
 */
export function useProductReviews(
  productId,
  { page = 1, limit = 10, sort = '-createdAt', rating } = {}
) {
  const queryParams = { page, limit, sort };
  if (rating) {
    queryParams.rating = rating;
  }

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reviews', productId, page, limit, sort, rating || 'all'],
    queryFn: () => getProductReviewsApi(productId, queryParams),
    enabled: Boolean(productId),
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    reviews: data?.reviews || [],
    total: data?.total || 0,
    results: data?.results || 0,
    isLoading,
    isError,
    error,
    refetch,
  };
}
