import { forwardRef } from 'react';
import { cn } from '../utils/cn';

const variants = {
  primary:
    'bg-brand-amber hover:bg-brand-hover text-slate-950 font-bold shadow-sm hover:shadow transition active:scale-[0.99]',
  secondary:
    'bg-gray-200 hover:bg-gray-300 dark:bg-brand-darkborder dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold',
  danger:
    'bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm active:scale-[0.99]',
  ghost:
    'bg-transparent hover:bg-gray-200 dark:hover:bg-brand-darkborder text-gray-700 dark:text-gray-300',
  outline:
    'border border-gray-300 dark:border-brand-darkborder hover:bg-gray-100 dark:hover:bg-brand-darkborder text-gray-900 dark:text-gray-100',
};

const sizes = {
  sm: 'px-2.5 py-1 text-xs rounded',
  md: 'px-4 py-2 text-sm rounded-md',
  lg: 'px-6 py-3 text-base rounded-lg',
};

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-amber focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
