import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPasswordApi } from '../../../services/apiAuth';

export function useResetPassword() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: resetPassword, isPending: isResetting } = useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: (user) => {
      localStorage.setItem('apex_auth_hint', 'true');
      queryClient.setQueryData(['user'], user);
      toast.success('Password successfully reset! You are now logged in.');
      navigate('/', { replace: true });
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message ||
        'Password reset link is invalid or has expired. Please request a new one.';
      toast.error(errorMessage);
    },
  });

  return { resetPassword, isResetting };
}
