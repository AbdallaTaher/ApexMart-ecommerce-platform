import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiLockClosed, HiShieldCheck, HiGift, HiCheck } from 'react-icons/hi2';
import { useUser } from '../../auth/hooks/useUser';

/**
 * Sticky Order Subtotal & Checkout Panel
 * Amazon-style summary box with real-time financial totals, gift options, and checkout CTA.
 *
 * @param {Object} props
 * @param {Object} props.summary - Cart summary object
 * @param {boolean} props.isSyncing - Network sync status indicator
 */
export default function CartSummary({ summary = {}, isSyncing = false }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  const [isGift, setIsGift] = useState(false);

  const {
    itemsCount = 0,
    subtotal = 0,
    freeShippingEligible = false,
    shippingFee = 0,
    estimatedTax = 0,
    total = 0,
  } = summary;

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <aside
      aria-label="Order Checkout Summary"
      className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-5 shadow-sm space-y-5 lg:sticky lg:top-24"
    >
      {/* Prime Free Delivery Guarantee Banner */}
      {freeShippingEligible && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
          <HiCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Part of your order qualifies for <strong>FREE Prime Delivery</strong>.
          </span>
        </div>
      )}

      {/* Subtotal Display */}
      <div className="space-y-1">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-baseline justify-between">
          <span>
            Subtotal ({itemsCount} {itemsCount === 1 ? 'item' : 'items'}):
          </span>
          <span className="font-display text-xl sm:text-2xl font-extrabold text-gray-950 dark:text-white">
            ${subtotal.toFixed(2)}
          </span>
        </h2>
        {isSyncing && (
          <p className="text-[11px] text-brand-amber animate-pulse">
            Updating prices & stock with live warehouse...
          </p>
        )}
      </div>

      {/* Gift Checkbox */}
      <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isGift}
          onChange={(e) => setIsGift(e.target.checked)}
          className="rounded border-gray-300 text-brand-amber focus:ring-brand-amber w-4 h-4 cursor-pointer"
        />
        <HiGift className="w-4 h-4 text-gray-400" />
        <span>This order contains a gift</span>
      </label>

      {/* Primary Checkout CTA */}
      <button
        type="button"
        disabled={itemsCount === 0}
        onClick={handleProceedToCheckout}
        className="w-full py-3 px-4 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-sm font-bold shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <HiLockClosed className="w-4 h-4" />
        <span>Proceed to Checkout</span>
      </button>

      {/* Financial Breakdown Accordion */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex justify-between">
          <span>Items subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated shipping</span>
          <span className={shippingFee === 0 ? 'text-emerald-600 font-semibold' : ''}>
            {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Estimated sales tax</span>
          <span>${estimatedTax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-gray-950 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
          <span>Estimated Total</span>
          <span className="font-display text-base font-extrabold text-brand-amber">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Trust & Security Badge */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-1">
        <HiShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>256-bit Bank-Grade SSL Encryption</span>
      </div>
    </aside>
  );
}
