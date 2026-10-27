import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { voteHelpfulReviewApi } from '../../../services/apiReviews';

/**
 * Custom React Query Hook for voting helpful on a review
 *
 * @param {string} productId - MongoDB ObjectId of the product
 */
export function useVoteHelpful(productId) {
  const queryClient = useQueryClient();

  const {
    mutate: voteHelpful,
    isPending: isVoting,
  } = useMutation({
    mutationFn: (reviewId) => voteHelpfulReviewApi(reviewId),
    onSuccess: (data) => {
      if (data?.hasVoted) {
        toast.success('Thank you for your feedback!');
      } else {
        toast('Helpful vote retracted', { icon: 'ℹ️' });
      }
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || 'Unable to register your vote. Please try again.';
      toast.error(message);
    },
  });

  return {
    voteHelpful,
    isVoting,
  };
}
