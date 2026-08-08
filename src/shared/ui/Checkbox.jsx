import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const checkboxVariants = cva(
  'size-4 shrink-0 cursor-pointer appearance-none rounded-[0.25rem] border border-[var(--border-strong)] bg-[var(--surface)] align-middle accent-[var(--primary)] transition-[background-color,border-color,box-shadow] duration-[var(--motion-fast)] checked:border-[var(--primary)] checked:bg-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'size-3.5',
        md: 'size-4',
        lg: 'size-5',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export const Checkbox = forwardRef(function Checkbox({ className, size, ...props }, ref) {
  return <input ref={ref} type="checkbox" className={cn(checkboxVariants({ size }), className)} {...props} />;
});

export { checkboxVariants };
