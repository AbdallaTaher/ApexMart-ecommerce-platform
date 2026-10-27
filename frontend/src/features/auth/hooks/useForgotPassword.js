import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { forgotPasswordApi } from '../../../services/apiAuth';

export function useForgotPassword() {
  const { mutate: forgotPassword, isPending: isSending } = useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: (data) => {
      toast.success(
        data?.message || 'Password reset instructions have been sent to your email.'
      );
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message ||
        'Failed to process password reset request. Please check your email and try again.';
      toast.error(errorMessage);
    },
  });

  return { forgotPassword, isSending };
}
