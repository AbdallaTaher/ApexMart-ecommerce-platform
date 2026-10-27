import { useState, useEffect } from 'react';
import {
  HiAdjustmentsHorizontal,
  HiStar,
  HiXMark,
  HiCheck,
} from 'react-icons/hi2';

/**
 * Filter Sidebar for Catalog Discovery
 * Supports category switching, price boundaries, star rating minimums, and deal filters.
 *
 * @param {Object} props
 * @param {Array} props.categories - List of categories from useCategories
 * @param {Object} props.activeFilters - Currently applied filter values from URL search params
 * @param {Function} props.onFilterChange - Callback to update single or multiple filter params
 * @param {Function} props.onClearFilters - Callback to reset all filters
 */
export default function CatalogFilters({
  categories = [],
  activeFilters = {},
  selectedCategory = null,
  onFilterChange,
  onClearFilters,
}) {
  const [minPriceInput, setMinPriceInput] = useState(
    activeFilters['price[gte]'] || ''
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    activeFilters['price[lte]'] || ''
  );

  const handlePriceApply = (e) => {
    e.preventDefault();
    onFilterChange({
      'price[gte]': minPriceInput || undefined,
      'price[lte]': maxPriceInput || undefined,
      page: 1, // Reset to page 1 on filter mutation
    });
  };

  const handlePricePreset = (min, max) => {
    const isCurrentActive =
      String(activeFilters['price[gte]'] || '') ===
        (min !== undefined ? String(min) : '') &&
      String(activeFilters['price[lte]'] || '') ===
        (max !== undefined ? String(max) : '');

    if (isCurrentActive) {
      setMinPriceInput('');
      setMaxPriceInput('');
      onFilterChange({
        'price[gte]': undefined,
        'price[lte]': undefined,
        page: 1,
      });
      return;
    }

    setMinPriceInput(min !== undefined ? String(min) : '');
    setMaxPriceInput(max !== undefined ? String(max) : '');
    onFilterChange({
      'price[gte]': min !== undefined ? min : undefined,
      'price[lte]': max !== undefined ? max : undefined,
      page: 1,
    });
  };

  // Synchronize price inputs when activeFilters change externally (e.g. Clear all)
  useEffect(() => {
    setMinPriceInput(activeFilters['price[gte]'] || '');
    setMaxPriceInput(activeFilters['price[lte]'] || '');
  }, [activeFilters['price[gte]'], activeFilters['price[lte]']]);

  const handleClearAll = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    onClearFilters();
  };

  const isFiltered = Boolean(
    activeFilters.search ||
    activeFilters.category ||
    activeFilters.categorySlug ||
    activeFilters.isDeal ||
    activeFilters['price[gte]'] ||
    activeFilters['price[lte]'] ||
    activeFilters['ratingsAverage[gte]']
  );

  return (
    <div className="bg-white dark:bg-brand-darkcard p-5 rounded-xl border border-gray-200/90 dark:border-brand-darkborder shadow-sm space-y-6">
      {/* Header & Reset CTA */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-brand-darkborder pb-3">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <HiAdjustmentsHorizontal className="w-4 h-4 text-brand-amber" />
          <span>Filters</span>
        </h3>
        {isFiltered && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-brand-hover hover:underline font-semibold flex items-center gap-1"
          >
            <HiXMark className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      {/* 1) Today's Deals Toggle */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Deals & Discounts
        </h4>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={activeFilters.isDeal === 'true' || activeFilters.isDeal === true}
            onChange={(e) =>
              onFilterChange({
                isDeal: e.target.checked ? 'true' : undefined,
                page: 1,
              })
            }
            className="rounded border-gray-300 text-brand-amber focus:ring-brand-amber w-4 h-4 cursor-pointer"
          />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-brand-hover transition">
            Today's Deals & Savings
          </span>
        </label>
      </div>

      {/* 2) Department / Categories */}
      <div className="space-y-2 border-t border-gray-100 dark:border-brand-darkborder/60 pt-4">
        <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Department
        </h4>
        <ul className="space-y-1.5 text-xs">
          <li>
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  categorySlug: undefined,
                  category: undefined,
                  page: 1,
                })
              }
              className={`w-full text-left py-1 px-2 rounded-lg transition flex items-center justify-between ${
                !activeFilters.categorySlug && !activeFilters.category
                  ? 'bg-brand-amber/15 text-brand-hover font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>All Departments</span>
              {!activeFilters.categorySlug && !activeFilters.category && (
                <HiCheck className="w-3.5 h-3.5 text-brand-amber" />
              )}
            </button>
          </li>
          {categories.map((cat) => {
            const isSelected =
              activeFilters.categorySlug === cat.slug ||
              activeFilters.category === cat._id ||
              (selectedCategory && selectedCategory._id === cat._id);
            return (
              <li key={cat._id || cat.slug}>
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      categorySlug: cat.slug,
                      category: undefined,
                      page: 1,
                    })
                  }
                  className={`w-full text-left py-1 px-2 rounded-lg transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-brand-amber/15 text-brand-hover font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {isSelected && (
                    <HiCheck className="w-3.5 h-3.5 text-brand-amber flex-shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 3) Customer Reviews Filter */}
      <div className="space-y-2 border-t border-gray-100 dark:border-brand-darkborder/60 pt-4">
        <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Customer Reviews
        </h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map((stars) => {
            const isSelected =
              activeFilters['ratingsAverage[gte]'] === String(stars);
            return (
              <button
                key={stars}
                type="button"
                onClick={() =>
                  onFilterChange({
                    'ratingsAverage[gte]': isSelected ? undefined : String(stars),
                    page: 1,
                  })
                }
                className={`w-full text-left py-1 px-2 rounded-lg transition flex items-center justify-between text-xs ${
                  isSelected
                    ? 'bg-brand-amber/15 text-brand-hover font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <HiStar
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < stars
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span>& Up</span>
                </div>
                {isSelected && (
                  <HiCheck className="w-3.5 h-3.5 text-brand-amber" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4) Price Range Filter */}
      <div className="space-y-3 border-t border-gray-100 dark:border-brand-darkborder/60 pt-4">
        <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Price Range
        </h4>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Under $100', min: undefined, max: 100 },
            { label: '$100 to $300', min: 100, max: 300 },
            { label: '$300 to $500', min: 300, max: 500 },
            { label: '$500 & Above', min: 500, max: undefined },
          ].map((preset) => {
            const isActive =
              String(activeFilters['price[gte]'] || '') ===
                (preset.min !== undefined ? String(preset.min) : '') &&
              String(activeFilters['price[lte]'] || '') ===
                (preset.max !== undefined ? String(preset.max) : '');

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePricePreset(preset.min, preset.max)}
                className={`text-[11px] px-2.5 py-1 rounded transition font-medium ${
                  isActive
                    ? 'bg-brand-amber/20 text-brand-hover dark:text-brand-amber border border-brand-amber/50 font-bold'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-transparent'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Min / Max Inputs */}
        <form onSubmit={handlePriceApply} className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-2 text-xs text-gray-400">$</span>
            <input
              type="number"
              placeholder="Min"
              min="0"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-amber"
            />
          </div>
          <span className="text-gray-400 text-xs">to</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-2 text-xs text-gray-400">$</span>
            <input
              type="number"
              placeholder="Max"
              min="0"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-amber"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-brand-amber hover:text-slate-950 text-gray-700 dark:text-gray-300 text-xs font-bold transition border border-gray-300 dark:border-gray-700"
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );
}
