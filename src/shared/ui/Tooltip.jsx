import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

export function TooltipProvider({ children }) {
  return <TooltipPrimitive.Provider delayDuration={250}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({ children }) {
  return <TooltipPrimitive.Root>{children}</TooltipPrimitive.Root>;
}

export function TooltipTrigger({ children, asChild = true }) {
  return <TooltipPrimitive.Trigger asChild={asChild}>{children}</TooltipPrimitive.Trigger>;
}

const tooltipContentVariants = cva('z-50 max-w-xs rounded-md px-3 py-2 text-[var(--font-size-meta)] leading-4 shadow-lg outline-none animate-in fade-in-0 zoom-in-95', {
  variants: {
    tone: {
      dark: 'bg-[var(--tooltip-bg)] text-[var(--tooltip-fg)]',
      light: 'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]',
    },
  },
  defaultVariants: { tone: 'dark' },
});

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
