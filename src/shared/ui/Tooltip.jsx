import * as TooltipPrimitive from '@radix-ui/react-tooltip';
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

export function TooltipContent({ className, sideOffset = 6, children, ...props }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-xs rounded-md bg-[var(--tooltip-bg)] px-3 py-2 text-[11px] leading-4 text-[var(--tooltip-fg)] shadow-lg outline-none animate-in fade-in-0 zoom-in-95',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-[var(--tooltip-bg)]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
