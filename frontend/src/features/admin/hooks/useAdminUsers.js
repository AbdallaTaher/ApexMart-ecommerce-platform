import { useQuery } from '@tanstack/react-query';
import { getAdminUsers } from '../../../services/apiAdmin';

export function useAdminUsers(params = {}) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['adminUsers', params],
    queryFn: () => getAdminUsers(params),
    keepPreviousData: true,
    staleTime: 30 * 1000,
  });

  return {
    users: data?.users || [],
    totalCount: data?.totalCount || 0,
    results: data?.results || 0,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  };
}
