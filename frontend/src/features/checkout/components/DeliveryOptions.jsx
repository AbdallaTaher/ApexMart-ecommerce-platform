import { format, addDays } from 'date-fns';
import { HiTruck, HiBolt, HiCheck, HiArrowLeft } from 'react-icons/hi2';

/**
 * Step 2: Delivery Speed Selection Component
 *
 * @param {Object} props
 * @param {string} props.selectedSpeed - 'standard' | 'two_day' | 'next_day'
 * @param {Function} props.onSelectSpeed - Callback when user chooses a speed
 * @param {number} props.subtotal - Cart subtotal to calculate free shipping eligibility
 * @param {Function} props.onContinue - Proceed to Step 3 (Payment)
 * @param {Function} props.onBack - Return to Step 1 (Address)
 */
export default function DeliveryOptions({
  selectedSpeed = 'standard',
  onSelectSpeed,
  subtotal = 0,
  onContinue,
  onBack,
}) {
  const isFreeStandard = subtotal >= 35.0 && subtotal > 0;
  const standardCost = isFreeStandard ? 0 : 5.99;

  const now = new Date();
  const standardDate = addDays(now, 4);
  const twoDayDate = addDays(now, 2);
  const nextDayDate = addDays(now, 1);

  const OPTIONS = [
    {
      id: 'standard',
      title: 'Standard Shipping',
      dateText: format(standardDate, 'EEEE, MMM d'),
      cost: standardCost,
      isFree: standardCost === 0,
      badge: isFreeStandard ? 'FREE with Prime / Orders over $35' : null,
      description: 'Estimated 3-5 business days',
      icon: HiTruck,
    },
    {
      id: 'two_day',
      title: 'Two-Day Delivery',
      dateText: format(twoDayDate, 'EEEE, MMM d'),
      cost: 9.99,
      isFree: false,
      badge: 'Fast Delivery',
      description: 'Guaranteed delivery in 2 business days',
      icon: HiBolt,
    },
    {
      id: 'next_day',
      title: 'Next-Day Priority Delivery',
      dateText: format(nextDayDate, 'EEEE, MMM d'),
      cost: 14.99,
      isFree: false,
      badge: 'Priority Express',
      description: 'Delivered tomorrow afternoon',
      icon: HiBolt,
    },
  ];

  return (
    <div className="bg-white dark:bg-brand-darkcard border border-gray-200 dark:border-brand-darkborder rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 pb-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-brand-amber">
          <HiTruck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-display">
            2. Choose your delivery option
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Select the delivery speed and transit timeframe for your shipment.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {OPTIONS.map((option) => {
          const isSelected = selectedSpeed === option.id;
          const Icon = option.icon;

          return (
            <label
              key={option.id}
              onClick={() => onSelectSpeed(option.id)}
              className={`flex items-start justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-brand-amber bg-amber-50/40 dark:bg-amber-950/20 shadow-sm'
                  : 'border-gray-200 dark:border-brand-darkborder hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-brand-darkcard'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="deliverySpeed"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => onSelectSpeed(option.id)}
                  className="mt-1 w-4 h-4 text-brand-amber focus:ring-brand-amber cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {option.dateText}
                    </span>
                    {option.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {option.title} &bull; {option.description}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span
                  className={`text-sm font-bold ${
                    option.isFree
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {option.isFree ? 'FREE' : `$${option.cost.toFixed(2)}`}
                </span>
                <Icon className="w-4 h-4 text-gray-400 ml-auto mt-1" />
              </div>
            </label>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer transition"
        >
          <HiArrowLeft className="w-4 h-4" />
          <span>Back to address</span>
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 rounded-full bg-brand-amber hover:bg-brand-hover text-slate-950 text-sm font-bold shadow-sm transition active:scale-[0.98] cursor-pointer flex items-center gap-2"
        >
          <span>Continue to payment</span>
          <HiCheck className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
