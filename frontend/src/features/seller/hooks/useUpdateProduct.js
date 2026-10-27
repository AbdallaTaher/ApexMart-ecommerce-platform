import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateSellerProduct } from '../../../services/apiSeller';

/**
 * Custom React Query hook for updating an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  const { mutate: updateProduct, isPending: isUpdating } = useMutation({
    mutationFn: updateSellerProduct,
    onSuccess: (updatedProduct) => {
      toast.success(`"${updatedProduct?.name || 'Product'}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      const message =
        err.response?.data?.message || err.message || 'Failed to update product';
      toast.error(message);
    },
  });

  return { updateProduct, isUpdating };
}
