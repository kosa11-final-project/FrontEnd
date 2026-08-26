import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold leading-normal tracking-tight transition-colors',
  {
    variants: {
      variant: {
        neutral: 'border-[#E5E7EB] bg-[#F9FAFB] text-gray-700',
        outline: 'border-[#E5E7EB] bg-white text-gray-700',
        good: 'border-[#B7ECCF] bg-[#DAF7E9] text-[#166534]',
        success: 'border-[#B7ECCF] bg-[#DAF7E9] text-[#166534]',
        // The original cyan text is too light on the soft cyan surface at the
        // 11px badge size. Keep the brand surface while using a WCAG AA-safe
        // text color for normal-sized labels.
        info: 'border-[#A6E8F6] bg-[#CFF4FC] text-[#00627F]',
        warning: 'border-[#FDE68A] bg-[#FFF8E6] text-[#B45309]',
        danger: 'border-[#FECACA] bg-[#FEE4E2] text-[#B91C1C]',
      },
      size: {
        sm: 'px-2 py-0.2 text-[10px]',
        md: 'px-2.5 py-0.5 text-[11px]',
        lg: 'px-3 py-1 text-xs',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'md' },
  },
);

export function Badge({ className, variant, size, ...props }) {
  return <span className={cn(badgeVariants({ variant, size, className }))} {...props} />;
}

export { badgeVariants };
