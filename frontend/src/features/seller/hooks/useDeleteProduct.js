import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteSellerProduct } from '../../../services/apiSeller';

/**
 * Custom React Query hook for deleting a product from seller's store
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: deleteSellerProduct,
    onSuccess: () => {
      toast.success('Product removed from inventory');
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      const message =
        err.response?.data?.message || err.message || 'Failed to delete product';
      toast.error(message);
    },
  });

  return { deleteProduct, isDeleting };
}
