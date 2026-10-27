import { useQuery } from '@tanstack/react-query';
import { getSellerAnalytics } from '../../../services/apiSeller';

/**
 * Custom React Query hook for fetching seller analytics dashboard data
 */
export function useSellerAnalytics() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seller-analytics'],
    queryFn: getSellerAnalytics,
    staleTime: 60 * 1000, // 1 minute fresh cache
  });

  return {
    analytics: data || {
      metrics: {
        totalRevenue: 0,
        totalUnitsSold: 0,
        totalOrders: 0,
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        averageRating: 0,
        totalReviews: 0,
      },
      salesTrajectory: [],
      topProducts: [],
      recentOrders: [],
    },
    isLoading,
    isError,
    error,
    refetch,
  };
}
