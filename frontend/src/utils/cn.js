import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional and dynamic Tailwind classes safely without collisions
 * @param  {...any} inputs - Class values, objects, or arrays
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
