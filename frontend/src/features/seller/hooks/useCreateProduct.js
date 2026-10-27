import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createSellerProduct } from '../../../services/apiSeller';

/**
 * Custom React Query hook for creating a product in seller's store
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  const { mutate: createProduct, isPending: isCreating } = useMutation({
    mutationFn: createSellerProduct,
    onSuccess: () => {
      toast.success('Product successfully published to your store!');
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      const message =
        err.response?.data?.message || err.message || 'Failed to create product';
      toast.error(message);
    },
  });

  return { createProduct, isCreating };
}
