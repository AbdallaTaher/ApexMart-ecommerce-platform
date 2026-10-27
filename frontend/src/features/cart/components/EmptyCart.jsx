import { Link } from 'react-router-dom';
import { HiShoppingCart, HiArrowRight, HiSparkles } from 'react-icons/hi2';

/**
 * Empty Cart State Component
 * Visually engaging empty state encouraging product catalog exploration.
 */
export default function EmptyCart() {
  return (
    <div className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-sm max-w-3xl mx-auto">
      {/* Icon Circle */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/30 text-brand-amber flex items-center justify-center shadow-inner">
        <HiShoppingCart className="w-10 h-10 sm:w-12 sm:h-12" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-950 dark:text-white">
          Your ApexMart Cart is empty
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Your shopping cart is waiting. Give it purpose — explore discounted items, top electronics, outdoor gear, and everyday essentials.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          to="/catalog"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-sm font-bold shadow-sm transition active:scale-[0.99]"
        >
          <HiSparkles className="w-4 h-4" />
          <span>Explore Today's Deals</span>
        </Link>
        <Link
          to="/login"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-semibold transition"
        >
          <span>Sign in to your account</span>
          <HiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
