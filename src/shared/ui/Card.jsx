import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const cardVariants = cva(
  'rounded-[var(--radius-panel)] border text-[color:var(--text-body)]',
  {
    variants: {
      variant: {
        default: 'border-[var(--border)] bg-[var(--card)]',
        subtle: 'border-[var(--border)] bg-[var(--surface-subtle)]',
        selected: 'border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-soft)]',
        flat: 'border-transparent bg-transparent',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  },
);

export const Card = forwardRef(function Card(
  { asChild = false, className, variant, padding, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref}
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  );
});

export const CardHeader = forwardRef(function CardHeader({ className, ...props }, ref) {
  return <div ref={ref} data-slot="card-header" className={cn('flex flex-col gap-1.5', className)} {...props} />;
});

export const CardTitle = forwardRef(function CardTitle({ className, ...props }, ref) {
  return <h3 ref={ref} data-slot="card-title" className={cn('text-[length:var(--font-size-section-title)] font-[var(--font-weight-bold)] leading-[var(--line-height-heading)] text-[color:var(--text-heading)]', className)} {...props} />;
});

export const CardDescription = forwardRef(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} data-slot="card-description" className={cn('text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body)] text-[color:var(--text-muted)]', className)} {...props} />;
});

export const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} data-slot="card-content" className={cn(className)} {...props} />;
});

export const CardFooter = forwardRef(function CardFooter({ className, ...props }, ref) {
  return <div ref={ref} data-slot="card-footer" className={cn('flex items-center', className)} {...props} />;
});

export { cardVariants };
