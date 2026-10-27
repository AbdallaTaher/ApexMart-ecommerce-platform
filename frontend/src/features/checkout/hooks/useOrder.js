import { useQuery } from '@tanstack/react-query';
import { getOrderApi } from '../../../services/apiOrders';

/**
 * Custom React Query hook to fetch a specific order by ID
 *
 * @param {string} orderId - MongoDB ObjectId
 * @returns {Object} { order, isLoading, error }
 */
export function useOrder(orderId) {
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderApi(orderId),
    enabled: Boolean(orderId),
    retry: 1,
    staleTime: 60 * 1000,
  });

  return {
    order,
    isLoading,
    error,
  };
}
