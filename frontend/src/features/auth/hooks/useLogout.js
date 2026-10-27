import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logoutApi } from '../../../services/apiAuth';

/**
 * Custom React Query hook for logging out and revoking session
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: logout, isPending } = useMutation({
    mutationFn: logoutApi,
    onMutate: () => {
      // Clear session hint and seed user cache with null immediately upon initiating sign-out
      localStorage.removeItem('apex_auth_hint');
      queryClient.setQueryData(['user'], null);
    },
    onSuccess: () => {
      // Ensure session hint and user cache are clean
      localStorage.removeItem('apex_auth_hint');
      queryClient.setQueryData(['user'], null);

      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    },
    onError: (err) => {
      const message =
        err.response?.data?.message || err.message || 'Logout failed. Please try again.';
      toast.error(message);
    },
  });

  return { logout, isPending };
}
