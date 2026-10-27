import { Link } from 'react-router-dom';
import { HiArrowPath, HiTrash, HiExclamationTriangle } from 'react-icons/hi2';

import { useCart } from '../context/CartContext';
import FreeShippingProgressBar from '../features/cart/components/FreeShippingProgressBar';
import CartItem from '../features/cart/components/CartItem';
import CartSummary from '../features/cart/components/CartSummary';
import EmptyCart from '../features/cart/components/EmptyCart';
import DealsScroller from '../features/products/components/DealsScroller';

/**
 * ApexMart Master Shopping Cart Page
 * Responsive 2-Column Amazon Architecture:
 * - Left/Center Column: Free shipping indicator, item management list, quantity selectors.
 * - Right Column: Sticky financial summary & 1-click checkout trigger.
 * - Bottom Section: Contextual prime recommendations scroller.
 */
export default function CartPage() {
  const {
    items,
    summary,
    isLoading,
    isSyncing,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    hasUnavailableItems,
  } = useCart();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = items.length === 0;

  return (
    <div className="space-y-12">
      {/* 1) Breadcrumbs */}
      <nav aria-label="Breadcrumb navigation" className="text-xs text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-brand-hover transition">
          Home
        </Link>{' '}
        &gt;{' '}
        <span className="font-bold text-gray-800 dark:text-gray-200">
          Shopping Cart ({summary.itemsCount})
        </span>
      </nav>

      {isEmpty ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Cart Items Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Free Shipping Milestone Progress Bar */}
            <FreeShippingProgressBar
              subtotal={summary.subtotal}
              threshold={summary.freeShippingThreshold}
              isEligible={summary.freeShippingEligible}
              amountNeeded={summary.amountUntilFreeShipping}
            />

            {/* Warning banner for unavailable or out of stock items */}
            {hasUnavailableItems && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
                <HiExclamationTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                <span>
                  One or more items in your cart are currently out of stock or unavailable. They have been zeroed out of your order subtotal.
                </span>
              </div>
            )}

            {/* Cart Header Card */}
            <div className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h1 className="text-2xl font-bold font-display text-gray-950 dark:text-white">
                    Shopping Cart
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Verify quantities, manage items, and review warehouse stock.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={refreshCart}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-brand-hover transition disabled:opacity-50"
                  >
                    <HiArrowPath className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Refresh Stock</span>
                  </button>

                  <span className="text-gray-300 dark:text-gray-700">|</span>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition"
                  >
                    <HiTrash className="w-3.5 h-3.5" />
                    <span>Clear Cart</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4 pt-2">
                {items.map((item) => (
                  <CartItem
                    key={item.product?._id || item.product || item._id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>

              {/* Subtotal Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-right">
                <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  Subtotal ({summary.itemsCount} {summary.itemsCount === 1 ? 'item' : 'items'}):{' '}
                  <strong className="font-display text-xl font-extrabold text-brand-amber">
                    ${summary.subtotal.toFixed(2)}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Checkout Summary */}
          <div className="lg:col-span-4">
            <CartSummary summary={summary} isSyncing={isSyncing} />
          </div>
        </div>
      )}

      {/* Contextual Recommendation Deals Feed */}
      <section aria-label="Recommended deals" className="pt-8 border-t border-gray-200 dark:border-brand-darkborder">
        <DealsScroller
          title="Recommended For You"
          subtitle="Explore trending Prime discounts you might want to add to your order"
        />
      </section>
    </div>
  );
}
