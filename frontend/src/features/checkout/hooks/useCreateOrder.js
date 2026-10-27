import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createOrderApi } from '../../../services/apiOrders';

/**
 * Custom React Query mutation hook for transactional order placement
 *
 * @returns {Object} { createOrder, isCreating, error }
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  const {
    mutate: createOrder,
    mutateAsync: createOrderAsync,
    isPending: isCreating,
    error,
  } = useMutation({
    mutationFn: ({ orderData, idempotencyKey }) =>
      createOrderApi(orderData, idempotencyKey),
    onSuccess: (data) => {
      // Invalidate relevant caches to reflect new inventory & order status
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      if (data?.order?._id) {
        queryClient.setQueryData(['order', data.order._id], data.order);
      }
    },
    onError: (err) => {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to process order. Please try again.';
      toast.error(message, { id: 'order-creation-error' });
    },
  });

  return {
    createOrder,
    createOrderAsync,
    isCreating,
    error,
  };
}
