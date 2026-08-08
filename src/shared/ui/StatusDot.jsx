import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const statusDotVariants = cva('block size-1.5 shrink-0 rounded-full', {
  variants: {
    tone: {
      ready: 'bg-[var(--good)] shadow-[0_0_0_3px_var(--good-soft)]',
      good: 'bg-[var(--good)]',
      warning: 'bg-[var(--warning)]',
      danger: 'bg-[var(--danger)]',
    },
  },
  defaultVariants: { tone: 'ready' },
});

// GLOBAL UI: 텍스트와 함께 사용되는 보조 상태 표시입니다. 의미는 호출하는 widget이 소유합니다.
export const StatusDot = forwardRef(function StatusDot({ className, tone, ...props }, ref) {
  return <span ref={ref} aria-hidden="true" className={cn(statusDotVariants({ tone }), className)} {...props} />;
});

export { statusDotVariants };
