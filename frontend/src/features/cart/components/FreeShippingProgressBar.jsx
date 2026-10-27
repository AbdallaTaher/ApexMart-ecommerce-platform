import { HiCheck, HiTruck } from 'react-icons/hi2';

/**
 * Amazon Prime Free Shipping Progress Bar
 * Motivates cart size expansion by visualizing progress toward the $35 free shipping threshold.
 *
 * @param {Object} props
 * @param {number} props.subtotal - Current cart subtotal
 * @param {number} props.threshold - Free shipping threshold (default: 35)
 * @param {boolean} props.isEligible - True if subtotal >= threshold
 * @param {number} props.amountNeeded - Remaining dollars needed for free shipping
 */
export default function FreeShippingProgressBar({
  subtotal = 0,
  threshold = 35.0,
  isEligible = false,
  amountNeeded = 0,
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((subtotal / threshold) * 100)));

  return (
    <div className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        {isEligible ? (
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <HiCheck className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <HiTruck className="w-4 h-4" />
          </div>
        )}

        <div className="text-xs sm:text-sm font-sans">
          {isEligible ? (
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
              Your order qualifies for <strong className="font-bold">FREE Prime Shipping</strong>!
            </p>
          ) : (
            <p className="text-gray-700 dark:text-gray-300">
              Add{' '}
              <strong className="text-brand-amber font-bold">
                ${amountNeeded.toFixed(2)}
              </strong>{' '}
              more of eligible items to get{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                FREE Delivery
              </strong>
              .
            </p>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Free shipping progress"
          style={{ width: `${percentage}%` }}
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isEligible
              ? 'bg-emerald-500 shadow-sm'
              : 'bg-gradient-to-r from-amber-500 to-emerald-500'
          }`}
        />
      </div>
    </div>
  );
}
