import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiChevronLeft, HiChevronRight, HiFire, HiSparkles } from 'react-icons/hi2';
import { useTopDeals } from '../hooks/useTopDeals';

/**
 * Amazon-like Today's Top Deals Horizontal Carousel / Scroller
 * Uses native smooth scroll with touch swipe and button navigation.
 *
 * @param {Object} props
 * @param {string} [props.title="Today's Top Prime Deals"]
 * @param {string} [props.subtitle="Exclusive limited-time savings across top brands"]
 */
export default function DealsScroller({
  title = "Today's Top Prime Deals",
  subtitle = 'Exclusive limited-time savings across top brands',
}) {
  const { deals, isLoading, isError } = useTopDeals(10);
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isError || (!isLoading && (!deals || deals.length === 0))) {
    return null; // Gracefully hide deals scroller if no active deals
  }

  return (
    <section className="bg-white dark:bg-brand-darkcard rounded-xl border border-gray-200/90 dark:border-brand-darkborder p-5 shadow-sm relative space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-red-600/10 text-red-600 dark:text-red-400">
              <HiFire className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold font-display text-gray-950 dark:text-white">
              {title}
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-amber/15 text-brand-hover text-[10px] font-black uppercase">
              <HiSparkles className="w-3 h-3" /> Limited Time
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/catalog?isDeal=true"
            className="text-xs font-bold text-brand-hover hover:underline"
          >
            See all deals &rarr;
          </Link>

          {/* Scroller Arrows */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition shadow-sm"
            >
              <HiChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition shadow-sm"
            >
              <HiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scroller Track */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isLoading
          ? [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-48 sm:w-56 p-3 rounded-lg border border-gray-200 dark:border-brand-darkborder space-y-3 animate-pulse"
              >
                <div className="w-full aspect-square bg-gray-200 dark:bg-gray-800 rounded-md" />
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            ))
          : deals.map((product) => {
              const currentPrice =
                product.priceDiscount > 0
                  ? product.priceDiscount
                  : product.dealDiscountPercentage > 0
                  ? Math.round(product.price * (1 - product.dealDiscountPercentage / 100))
                  : product.price;

              return (
                <Link
                  key={product._id}
                  to={`/product/${product.slug || product._id}`}
                  className="flex-shrink-0 w-48 sm:w-56 p-3 rounded-lg border border-gray-200/90 dark:border-brand-darkborder hover:border-brand-amber dark:hover:border-brand-amber transition-all group flex flex-col justify-between snap-start bg-gray-50/40 dark:bg-brand-darkcard/50"
                >
                  <div className="space-y-2">
                    <div className="w-full aspect-square bg-white dark:bg-gray-800 rounded-md p-2 flex items-center justify-center overflow-hidden relative">
                      <img
                        src={product.imageCover}
                        alt={product.name}
                        width="200"
                        height="200"
                        loading="lazy"
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.dealDiscountPercentage > 0 && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow">
                          {product.dealDiscountPercentage}% OFF
                        </span>
                      )}
                    </div>

                    <div className="pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-red-600 dark:text-red-400 font-display">
                          ${currentPrice?.toFixed(2)}
                        </span>
                        {product.price > currentPrice && (
                          <span className="text-[11px] text-gray-400 line-through">
                            ${product.price?.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-brand-hover transition mt-1">
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-brand-hover inline-block pt-2">
                    View Deal &rarr;
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
