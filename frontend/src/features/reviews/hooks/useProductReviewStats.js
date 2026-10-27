import { useQuery } from '@tanstack/react-query';
import { getProductReviewStatsApi } from '../../../services/apiReviews';

/**
 * Custom React Query Hook to retrieve ratings distribution and percentage breakdown
 *
 * @param {string} productId - MongoDB ObjectId of the product
 */
export function useProductReviewStats(productId) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reviewStats', productId],
    queryFn: () => getProductReviewStatsApi(productId),
    enabled: Boolean(productId),
    staleTime: 60 * 1000,
  });

  return {
    stats: data || { totalReviews: 0, distribution: {}, percentages: {} },
    totalReviews: data?.totalReviews || 0,
    distribution: data?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    percentages: data?.percentages || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isLoading,
    isError,
    error,
    refetch,
  };
}
