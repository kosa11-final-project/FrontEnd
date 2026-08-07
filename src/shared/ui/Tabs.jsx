import { useId, useState } from 'react';
import { cn } from '@/shared/lib/cn';

export function Tabs({ value, defaultValue, onValueChange, children, className }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeValue = value ?? internalValue;
  const setValue = (nextValue) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <div className={cn('flex flex-col', className)} data-tabs-value={activeValue}>
      {typeof children === 'function' ? children({ value: activeValue, setValue }) : children}
    </div>
  );
}

export function TabsList({ children, className, ...props }) {
  return <div role="tablist" className={cn('flex items-center gap-1', className)} {...props}>{children}</div>;
}

export function TabsTrigger({ value, activeValue, onSelect, children, className, ...props }) {
  const id = useId();
  const active = activeValue === value;
  return (
    <button
      id={`${id}-trigger`}
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        'relative h-9 border-b-2 border-transparent px-2 text-xs font-bold text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        active && 'border-[var(--primary)] text-[var(--primary)]',
        className,
      )}
      onClick={() => onSelect?.(value)}
      {...props}
    >
      {children}
    </button>
  );
}
