import { cn } from '../utils/cn';

/**
 * Reusable loading spinner primitive
 */
export default function Spinner({ size = 'md', className }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'rounded-full border-gray-200 dark:border-gray-700 border-t-brand-amber animate-spin inline-block',
        sizeClasses[size] || sizeClasses.md,
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
