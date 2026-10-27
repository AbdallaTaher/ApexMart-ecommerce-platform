import { useQuery } from '@tanstack/react-query';
import { getAuditStats } from '../../../services/apiAdmin';

export function useAuditStats() {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['adminAuditStats'],
    queryFn: getAuditStats,
    staleTime: 60 * 1000,
  });

  return {
    stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  };
}
