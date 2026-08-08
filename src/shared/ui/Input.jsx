import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const inputVariants = cva(
  'flex w-full rounded-[var(--radius-control)] border bg-[var(--surface-subtle)] text-[color:var(--foreground)] leading-[var(--line-height-filter)] outline-none transition-colors placeholder:text-[color:var(--muted-foreground)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring-soft)] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 text-[length:var(--font-size-meta)]',
        md: 'h-9 px-3 text-[length:var(--font-size-filter)]',
        lg: 'h-10 px-3.5 text-[length:var(--font-size-body)]',
      },
      tone: {
        default: 'border-[var(--input)]',
        error: 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger-soft)]',
        success: 'border-[var(--good)] focus:border-[var(--good)] focus:ring-[var(--good-soft)]',
      },
    },
    defaultVariants: { size: 'md', tone: 'default' },
  },
);

export const Input = forwardRef(function Input({ className, type = 'text', size, tone, ...props }, ref) {
  return <input ref={ref} type={type} className={cn(inputVariants({ size, tone }), className)} {...props} />;
});

export { inputVariants };
