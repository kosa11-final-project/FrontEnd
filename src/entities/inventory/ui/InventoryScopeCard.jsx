import { memo } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';
import { Badge, Card, Icon } from '@/shared/ui';
import { InventoryStatusBadge } from './InventoryStatusBadge.jsx';

const scopeCardIconVariants = cva('grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)]', {
  variants: {
    accent: {
      main: 'bg-[var(--primary-soft)] text-[color:var(--primary-strong)]',
      mint: 'bg-[var(--color-sub-mint-soft)] text-[color:var(--color-sub-mint)]',
      cyan: 'bg-[var(--info-soft)] text-[color:var(--info)]',
      orange: 'bg-[var(--warning-soft)] text-[color:var(--warning)]',
    },
  },
  defaultVariants: { accent: 'main' },
});

const metricToneClasses = Object.freeze({
  neutral: 'text-[color:var(--text-heading)]',
  good: 'text-[color:var(--good)]',
  info: 'text-[color:var(--info)]',
  warning: 'text-[color:var(--warning)]',
  danger: 'text-[color:var(--danger)]',
});

export const InventoryScopeCard = memo(function InventoryScopeCard({
  title,
  eyebrow,
  icon,
  accent = 'main',
  selected = false,
  status,
  metrics = [],
  onClick,
  className,
  ...props
}) {
  const content = (
    <>
      <header className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className={scopeCardIconVariants({ accent })}>
            <Icon icon={icon} size={17} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 break-words text-[length:var(--font-size-body-sm)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
            {title}
          </h3>
          {eyebrow && (
            <p className="mt-1 line-clamp-2 break-words text-[0.625rem] font-[var(--font-weight-bold)] uppercase tracking-[0.12em] text-[color:var(--text-label)]">
              {eyebrow}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status && <InventoryStatusBadge status={status} />}
          {selected && <Badge variant="neutral">선택됨</Badge>}
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-x-2 border-t border-[var(--border)] pt-3 sm:grid-cols-4">
        {metrics.map(({ label, value, tone = 'neutral' }) => (
          <div key={label} className="min-w-0 border-r border-[var(--border)] pr-1 last:border-r-0 last:pr-0">
            <dt className="break-words text-[0.5625rem] text-[color:var(--text-muted)]">{label}</dt>
            <dd
              className={cn(
                'mt-1 break-words tabular-nums text-[0.8125rem] font-[var(--font-weight-bold)]',
                metricToneClasses[tone] ?? metricToneClasses.neutral,
              )}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );

  const cardClassName = cn(
    'min-w-0',
    onClick &&
      'cursor-pointer text-left transition-[border-color,box-shadow,transform] duration-[var(--motion-fast)] hover:-translate-y-px hover:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]',
    className,
  );

  if (onClick) {
    return (
      <Card asChild variant={selected ? 'selected' : 'default'} padding="md" className={cardClassName} {...props}>
        <button type="button" aria-pressed={selected} onClick={onClick} className="block w-full text-left">
          {content}
        </button>
      </Card>
    );
  }

  return (
    <Card variant={selected ? 'selected' : 'default'} padding="md" className={cardClassName} {...props}>
      {content}
    </Card>
  );
});

export { scopeCardIconVariants };
