import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createProductReviewApi } from '../../../services/apiReviews';

/**
 * Custom React Query Hook for submitting a new customer review
 * Automatically invalidates review lists, stats, and parent product ratings.
 *
 * @param {string} productId - MongoDB ObjectId of the product
 * @param {Function} [onSuccessCallback] - Callback executed upon successful creation
 */
export function useCreateReview(productId, onSuccessCallback) {
  const queryClient = useQueryClient();

  const {
    mutate: submitReview,
    isPending: isSubmitting,
    isError,
    error,
  } = useMutation({
    mutationFn: (reviewData) => createProductReviewApi(productId, reviewData),
    onSuccess: () => {
      toast.success('Your customer review has been posted! Thank you.');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['reviewStats', productId] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message ||
        'Failed to submit your review. Please try again.';
      toast.error(message);
    },
  });

  return {
    submitReview,
    isSubmitting,
    isError,
    error,
  };
}
