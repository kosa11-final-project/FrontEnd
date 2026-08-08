import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const buttonVariants = cva(
  'ui-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] text-[var(--font-size-body-sm)] font-[var(--font-weight-semibold)] transition-[background-color,border-color,color,transform] duration-[var(--motion-fast)] ease-[var(--easing-standard)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-strong)]',
        secondary: 'border border-[var(--border-strong)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]',
        ghost: 'text-[var(--muted-foreground)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]',
        danger: 'bg-[var(--danger)] text-white hover:brightness-95',
      },
      size: {
        sm: 'h-8 px-3 text-[var(--font-size-meta)]',
        md: 'h-9 px-3.5 text-[var(--font-size-body-sm)]',
        lg: 'h-10 px-4 text-[var(--font-size-body)]',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export const Button = forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
});

export { buttonVariants };
