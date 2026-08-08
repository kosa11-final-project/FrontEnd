import { cva } from 'class-variance-authority';
import { Danger, InfoCircle, TickCircle, Warning } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { Icon } from './Icon.jsx';

const alertVariants = cva('flex items-start gap-3 rounded-[var(--radius-control)] border px-4 py-3', {
  variants: {
    variant: {
      good: 'border-[var(--good-soft)] bg-[var(--good-soft)] text-[color:var(--good)]',
      info: 'border-[var(--info-soft)] bg-[var(--info-soft)] text-[color:var(--info)]',
      warning: 'border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[color:var(--warning)]',
      danger: 'border-[var(--danger-soft)] bg-[var(--danger-soft)] text-[color:var(--danger)]',
    },
  },
  defaultVariants: { variant: 'info' },
});

const alertIcons = Object.freeze({ good: TickCircle, info: InfoCircle, warning: Warning, danger: Danger });

export function Alert({ variant = 'info', title, children, className, ...props }) {
  const IconComponent = alertIcons[variant] ?? alertIcons.info;
  return (
    <div
      role={variant === 'danger' || variant === 'warning' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon icon={IconComponent} size={18} aria-hidden="true" />
      <div className="min-w-0 text-[length:var(--font-size-body-sm)]">
        {title ? <strong className="block font-[var(--font-weight-bold)]">{title}</strong> : null}
        {children ? <div className={cn(title && 'mt-1', 'text-[color:var(--text-body)]')}>{children}</div> : null}
      </div>
    </div>
  );
}

export { alertVariants };
