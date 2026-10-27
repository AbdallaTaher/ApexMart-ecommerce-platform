import { useQuery } from '@tanstack/react-query';
import { getTopDeals } from '../../../services/apiProducts';

/**
 * Custom React Query hook for Today's Top Deals Feed
 * @param {number} limit
 */
export function useTopDeals(limit = 10) {
  const { data: deals, isLoading, isError, error } = useQuery({
    queryKey: ['top-deals', limit],
    queryFn: () => getTopDeals(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes fresh cache
  });

  return {
    deals: deals || [],
    isLoading,
    isError,
    error,
  };
}
