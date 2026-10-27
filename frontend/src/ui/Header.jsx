import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  HiMapPin,
  HiMagnifyingGlass,
  HiShoppingCart,
  HiSun,
  HiMoon,
  HiXMark,
} from 'react-icons/hi2';
import { useDarkMode } from '../context/DarkModeContext';
import { useCart } from '../context/CartContext';
import { useUser } from '../features/auth/hooks/useUser';
import UserNav from '../features/auth/components/UserNav';
import { useCategories } from '../features/products/hooks/useCategories';

export default function Header({ cartCount: explicitCartCount }) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { summary } = useCart();
  const { isAuthenticated } = useUser();
  const cartCount = explicitCartCount !== undefined ? explicitCartCount : (summary?.itemsCount || 0);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategories();

  // Read active search params from URL
  const urlSearch = searchParams.get('search') || '';
  const urlCategorySlug = searchParams.get('categorySlug') || '';

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState(urlCategorySlug);

  // Synchronize input fields when URL search params change externally (e.g. clicking 'Clear all')
  useEffect(() => {
    if (location.pathname.startsWith('/catalog')) {
      setSearchQuery(urlSearch);
      setSelectedCategory(urlCategorySlug);
    }
  }, [urlSearch, urlCategorySlug, location.pathname]);

  // Execute search params update via setSearchParams if on catalog, or navigate if elsewhere
  const applySearch = (query, categorySlug) => {
    const isCatalog = location.pathname.startsWith('/catalog');
    const params = new URLSearchParams(isCatalog ? searchParams : '');

    if (query && query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }

    if (categorySlug) {
      params.set('categorySlug', categorySlug);
      params.delete('category'); // Clean out any raw ObjectId filter
    } else {
      params.delete('categorySlug');
      params.delete('category');
    }

    params.set('page', '1');

    if (isCatalog) {
      setSearchParams(params, { replace: true });
    } else {
      navigate(`/catalog?${params.toString()}`);
    }
  };

  // Real-time debounced auto-search: continues filtering live as the user types (ONLY on catalog page)
  useEffect(() => {
    // Crucial: Only auto-filter if actively on the catalog discovery page
    if (!location.pathname.startsWith('/catalog')) return;

    // Only search if the local query differs from what is already registered in the URL
    if (searchQuery === urlSearch) return;

    const timer = setTimeout(() => {
      applySearch(searchQuery, selectedCategory);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, urlSearch, location.pathname]);

  // Instant department switch: auto-searches immediately on change when on catalog
  const handleDepartmentChange = (newCategorySlug) => {
    setSelectedCategory(newCategorySlug);
    if (location.pathname.startsWith('/catalog')) {
      applySearch(searchQuery, newCategorySlug);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (location.pathname.startsWith('/catalog')) {
      applySearch('', selectedCategory);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applySearch(searchQuery, selectedCategory);
  };

  return (
    <header className="bg-brand-navy dark:bg-[#0b0f14] text-white sticky top-0 z-50 shadow-md">
      {/* Top Main Row */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:ring-1 hover:ring-white transition flex-shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-amber flex items-center justify-center text-slate-950 font-black text-xl font-display shadow-sm">
            A
          </div>
          <div className="leading-none">
            <span className="text-xl font-bold tracking-tight text-white font-display">
              Apex<span className="text-brand-amber">Mart</span>
            </span>
            <span className="block text-[9px] text-gray-400 font-sans tracking-widest uppercase">
              Prime Marketplace
            </span>
          </div>
        </Link>

        {/* Deliver To Location */}
        <button
          type="button"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded hover:ring-1 hover:ring-white transition text-left flex-shrink-0 text-xs"
        >
          <HiMapPin className="w-4 h-4 text-brand-amber flex-shrink-0" />
          <div>
            <span className="text-gray-400 block text-[10px]">Deliver to</span>
            <span className="font-bold text-white leading-tight">New York 10001</span>
          </div>
        </button>

        {/* Global Live Auto-Search Bar */}
        <div className="flex-1 max-w-2xl min-w-0">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-amber bg-white shadow-sm"
          >
            {/* Auto-filtering Department Selector */}
            <select
              aria-label="Department selection"
              value={selectedCategory}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-2.5 py-2.5 font-medium border-r border-gray-300 focus:outline-none cursor-pointer hidden sm:block max-w-[135px] truncate transition"
            >
              <option value="">All Departments</option>
              {categories.map((cat) => (
                <option key={cat._id || cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Live Typing Input with Clear Button */}
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ApexMart, brands, and categories..."
                className="w-full pl-3 pr-8 py-2 text-sm text-gray-900 bg-white placeholder-gray-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search query"
                  className="absolute right-2 p-1 text-gray-400 hover:text-gray-700 transition"
                >
                  <HiXMark className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              aria-label="Search"
              className="bg-brand-amber hover:bg-brand-hover px-4 py-2.5 text-slate-950 flex items-center justify-center transition flex-shrink-0"
            >
              <HiMagnifyingGlass className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Header Navigation Items */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 text-xs">
          {/* Theme Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg bg-brand-navylight hover:bg-gray-700 text-amber-400 dark:text-amber-300 transition flex items-center justify-center"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <HiSun className="w-4 h-4" /> : <HiMoon className="w-4 h-4" />}
          </button>

          {/* Dynamic Account & User Navigation Menu */}
          <UserNav />

          {/* Returns & Orders */}
          <Link
            to={isAuthenticated ? '/orders' : '/login'}
            state={!isAuthenticated ? { from: { pathname: '/orders' } } : undefined}
            className="hidden lg:flex px-2 py-1 rounded hover:ring-1 hover:ring-white transition flex-col items-start leading-tight"
          >
            <span className="text-gray-300 text-[10px]">Returns</span>
            <span className="font-bold text-white">& Orders</span>
          </Link>

          {/* Shopping Cart Button */}
          <Link
            to="/cart"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:ring-1 hover:ring-white transition relative"
          >
            <div className="relative">
              <HiShoppingCart className="w-6 h-6 text-white" />
              <span className="absolute -top-1.5 -right-2 bg-brand-amber text-slate-950 text-[11px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </div>
            <span className="font-bold text-white hidden sm:inline self-end">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
