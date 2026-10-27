import { useQuery } from '@tanstack/react-query';
import { getFeaturedProducts } from '../../../services/apiProducts';

/**
 * Custom React Query hook for Featured Products Feed
 * @param {number} limit
 */
export function useFeaturedProducts(limit = 8) {
  const { data: featured, isLoading, isError, error } = useQuery({
    queryKey: ['featured-products', limit],
    queryFn: () => getFeaturedProducts(limit),
    staleTime: 5 * 60 * 1000,
  });

  return {
    featured: featured || [],
    isLoading,
    isError,
    error,
  };
}
