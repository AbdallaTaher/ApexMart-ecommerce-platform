import { useQuery } from '@tanstack/react-query';
import { getTopDeals } from '../../../services/apiProducts';

const CACHE_KEY = 'apexmart_top_deals_cache';

// Curated seed deals matching database catalog to guarantee instant 0ms render during cold start
const FALLBACK_INITIAL_DEALS = [
  {
    _id: 'seed-deal-sonicwave',
    name: 'SonicWave Wireless Noise-Canceling Headphones',
    slug: 'sonicwave-wireless-noise-canceling-headphones',
    description:
      'Industry-leading active noise cancellation with 40mm beryllium drivers, spatial audio tracking, ultra-soft memory foam earcups, and up to 45 hours playtime.',
    price: 349,
    priceDiscount: 279,
    effectivePrice: 279,
    imageCover:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
    dealDiscountPercentage: 20,
    ratingsAverage: 4.8,
    ratingsQuantity: 1250,
    badge: "Amazon's Choice",
    stock: 82,
    isDeal: true,
  },
  {
    _id: 'seed-deal-apex-pro',
    name: 'Apex Pro 16" M3 Max Ultra Laptop',
    slug: 'apex-pro-16-m3-max-ultra-laptop',
    description:
      'Engineered for ultimate computing velocity. Features 16-core CPU, 40-core GPU, Liquid Retina XDR display with ProMotion 120Hz.',
    price: 2499,
    priceDiscount: 2299,
    effectivePrice: 2299,
    imageCover:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
    dealDiscountPercentage: 8,
    ratingsAverage: 4.9,
    ratingsQuantity: 418,
    badge: 'Best Seller',
    stock: 35,
    isDeal: true,
  },
  {
    _id: 'seed-deal-lumix',
    name: 'Lumix Pulse OLED 65" 4K Gaming Smart TV',
    slug: 'lumix-pulse-oled-65-4k-gaming-smart-tv',
    description:
      'Self-lit OLED pixels deliver pure black and infinity contrast. 144Hz refresh rate, HDMI 2.1, VRR, AMD FreeSync Premium.',
    price: 1799,
    priceDiscount: 1499,
    effectivePrice: 1499,
    imageCover:
      'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1000&q=80',
    dealDiscountPercentage: 17,
    ratingsAverage: 4.9,
    ratingsQuantity: 312,
    badge: 'Limited Deal',
    stock: 20,
    isDeal: true,
  },
  {
    _id: 'seed-deal-hydroshield',
    name: 'HydroShield All-Weather Arctic Parka',
    slug: 'hydroshield-all-weather-arctic-parka',
    description:
      'Triple-layer Gore-Tex waterproof membrane insulated with 800-fill certified goose down for sub-zero climate protection.',
    price: 380,
    priceDiscount: 299,
    effectivePrice: 299,
    imageCover:
      'https://images.unsplash.com/photo-1539533018447-63fcce667823?auto=format&fit=crop&w=1000&q=80',
    dealDiscountPercentage: 21,
    ratingsAverage: 4.7,
    ratingsQuantity: 189,
    badge: 'Best Seller',
    stock: 55,
    isDeal: true,
  },
  {
    _id: 'seed-deal-barista',
    name: 'BaristaTouch Thermal Espresso Machine',
    slug: 'baristatouch-thermal-espresso-machine',
    description:
      'Commercial 15-bar Italian pump with digital PID temperature stabilization, thermo-block heating, and manual microfoam steam wand.',
    price: 799,
    priceDiscount: 649,
    effectivePrice: 649,
    imageCover:
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=1000&q=80',
    dealDiscountPercentage: 19,
    ratingsAverage: 4.8,
    ratingsQuantity: 524,
    badge: "Amazon's Choice",
    stock: 40,
    isDeal: true,
  },
];

function getStoredDeals() {
  if (typeof window === 'undefined') return FALLBACK_INITIAL_DEALS;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    // Gracefully ignore local storage errors
  }
  return FALLBACK_INITIAL_DEALS;
}

/**
 * Custom React Query hook for Today's Top Deals Feed
 * Uses Stale-While-Revalidate with localStorage persistence to render in 0ms,
 * eliminating the 30-second cold start on free-tier cloud platforms.
 *
 * @param {number} limit
 */
export function useTopDeals(limit = 10) {
  const { data: deals, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['top-deals', limit],
    queryFn: async () => {
      const liveDeals = await getTopDeals(limit);
      if (liveDeals && liveDeals.length > 0 && typeof window !== 'undefined') {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(liveDeals));
        } catch (err) {
          // Ignore storage quotas
        }
      }
      return liveDeals;
    },
    initialData: getStoredDeals,
    staleTime: 5 * 60 * 1000, // 5 minutes fresh cache
  });

  return {
    deals: deals || [],
    isLoading: !deals || deals.length === 0 ? isLoading : false,
    isFetching,
    isError,
    error,
  };
}
