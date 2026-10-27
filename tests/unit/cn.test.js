import { describe, it, expect } from 'vitest';
import { cn } from '../../frontend/src/utils/cn';

describe('Frontend cn Utility Unit Tests', () => {
  it('should merge basic class names correctly', () => {
    const result = cn('px-4', 'py-2', 'text-sm');
    expect(result).toBe('px-4 py-2 text-sm');
  });

  it('should resolve Tailwind conflicts via tailwind-merge', () => {
    // p-4 should be overridden by p-2
    const paddingConflict = cn('p-4', 'p-2');
    expect(paddingConflict).toBe('p-2');

    // text-red-500 should be overridden by text-blue-600
    const colorConflict = cn('text-red-500', 'text-blue-600');
    expect(colorConflict).toBe('text-blue-600');
  });

  it('should ignore false, null, and undefined values cleanly', () => {
    const result = cn('flex', false && 'hidden', null, undefined, 'items-center');
    expect(result).toBe('flex items-center');
  });

  it('should handle conditional object syntax', () => {
    const isActive = true;
    const isDisabled = false;

    const result = cn('btn', {
      'btn-active': isActive,
      'btn-disabled': isDisabled,
    });

    expect(result).toBe('btn btn-active');
  });
});
