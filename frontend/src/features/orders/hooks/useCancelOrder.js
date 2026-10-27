import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateOrderStatusApi } from '../../../services/apiOrders';

/**
 * Custom React Query mutation hook for customer order cancellation
 *
 * @returns {Object} { cancelOrder, isCancelling }
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  const { mutate: cancelOrder, isPending: isCancelling } = useMutation({
    mutationFn: ({ orderId, cancellationReason }) =>
      updateOrderStatusApi(orderId, {
        orderStatus: 'cancelled',
        cancellationReason: cancellationReason || 'Cancelled by customer',
      }),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', updatedOrder?._id] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock was restored
      toast.success('Order has been successfully cancelled. Stock restored.', {
        icon: '🛑',
      });
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Could not cancel this order. Please contact customer support.';
      toast.error(msg);
    },
  });

  return {
    cancelOrder,
    isCancelling,
  };
}
