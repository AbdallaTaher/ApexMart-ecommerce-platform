import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { signupApi } from '../../../services/apiAuth';

/**
 * Custom React Query hook for user registration
 */
export function useSignup() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: signup, isPending } = useMutation({
    mutationFn: (userData) => signupApi(userData),
    onSuccess: (user) => {
      // Set session hint and seed user query cache
      localStorage.setItem('apex_auth_hint', 'true');
      queryClient.setQueryData(['user'], user);

      toast.success('Account created successfully! Welcome to ApexMart.');
      navigate('/', { replace: true });
    },
    onError: (err) => {
      const message =
        err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast.error(message);
    },
  });

  return { signup, isPending };
}
