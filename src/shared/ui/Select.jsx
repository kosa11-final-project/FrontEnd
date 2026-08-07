import { forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-9 w-full appearance-none rounded-[var(--radius-control)] border border-[var(--input)] bg-[var(--surface-subtle)] px-3 text-xs text-[var(--foreground)] outline-none transition-colors focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring-soft)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
