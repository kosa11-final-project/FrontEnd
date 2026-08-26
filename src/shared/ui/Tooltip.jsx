import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

export function TooltipProvider({ children }) {
  return <TooltipPrimitive.Provider delayDuration={250}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({ children, ...props }) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>;
}

export function TooltipTrigger({ children, asChild = true }) {
  return <TooltipPrimitive.Trigger asChild={asChild}>{children}</TooltipPrimitive.Trigger>;
}

const tooltipContentVariants = cva(
  'z-50 max-w-xs rounded-[var(--radius-control)] px-3 py-2 text-[length:var(--font-size-meta)] leading-[var(--line-height-meta)] shadow-[var(--shadow-soft)] outline-none animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      tone: {
        dark: 'bg-[var(--tooltip-bg)] text-[color:var(--tooltip-fg)]',
        light: 'border border-[var(--border)] bg-[var(--card)] text-[color:var(--foreground)]',
      },
    },
    defaultVariants: { tone: 'dark' },
  },
);

export function TooltipContent({ className, sideOffset = 6, children, tone, ...props }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(tooltipContentVariants({ tone }), className)}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-[var(--tooltip-bg)]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { tooltipContentVariants };
