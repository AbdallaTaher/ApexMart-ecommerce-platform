import { useQuery } from '@tanstack/react-query';
import { getProductBySlug, getProductById } from '../../../services/apiProducts';

/**
 * Custom React Query Hook for Single Product Retrieval
 * Supports lookups by either URL-friendly slug or MongoDB ObjectId with 5-min caching.
 *
 * @param {string} slugOrId - Product slug or ObjectId
 * @returns {{ product: Object, isLoading: boolean, isError: boolean, error: Error }}
 */
export function useProduct(slugOrId) {
  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product', slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null;

      // Detect if the param is a MongoDB ObjectId (24 hex characters)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);

      try {
        if (isObjectId) {
          return await getProductById(slugOrId);
        }
        return await getProductBySlug(slugOrId);
      } catch (err) {
        // Fallback: If slug query failed, try ID query just in case
        if (!isObjectId && err?.response?.status === 404) {
          return await getProductById(slugOrId);
        }
        throw err;
      }
    },
    enabled: Boolean(slugOrId),
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
    retry: 1,
  });

  return {
    product,
    isLoading,
    isError,
    error,
    refetch,
  };
}
