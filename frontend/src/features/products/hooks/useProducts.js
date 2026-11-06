import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getProducts } from '../../../services/apiProducts';

const CACHE_KEY_DEFAULT_CATALOG = 'apexmart_catalog_page1_cache';

// Curated seed catalog matching database for instant 0ms first-load render
const FALLBACK_INITIAL_CATALOG = {
  products: [
    {
      _id: 'seed-prod-apex-pro',
      name: 'Apex Pro 16" M3 Max Ultra Laptop',
      slug: 'apex-pro-16-m3-max-ultra-laptop',
      description:
        'Engineered for ultimate computing velocity with 16-core CPU, 40-core GPU, and Liquid Retina XDR display.',
      price: 2499,
      priceDiscount: 2299,
      effectivePrice: 2299,
      imageCover:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
      brand: 'ApexTech',
      category: { name: 'Electronics', slug: 'electronics' },
      ratingsAverage: 4.9,
      ratingsQuantity: 418,
      stock: 35,
      isFeatured: true,
      isDeal: true,
      dealDiscountPercentage: 8,
      badge: 'Best Seller',
    },
    {
      _id: 'seed-prod-sonicwave',
      name: 'SonicWave Wireless Noise-Canceling Headphones',
      slug: 'sonicwave-wireless-noise-canceling-headphones',
      description:
        'Industry-leading active noise cancellation with 40mm beryllium drivers and spatial audio tracking.',
      price: 349,
      priceDiscount: 279,
      effectivePrice: 279,
      imageCover:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
      brand: 'AcoustiQ',
      category: { name: 'Electronics', slug: 'electronics' },
      ratingsAverage: 4.8,
      ratingsQuantity: 1250,
      stock: 82,
      isFeatured: true,
      isDeal: true,
      dealDiscountPercentage: 20,
      badge: "Amazon's Choice",
    },
    {
      _id: 'seed-prod-lumix',
      name: 'Lumix Pulse OLED 65" 4K Gaming Smart TV',
      slug: 'lumix-pulse-oled-65-4k-gaming-smart-tv',
      description:
        'Self-lit OLED pixels deliver pure black and infinity contrast with 144Hz refresh rate.',
      price: 1799,
      priceDiscount: 1499,
      effectivePrice: 1499,
      imageCover:
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80',
      brand: 'Lumix',
      category: { name: 'Electronics', slug: 'electronics' },
      ratingsAverage: 4.7,
      ratingsQuantity: 310,
      stock: 18,
      isFeatured: false,
      isDeal: true,
      dealDiscountPercentage: 16,
      badge: 'Limited Deal',
    },
    {
      _id: 'seed-prod-titan',
      name: 'Titan Smartwatch Pro with GPS & ECG Monitor',
      slug: 'titan-smartwatch-pro-with-gps-ecg-monitor',
      description:
        'Grade 5 titanium case with sapphire crystal glass and dual-frequency precision GPS.',
      price: 499,
      priceDiscount: 0,
      effectivePrice: 499,
      imageCover:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
      brand: 'ApexTech',
      category: { name: 'Electronics', slug: 'electronics' },
      ratingsAverage: 4.6,
      ratingsQuantity: 842,
      stock: 64,
      isFeatured: true,
      isDeal: false,
      badge: 'New Arrival',
    },
    {
      _id: 'seed-prod-trench',
      name: 'Urban Glide Waterproof Merino Trench Coat',
      slug: 'urban-glide-waterproof-merino-trench-coat',
      description:
        'Minimalist Scandinavian silhouette tailored with weather-resistant recycled wool-blend.',
      price: 289,
      priceDiscount: 219,
      effectivePrice: 219,
      imageCover:
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=80',
      brand: 'NordicThread',
      category: { name: 'Fashion & Apparel', slug: 'fashion-and-apparel' },
      ratingsAverage: 4.8,
      ratingsQuantity: 185,
      stock: 45,
      isFeatured: true,
      isDeal: true,
      dealDiscountPercentage: 24,
      badge: 'Best Seller',
    },
    {
      _id: 'seed-prod-sneakers',
      name: 'AeroCloud Zero-Gravity Running Sneakers',
      slug: 'aerocloud-zero-gravity-running-sneakers',
      description:
        'Supercritical nitrogen-infused foam midsole delivers responsive 85% energy return.',
      price: 160,
      priceDiscount: 128,
      effectivePrice: 128,
      imageCover:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
      brand: 'Stratus',
      category: { name: 'Fashion & Apparel', slug: 'fashion-and-apparel' },
      ratingsAverage: 4.7,
      ratingsQuantity: 940,
      stock: 90,
      isFeatured: false,
      isDeal: true,
      dealDiscountPercentage: 20,
      badge: "Amazon's Choice",
    },
  ],
  total: 24,
  totalPages: 2,
  currentPage: 1,
  results: 6,
};

function getStoredCatalog() {
  if (typeof window === 'undefined') return FALLBACK_INITIAL_CATALOG;
  try {
    const raw = localStorage.getItem(CACHE_KEY_DEFAULT_CATALOG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        return parsed;
      }
    }
  } catch (err) {}
  return FALLBACK_INITIAL_CATALOG;
}

/**
 * Custom React Query hook to manage product catalog state
 * Automatically caches queries by parameter signatures and maintains previous data during pagination.
 * Uses localStorage hydration for default page 1 catalog views to eliminate cold start delays.
 *
 * @param {Object} filterParams - Query parameters (page, limit, sort, search, category, isDeal, price, ratingsAverage)
 */
export function useProducts(filterParams = {}) {
  const isDefaultQuery =
    (!filterParams.page || Number(filterParams.page) === 1) &&
    !filterParams.search &&
    !filterParams.category &&
    !filterParams.categorySlug &&
    !filterParams.price &&
    !filterParams.ratingsAverage &&
    (!filterParams.sort || filterParams.sort === '-createdAt');

  const {
    data,
    isLoading,
    isPending,
    isFetching,
    isPlaceholderData,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', filterParams],
    queryFn: async () => {
      const liveData = await getProducts(filterParams);
      if (isDefaultQuery && liveData && liveData.products?.length > 0 && typeof window !== 'undefined') {
        try {
          localStorage.setItem(CACHE_KEY_DEFAULT_CATALOG, JSON.stringify(liveData));
        } catch (err) {}
      }
      return liveData;
    },
    initialData: isDefaultQuery ? getStoredCatalog : undefined,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes fresh cache
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection persistence
  });

  const hasData = Boolean(data?.products && data.products.length > 0);

  return {
    products: data?.products || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    currentPage: data?.currentPage || 1,
    results: data?.results || 0,
    isLoading: hasData ? false : (isLoading || isPending),
    isFetching,
    isPlaceholderData,
    isError,
    error,
    refetch,
  };
}
