import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../../services/apiProducts';

const CACHE_KEY = 'apexmart_categories_cache';

const FALLBACK_CATEGORIES = [
  { _id: 'cat-electronics', name: 'Electronics', slug: 'electronics', icon: 'laptop' },
  { _id: 'cat-fashion', name: 'Fashion & Apparel', slug: 'fashion-and-apparel', icon: 'shirt' },
  { _id: 'cat-home', name: 'Home & Kitchen', slug: 'home-and-kitchen', icon: 'home' },
  { _id: 'cat-beauty', name: 'Beauty & Personal Care', slug: 'beauty-and-personal-care', icon: 'sparkles' },
  { _id: 'cat-sports', name: 'Sports & Outdoors', slug: 'sports-and-outdoors', icon: 'activity' },
  { _id: 'cat-books', name: 'Books & Media', slug: 'books-and-media', icon: 'book' },
];

function getStoredCategories() {
  if (typeof window === 'undefined') return FALLBACK_CATEGORIES;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {}
  return FALLBACK_CATEGORIES;
}

/**
 * Custom React Query hook to fetch product categories
 * Pre-hydrated with localStorage and fallback categories for 0ms initial render.
 */
export function useCategories() {
  const { data: categories, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await getCategories();
      if (data && data.length > 0 && typeof window !== 'undefined') {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (err) {}
      }
      return data;
    },
    initialData: getStoredCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  return {
    categories: categories || [],
    isLoading: !categories || categories.length === 0 ? isLoading : false,
    isFetching,
    isError,
    error,
  };
}
