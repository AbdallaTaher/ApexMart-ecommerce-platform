import { HiExclamationTriangle, HiArrowPath } from 'react-icons/hi2';
import Button from './Button';

/**
 * Standard Error Boundary Fallback component for catching React rendering exceptions
 * @param {Object} props
 * @param {Error} props.error - Caught error instance
 * @param {Function} props.resetErrorBoundary - Callback to reset error state and retry
 */
export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
        <HiExclamationTriangle className="w-10 h-10" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold font-display text-gray-900 dark:text-white mb-2">
        Something went wrong
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-4">
        An unexpected error occurred while rendering this view. Our engineering team
        has been notified.
      </p>

      {error?.message && (
        <pre className="p-3 mb-6 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 rounded-lg max-w-lg overflow-x-auto border border-red-200 dark:border-red-900/50">
          {error.message}
        </pre>
      )}

      <Button
        onClick={resetErrorBoundary}
        size="md"
        className="inline-flex items-center gap-2"
      >
        <HiArrowPath className="w-4 h-4" />
        <span>Try Again</span>
      </Button>
    </div>
  );
}
