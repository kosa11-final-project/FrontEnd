import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const skeletonVariants = cva('animate-pulse bg-[var(--color-gray-200)]', {
  variants: {
    shape: {
      rect: 'rounded-[var(--radius-control)]',
      circle: 'rounded-full',
      text: 'h-3 rounded-[var(--radius-control)]',
    },
  },
  defaultVariants: { shape: 'rect' },
});

export function Skeleton({ className, shape, ...props }) {
  return <span aria-hidden="true" className={cn(skeletonVariants({ shape }), className)} {...props} />;
}

export { skeletonVariants };
