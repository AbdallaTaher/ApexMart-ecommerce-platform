import { useQuery } from '@tanstack/react-query';
import { getPlatformAnalytics } from '../../../services/apiAdmin';

export function usePlatformAnalytics() {
  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: getPlatformAnalytics,
    staleTime: 60 * 1000, // 1 minute fresh cache
  });

  return {
    analytics,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  };
}
