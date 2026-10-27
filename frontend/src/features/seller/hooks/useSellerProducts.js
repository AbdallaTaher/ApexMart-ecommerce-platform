import { useQuery } from '@tanstack/react-query';
import { getSellerProducts } from '../../../services/apiSeller';

/**
 * Custom React Query hook for seller inventory list with search, sort & filters
 * @param {Object} [params={}]
 */
export function useSellerProducts(params = {}) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['seller-products', params],
    queryFn: () => getSellerProducts(params),
    staleTime: 30 * 1000,
  });

  return {
    products: data?.products || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    currentPage: data?.currentPage || 1,
    results: data?.results || 0,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
