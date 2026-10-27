import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useLogout } from '../hooks/useLogout';
import {
  HiUserCircle,
  HiArrowRightOnRectangle,
  HiShoppingBag,
  HiShieldCheck,
  HiBuildingStorefront,
} from 'react-icons/hi2';

/**
 * Dynamic Header User Authentication Indicator & Account Menu
 */
export default function UserNav() {
  const { user, isAuthenticated, isLoading } = useUser();
  const { logout, isPending: isLoggingOut } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="px-2 py-1 flex flex-col items-start leading-tight opacity-75">
        <span className="text-gray-400 text-[10px]">Loading...</span>
        <span className="font-bold text-white text-xs">Account</span>
      </div>
    );
  }

  // Unauthenticated State: Direct Link to Sign in
  if (!isAuthenticated || !user) {
    return (
      <Link
        to="/login"
        className="px-2 py-1 rounded hover:ring-1 hover:ring-white transition flex flex-col items-start leading-tight"
      >
        <span className="text-gray-300 text-[10px]">Hello, Sign in</span>
        <span className="font-bold text-white flex items-center gap-1">
          Account & Lists
        </span>
      </Link>
    );
  }

  const roleBadgeColors = {
    user: 'bg-blue-600 text-white',
    seller: 'bg-purple-600 text-white',
    admin: 'bg-amber-500 text-slate-950 font-black',
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="px-2 py-1 rounded hover:ring-1 hover:ring-white transition flex flex-col items-start leading-tight text-left cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-gray-300 text-[10px] truncate max-w-[120px]">
            Hello, {user.name.split(' ')[0]}
          </span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded uppercase font-bold tracking-wider ${
              roleBadgeColors[user.role] || 'bg-gray-600 text-white'
            }`}
          >
            {user.role}
          </span>
        </div>
        <span className="font-bold text-white flex items-center gap-1">
          Account & Lists ▾
        </span>
      </button>

      {/* Account Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a1f29] rounded-xl shadow-xl border border-gray-200 dark:border-brand-darkborder py-3 z-50 animate-fadeIn text-gray-800 dark:text-gray-100 font-sans">
          {/* User Info Header */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-brand-darkborder mb-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>

          {/* Navigation Links */}
          <div className="py-1 text-xs space-y-0.5">
            <Link
              to="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <HiUserCircle className="w-4 h-4 text-brand-amber flex-shrink-0" />
              <span>Your Account & Security</span>
            </Link>

            <Link
              to="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <HiShoppingBag className="w-4 h-4 text-brand-amber flex-shrink-0" />
              <span>Your Orders & Purchases</span>
            </Link>

            {user.role === 'seller' && (
              <Link
                to="/seller"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-purple-600 dark:text-purple-400 font-semibold transition"
              >
                <HiBuildingStorefront className="w-4 h-4 flex-shrink-0" />
                <span>Seller Central Portal</span>
              </Link>
            )}

            {user.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-amber-600 dark:text-amber-400 font-semibold transition"
              >
                <HiShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Platform Governance Console</span>
              </Link>
            )}
          </div>

          {/* Sign Out Action */}
          <div className="border-t border-gray-100 dark:border-brand-darkborder mt-2 pt-1">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer disabled:opacity-50"
            >
              <HiArrowRightOnRectangle className="w-4 h-4 flex-shrink-0" />
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
