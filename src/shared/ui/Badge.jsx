import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-[var(--font-size-meta)] font-[var(--font-weight-bold)] leading-none',
  {
    variants: {
      variant: {
        neutral: 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--muted-foreground)]',
        good: 'border-transparent bg-[var(--good-soft)] text-[var(--good)]',
        info: 'border-transparent bg-[var(--info-soft)] text-[var(--info)]',
        warning: 'border-transparent bg-[var(--warning-soft)] text-[var(--warning)]',
        danger: 'border-transparent bg-[var(--danger-soft)] text-[var(--danger)]',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { badgeVariants };
