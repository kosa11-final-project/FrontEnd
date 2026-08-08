import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const avatarVariants = cva(
  'grid shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] font-black text-[color:var(--primary-strong)]',
  {
    variants: {
      size: {
        md: 'size-[31px] text-[length:var(--font-size-caption)]',
        sm: 'size-[26px] text-[length:var(--font-size-overline)]',
        lg: 'size-10 text-[length:var(--font-size-body)]',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

// GLOBAL UI: 사용자 표시만 담당하며, 실제 사용자 메뉴 동작은 widgets에서 조합합니다.
export const Avatar = forwardRef(function Avatar({ className, size, ...props }, ref) {
  return <span ref={ref} className={cn(avatarVariants({ size }), className)} {...props} />;
});

export { avatarVariants };
