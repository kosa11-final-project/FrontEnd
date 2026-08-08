import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { ChevronDown } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { Icon } from './Icon.jsx';

const selectVariants = cva(
  'w-full appearance-none rounded-[var(--radius-control)] border bg-[var(--surface-subtle)] text-[color:var(--foreground)] leading-[var(--line-height-filter)] outline-none transition-[background-color,border-color,box-shadow,color] duration-[var(--motion-fast)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring-soft)] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 pl-2.5 pr-8 text-[length:var(--font-size-meta)]',
        md: 'h-9 pl-3 pr-9 text-[length:var(--font-size-filter)]',
        lg: 'h-10 pl-3.5 pr-10 text-[length:var(--font-size-body)]',
      },
      tone: {
        default: 'border-[var(--input)]',
        error: 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger-soft)]',
      },
    },
    defaultVariants: { size: 'md', tone: 'default' },
  },
);

export const Select = forwardRef(function Select(
  { className, containerClassName, children, size, tone, ...props },
  ref,
) {
  return (
    <div className={cn('relative w-full', containerClassName)}>
      <select
        ref={ref}
        className={cn(selectVariants({ size, tone }), className)}
        {...props}
      >
        {children}
      </select>
      <Icon
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]',
          tone === 'error' && 'text-[color:var(--danger)]',
          props.disabled && 'opacity-50',
        )}
        icon={ChevronDown}
        size={16}
      />
    </div>
  );
});

export { selectVariants };
