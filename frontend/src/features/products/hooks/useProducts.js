import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getProducts } from '../../../services/apiProducts';

/**
 * Custom React Query hook to manage product catalog state
 * Automatically caches queries by parameter signatures and maintains previous data during pagination
 *
 * @param {Object} filterParams - Query parameters (page, limit, sort, search, category, isDeal, price, ratingsAverage)
 */
export function useProducts(filterParams = {}) {
  const {
    data,
    isLoading,
    isPending,
    isFetching,
    isPlaceholderData,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', filterParams],
    queryFn: () => getProducts(filterParams),
    placeholderData: keepPreviousData, // Keeps previous page active while fetching next page (no layout flickers)
    staleTime: 5 * 60 * 1000, // 5 minutes fresh cache
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection persistence
  });

  return {
    products: data?.products || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    currentPage: data?.currentPage || 1,
    results: data?.results || 0,
    isLoading: isLoading || isPending,
    isFetching,
    isPlaceholderData,
    isError,
    error,
    refetch,
  };
}
