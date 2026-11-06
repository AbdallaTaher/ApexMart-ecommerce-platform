import { useState, useEffect } from 'react';
import { HiMagnifyingGlass, HiArrowPath } from 'react-icons/hi2';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';

/**
 * Responsive Product Grid with Loading Skeletons and Empty State Handling
 *
 * @param {Object} props
 * @param {Array} props.products - List of product documents
 * @param {boolean} props.isLoading - Whether initial query is loading
 * @param {boolean} props.isFetching - Whether background refetch/filtering is underway
 * @param {Function} [props.onClearFilters] - Callback to clear active filters when empty
 */
export default function ProductGrid({
  products = [],
  isLoading = false,
  isFetching = false,
  onClearFilters,
}) {
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => setShowSlowNotice(true), 2500);
    } else {
      setShowSlowNotice(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showSlowNotice && (
          <div className="py-2.5 px-4 rounded-lg bg-amber-500/10 border border-brand-amber/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-brand-amber animate-ping" />
            <span>Connecting to live cloud server... Initial spin-up may take ~20-30s on first load.</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-white dark:bg-brand-darkcard rounded-xl border border-gray-200/90 dark:border-brand-darkborder p-12 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-brand-amber mx-auto flex items-center justify-center">
          <HiMagnifyingGlass className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
            No matching products found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            We couldn't find any products matching your current filters or search query. Try broadening your keywords or resetting filters.
          </p>
        </div>
        {onClearFilters && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-amber hover:bg-brand-hover text-slate-950 font-bold text-xs transition shadow-sm"
            >
              <HiArrowPath className="w-4 h-4" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Subtle Instant Loading Indicator Bar while refetching/sorting */}
      {isFetching && (
        <div className="absolute -top-3 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden z-20">
          <div className="h-full bg-brand-amber animate-pulse w-full" />
        </div>
      )}

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-opacity duration-200 ${
          isFetching ? 'opacity-65' : 'opacity-100'
        }`}
      >
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
