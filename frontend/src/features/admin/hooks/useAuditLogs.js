import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../../../services/apiAdmin';

export function useAuditLogs(params = {}) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['adminAuditLogs', params],
    queryFn: () => getAuditLogs(params),
    keepPreviousData: true,
    staleTime: 30 * 1000,
  });

  return {
    auditLogs: data?.auditLogs || [],
    totalCount: data?.totalCount || 0,
    results: data?.results || 0,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  };
}
