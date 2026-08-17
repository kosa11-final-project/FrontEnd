import { useId, useState } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const tabsVariants = cva('flex flex-col', {
  variants: {
    orientation: {
      horizontal: '',
      vertical: 'flex-row',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

const tabsListVariants = cva('flex items-center gap-1', {
  variants: {
    size: {
      sm: 'h-8',
      md: 'h-9',
      lg: 'h-10',
    },
  },
  defaultVariants: { size: 'md' },
});

const tabsTriggerVariants = cva(
  'relative border-b-2 border-transparent px-2 font-semibold text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
  {
    variants: {
      size: {
        sm: 'h-8 text-[length:var(--font-size-meta)]',
        md: 'h-9 text-[length:var(--font-size-body-sm)]',
        lg: 'h-10 text-[length:var(--font-size-body)]',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export function Tabs({ value, defaultValue, onValueChange, children, className, orientation }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeValue = value ?? internalValue;
  const setValue = (nextValue) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <div className={cn(tabsVariants({ orientation }), className)} data-tabs-value={activeValue}>
      {typeof children === 'function' ? children({ value: activeValue, setValue }) : children}
    </div>
  );
}

export function TabsList({ children, className, size, ...props }) {
  return (
    <div role="tablist" className={cn(tabsListVariants({ size }), className)} {...props}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, activeValue, onSelect, onKeyDown, children, className, size, ...props }) {
  const id = useId();
  const active = activeValue === value;

  const handleKeyDown = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const navigationKeys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!navigationKeys.includes(event.key)) return;

    const triggers = Array.from(event.currentTarget.parentElement?.querySelectorAll('[role="tab"]') || []);
    if (!triggers.length) return;

    const currentIndex = triggers.indexOf(event.currentTarget);
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? triggers.length - 1
          : (currentIndex + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + triggers.length) %
            triggers.length;
    const nextTrigger = triggers[nextIndex];
    const nextValue = nextTrigger?.dataset.value;
    if (!nextTrigger || !nextValue) return;

    event.preventDefault();
    nextTrigger.focus();
    onSelect?.(nextValue);
  };

  return (
    <button
      id={`${id}-trigger`}
      data-value={value}
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      className={cn(
        tabsTriggerVariants({ size }),
        active && 'border-[var(--primary)] text-[color:var(--primary)]',
        className,
      )}
      onClick={() => onSelect?.(value)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </button>
  );
}

export { tabsListVariants, tabsTriggerVariants, tabsVariants };
