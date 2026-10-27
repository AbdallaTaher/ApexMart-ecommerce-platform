import { cn } from '../utils/cn';

/**
 * Form field wrapper enforcing semantic labels, error presentation, and spacing
 */
export default function FormRow({ label, error, id, helperText, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold text-gray-800 dark:text-gray-200 tracking-tight"
        >
          {label}
        </label>
      )}

      {children}

      {helperText && !error && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{helperText}</p>
      )}

      {error && (
        <p
          role="alert"
          className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn"
        >
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
