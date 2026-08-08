import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const tableVariants = cva('w-full overflow-x-auto', {
  variants: {
    density: {
      compact: 'text-[var(--font-size-meta)]',
      default: 'text-[var(--font-size-body-sm)]',
      comfortable: 'text-[var(--font-size-body)]',
    },
    surface: {
      plain: '',
      bordered: 'rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)]',
    },
  },
  defaultVariants: { density: 'default', surface: 'plain' },
});

const tableElementVariants = cva('w-full border-collapse', {
  variants: {
    layout: {
      auto: 'table-auto',
      fixed: 'table-fixed',
    },
  },
  defaultVariants: { layout: 'auto' },
});

export function Table({ className, density, surface, ...props }) {
  return <div className={cn(tableVariants({ density, surface }), className)} {...props} />;
}

export function TableElement({ className, layout, ...props }) {
  return <table className={cn(tableElementVariants({ layout }), className)} {...props} />;
}

export { tableElementVariants, tableVariants };
