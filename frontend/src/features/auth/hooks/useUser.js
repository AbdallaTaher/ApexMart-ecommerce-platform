import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserApi } from '../../../services/apiAuth';

/**
 * Custom React Query hook for loading current user session
 */
export function useUser() {
  const { isLoading, data: user, isFetching } = useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUserApi,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: false, // Do not endlessly retry on unauthenticated state
  });

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        localStorage.setItem('apex_auth_hint', 'true');
      } else {
        localStorage.removeItem('apex_auth_hint');
      }
    }
  }, [user, isLoading]);

  return {
    isLoading,
    isFetching,
    user,
    isAuthenticated: Boolean(user),
    role: user?.role || null,
  };
}
