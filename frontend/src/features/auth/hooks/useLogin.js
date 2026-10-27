import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginApi } from '../../../services/apiAuth';

/**
 * Custom React Query hook for user authentication
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const { mutate: login, isPending } = useMutation({
    mutationFn: ({ email, password }) => loginApi({ email, password }),
    onSuccess: (user) => {
      // Set session hint and seed user query cache
      localStorage.setItem('apex_auth_hint', 'true');
      queryClient.setQueryData(['user'], user);

      toast.success(`Welcome back, ${user.name}!`);

      // Redirect user to destination route if redirected from ProtectedRoute, else home
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    },
    onError: (err) => {
      const message =
        err.response?.data?.message || err.message || 'Incorrect email or password';
      toast.error(message);
    },
  });

  return { login, isPending };
}
