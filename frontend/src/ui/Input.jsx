import { forwardRef } from 'react';
import { cn } from '../utils/cn';

const Input = forwardRef(
  ({ type = 'text', id, hasError = false, disabled = false, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        id={id}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-sm rounded-md transition-colors duration-150',
          'bg-white dark:bg-[#1a1f29] text-gray-900 dark:text-gray-100',
          'border border-gray-300 dark:border-brand-darkborder',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-brand-amber',
          'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60',
          hasError && 'border-red-500 focus:border-red-500 focus:ring-red-400',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
