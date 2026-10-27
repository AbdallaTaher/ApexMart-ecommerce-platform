import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  HiAdjustmentsHorizontal,
  HiChevronRight,
  HiXMark,
  HiSparkles,
} from 'react-icons/hi2';

import { useProducts } from '../features/products/hooks/useProducts';
import { useCategories } from '../features/products/hooks/useCategories';
import CatalogFilters from '../features/products/components/CatalogFilters';
import ProductGrid from '../features/products/components/ProductGrid';
import Pagination from '../features/products/components/Pagination';
import DealsScroller from '../features/products/components/DealsScroller';

/**
 * ApexMart Master Catalog Discovery Page
 * Fully synchronizes search query, filters, sorting, and pagination with the URL.
 */
export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Extract filter state from URL search params
  const activeFilters = useMemo(() => {
    const params = {};
    for (const [key, value] of searchParams.entries()) {
      if (value && value !== 'undefined' && value !== 'null') params[key] = value;
    }
    // Aliases for compatibility (e.g. deal=true -> isDeal=true, category=electronics -> categorySlug=electronics)
    if (params.deal && !params.isDeal) {
      params.isDeal = params.deal;
      delete params.deal;
    }
    if (params.category && !params.categorySlug && !/^[0-9a-fA-F]{24}$/.test(params.category)) {
      params.categorySlug = params.category
        .toLowerCase()
        .replace(/\s+&\s+/g, '-and-')
        .replace(/\s+/g, '-');
      delete params.category;
    }
    return params;
  }, [searchParams]);

  const currentPage = parseInt(activeFilters.page, 10) || 1;
  const currentSort = activeFilters.sort || '-createdAt';
  const searchTerm = activeFilters.search || '';
  const currentCategorySlug = activeFilters.categorySlug || '';

  // Data fetching via TanStack React Query
  const { categories } = useCategories();
  const {
    products,
    total,
    totalPages,
    results,
    isLoading,
    isFetching,
  } = useProducts({
    ...activeFilters,
    page: currentPage,
    limit: 20,
    sort: currentSort,
  });

  // Selected Category Object
  const selectedCategory = useMemo(() => {
    if (!currentCategorySlug && !activeFilters.category) return null;
    const target = (currentCategorySlug || activeFilters.category || '').toLowerCase();
    const tokens = target
      .replace(/-/g, ' ')
      .replace(/\s+and\s+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const regex = tokens.length ? new RegExp(tokens.join('.*'), 'i') : null;

    return (
      categories.find(
        (c) =>
          c.slug === target ||
          c._id === target ||
          c.name.toLowerCase() === target ||
          (regex && (regex.test(c.slug) || regex.test(c.name)))
      ) || null
    );
  }, [categories, currentCategorySlug, activeFilters.category]);

  // Update page title dynamically for SEO
  useEffect(() => {
    if (searchTerm) {
      document.title = `ApexMart - Search: "${searchTerm}"`;
    } else if (selectedCategory) {
      document.title = `ApexMart - ${selectedCategory.name} Catalog`;
    } else {
      document.title = 'ApexMart - Prime Product Catalog & Deals';
    }
  }, [searchTerm, selectedCategory]);

  // Handler: Update one or more filter parameters in URL
  const handleFilterChange = (newParams) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, val]) => {
        if (val === undefined || val === null || val === '') {
          updated.delete(key);
        } else {
          updated.set(key, String(val));
        }
      });
      return updated;
    });
  };

  // Handler: Completely reset all filters AND searched keyword
  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Handler: Remove a single active filter chip
  const handleRemoveFilter = (key) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      updated.delete(key);
      updated.set('page', '1');
      return updated;
    });
  };

  // Handler: Remove multiple filter keys atomically
  const handleRemoveFilters = (keys) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      keys.forEach((k) => updated.delete(k));
      updated.set('page', '1');
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* 1) Breadcrumbs & Category Bar */}
      <nav
        aria-label="Breadcrumb navigation"
        className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 overflow-x-auto py-1"
      >
        <Link to="/" className="hover:text-brand-hover transition">
          Home
        </Link>
        <HiChevronRight className="w-3 h-3 text-gray-400" />
        <Link
          to="/catalog"
          className={
            selectedCategory || searchTerm
              ? 'hover:text-brand-hover transition'
              : 'text-brand-amber font-bold'
          }
        >
          Catalog
        </Link>
        {selectedCategory && (
          <>
            <HiChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-brand-amber font-bold truncate">
              {selectedCategory.name}
            </span>
          </>
        )}
        {searchTerm && (
          <>
            <HiChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-900 dark:text-white font-semibold truncate">
              Results for &ldquo;{searchTerm}&rdquo;
            </span>
          </>
        )}
      </nav>

      {/* 2) Top Deals Scroller Spotlight (Shown on default catalog overview or explicit deals feed) */}
      {((!searchTerm && (!activeFilters.sort || activeFilters.sort === '-createdAt') && !currentCategorySlug && !activeFilters['price[gte]']) || activeFilters.isDeal) && (
        <DealsScroller
          title="Today's Featured Deals"
          subtitle="Grab massive discounts before time runs out"
        />
      )}

      {/* 3) Results Toolbar & Sort Controls */}
      <div className="bg-white dark:bg-brand-darkcard p-4 rounded-xl shadow-sm border border-gray-200/90 dark:border-brand-darkborder flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-display">
            {searchTerm ? (
              <span>
                Search results for <span className="text-brand-amber">&ldquo;{searchTerm}&rdquo;</span>
              </span>
            ) : selectedCategory ? (
              <span>{selectedCategory.name}</span>
            ) : activeFilters.isDeal ? (
              <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <HiSparkles className="w-4 h-4 text-brand-amber" />
                Today's Prime Deals
              </span>
            ) : (
              <span>All Prime Products</span>
            )}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
            <span>
              {isLoading
                ? 'Loading catalog items...'
                : `Showing ${results} of ${total} products`}
            </span>
            {isFetching && !isLoading && (
              <span className="text-[11px] text-brand-amber font-bold animate-pulse">
                • Updating...
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Mobile Filter Drawer Button */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-sm"
          >
            <HiAdjustmentsHorizontal className="w-4 h-4 text-brand-amber" />
            <span>Filters</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap"
            >
              Sort by:
            </label>
            <select
              id="sort-select"
              value={currentSort}
              onChange={(e) =>
                handleFilterChange({ sort: e.target.value, page: 1 })
              }
              className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-amber cursor-pointer font-medium"
            >
              <option value="-createdAt">Newest Arrivals</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-ratingsAverage">Avg. Customer Review</option>
              <option value="-dealDiscountPercentage">Discount: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4) Active Filter Dismissible Chips */}
      {(searchTerm ||
        selectedCategory ||
        activeFilters.isDeal ||
        activeFilters['price[gte]'] ||
        activeFilters['price[lte]'] ||
        activeFilters['ratingsAverage[gte]']) && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-gray-500 font-medium">Active Filters:</span>

          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-brand-hover border border-brand-amber/30">
              Keyword: &ldquo;{searchTerm}&rdquo;
              <button
                type="button"
                onClick={() => handleRemoveFilter('search')}
                aria-label="Remove search filter"
                className="hover:text-red-500 transition"
              >
                <HiXMark className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              Department: {selectedCategory.name}
              <button
                type="button"
                onClick={() => handleRemoveFilter('categorySlug')}
                aria-label="Remove category filter"
                className="hover:text-red-500 transition"
              >
                <HiXMark className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeFilters.isDeal && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
              Deals Only
              <button
                type="button"
                onClick={() => handleRemoveFilter('isDeal')}
                aria-label="Remove deals filter"
                className="hover:text-red-500 transition"
              >
                <HiXMark className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {(activeFilters['price[gte]'] || activeFilters['price[lte]']) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Price: ${activeFilters['price[gte]'] || '0'} - ${activeFilters['price[lte]'] || '∞'}
              <button
                type="button"
                onClick={() =>
                  handleRemoveFilters(['price[gte]', 'price[lte]'])
                }
                aria-label="Remove price filter"
                className="hover:text-red-500 transition"
              >
                <HiXMark className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeFilters['ratingsAverage[gte]'] && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              {activeFilters['ratingsAverage[gte]']}★ & Up
              <button
                type="button"
                onClick={() => handleRemoveFilter('ratingsAverage[gte]')}
                aria-label="Remove rating filter"
                className="hover:text-red-500 transition"
              >
                <HiXMark className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-brand-hover hover:underline font-bold ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* 5) Main Content Grid (Sidebar + Product Listings) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-20">
          <CatalogFilters
            categories={categories}
            activeFilters={activeFilters}
            selectedCategory={selectedCategory}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </aside>

        {/* Mobile Filter Modal / Drawer */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-4/5 max-w-sm bg-white dark:bg-brand-darkcard h-full p-5 overflow-y-auto shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-brand-darkborder">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                    Filter Products
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                  >
                    <HiXMark className="w-5 h-5" />
                  </button>
                </div>
                <CatalogFilters
                  categories={categories}
                  activeFilters={activeFilters}
                  selectedCategory={selectedCategory}
                  onFilterChange={(params) => {
                    handleFilterChange(params);
                    setIsMobileFiltersOpen(false);
                  }}
                  onClearFilters={() => {
                    handleClearFilters();
                    setIsMobileFiltersOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Product Cards Grid & Pagination */}
        <section className="lg:col-span-3 space-y-6">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            isFetching={isFetching}
            onClearFilters={handleClearFilters}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            limit={20}
            onPageChange={(page) => handleFilterChange({ page })}
          />
        </section>
      </div>
    </div>
  );
}
