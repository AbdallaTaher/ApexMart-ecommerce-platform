import { HiCheck } from 'react-icons/hi2';

const STEPS = [
  { id: 1, name: 'Shipping Address' },
  { id: 2, name: 'Delivery Speed' },
  { id: 3, name: 'Payment & Place Order' },
];

/**
 * Multi-Step Progress Tracker for Checkout Flow
 *
 * @param {Object} props
 * @param {number} props.currentStep - Current active step (1, 2, or 3)
 * @param {Function} props.onStepClick - Callback to navigate to an earlier completed step
 * @param {number} props.maxStepReached - Highest step reached so far to prevent skipping ahead
 */
export default function CheckoutStepper({ currentStep = 1, onStepClick, maxStepReached = 1 }) {
  return (
    <nav aria-label="Checkout Progress" className="w-full mb-8">
      <ol className="flex items-center justify-between max-w-2xl mx-auto relative">
        {/* Background Connecting Line */}
        <div
          className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-800 -z-0"
          aria-hidden="true"
        />
        {/* Dynamic Progress Fill Line */}
        <div
          className="absolute top-4 left-6 h-0.5 bg-brand-amber transition-all duration-300 ease-out -z-0"
          style={{
            width: `${((Math.min(currentStep, 3) - 1) / (STEPS.length - 1)) * 90}%`,
          }}
          aria-hidden="true"
        />

        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = step.id <= maxStepReached && step.id !== currentStep;

          return (
            <li key={step.id} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.id)}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950/60 cursor-pointer hover:bg-emerald-700'
                    : isCurrent
                      ? 'bg-brand-amber text-slate-950 font-extrabold ring-4 ring-amber-100 dark:ring-amber-950/60 shadow-md'
                      : 'bg-white dark:bg-brand-darkcard border-2 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                } ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? <HiCheck className="w-5 h-5 stroke-[2.5]" /> : step.id}
              </button>
              <span
                className={`mt-2 text-xs sm:text-sm font-medium tracking-tight text-center ${
                  isCurrent
                    ? 'text-brand-amber font-bold'
                    : isCompleted
                      ? 'text-gray-900 dark:text-gray-200 font-semibold'
                      : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {step.name}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
