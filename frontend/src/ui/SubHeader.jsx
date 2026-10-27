import { Link } from 'react-router-dom';
import { HiBars3 } from 'react-icons/hi2';

export default function SubHeader() {
  return (
    <nav
      aria-label="Secondary navigation"
      className="bg-brand-navylight text-white text-xs px-4 py-1.5 flex items-center justify-between border-t border-gray-700/50"
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        {/* Left Links */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Link
            to="/catalog"
            className="flex items-center gap-1.5 px-2 py-1 rounded font-bold hover:ring-1 hover:ring-white transition"
          >
            <HiBars3 className="w-4 h-4" />
            <span>All</span>
          </Link>
          <Link
            to="/catalog?isDeal=true"
            className="px-2 py-1 rounded hover:ring-1 hover:ring-white transition text-gray-200 hover:text-white"
          >
            Today's Deals
          </Link>
          <Link
            to="/catalog?categorySlug=electronics"
            className="px-2 py-1 rounded hover:ring-1 hover:ring-white transition text-gray-200 hover:text-white hidden md:inline"
          >
            Electronics
          </Link>
          <Link
            to="/catalog?search=laptop"
            className="px-2 py-1 rounded hover:ring-1 hover:ring-white transition text-gray-200 hover:text-white hidden md:inline"
          >
            Computers
          </Link>
          <Link
            to="/catalog?categorySlug=fashion-and-apparel"
            className="px-2 py-1 rounded hover:ring-1 hover:ring-white transition text-gray-200 hover:text-white hidden sm:inline"
          >
            Fashion
          </Link>
          <Link
            to="/catalog?categorySlug=home-and-kitchen"
            className="px-2 py-1 rounded hover:ring-1 hover:ring-white transition text-gray-200 hover:text-white hidden lg:inline"
          >
            Home & Kitchen
          </Link>
          <Link
            to="/seller/dashboard"
            className="px-2 py-1 rounded hover:ring-1 hover:ring-white transition text-amber-400 font-semibold"
          >
            Sell on ApexMart
          </Link>
        </div>

        {/* Right Promo Text */}
        <div className="hidden lg:flex items-center gap-2 text-gray-300 flex-shrink-0">
          <span className="font-semibold text-white">Prime Member Exclusive:</span>
          <span>Fast, FREE Delivery on millions of items</span>
        </div>
      </div>
    </nav>
  );
}
