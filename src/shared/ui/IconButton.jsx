import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const iconButtonVariants = cva(
  'inline-grid place-items-center rounded-[var(--radius-control)] border transition-[background-color,border-color,color,transform] duration-[var(--motion-fast)] ease-[var(--easing-standard)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]',
        primary: 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-strong)]',
        ghost: 'border-transparent bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]',
      },
      size: {
        sm: 'size-8',
        md: 'size-9',
        lg: 'size-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export const IconButton = forwardRef(function IconButton(
  { label, className, children, variant, size, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
});

export { iconButtonVariants };
