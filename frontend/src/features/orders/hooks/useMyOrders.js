import { useQuery } from '@tanstack/react-query';
import { getMyOrdersApi } from '../../../services/apiOrders';

/**
 * Custom React Query hook to fetch user's order history
 *
 * @param {Object} [filters] - Optional filter params (orderStatus, sort, page)
 * @returns {Object} { orders, isLoading, isError, error, refetch }
 */
export function useMyOrders(filters = {}) {
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-orders', filters],
    queryFn: () => getMyOrdersApi(filters),
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    orders,
    isLoading,
    isError,
    error,
    refetch,
  };
}
