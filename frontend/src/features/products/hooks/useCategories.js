import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../../services/apiProducts';

/**
 * Custom React Query hook to fetch product categories
 */
export function useCategories() {
  const { data: categories, isLoading, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  return {
    categories: categories || [],
    isLoading,
    isError,
    error,
  };
}
