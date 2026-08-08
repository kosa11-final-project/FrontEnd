import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';
import { Card } from './Card.jsx';
import { Icon } from './Icon.jsx';

const metricIconVariants = cva('grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)]', {
  variants: {
    tone: {
      neutral: 'bg-[var(--surface-subtle)] text-[color:var(--text-body)]',
      good: 'bg-[var(--good-soft)] text-[color:var(--good)]',
      info: 'bg-[var(--info-soft)] text-[color:var(--info)]',
      warning: 'bg-[var(--warning-soft)] text-[color:var(--warning)]',
      danger: 'bg-[var(--danger-soft)] text-[color:var(--danger)]',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

const metricValueVariants = cva(
  'mt-4 block tabular-nums text-[length:var(--font-size-display)] font-[var(--font-weight-bold)] leading-none text-[color:var(--text-heading)]',
  {
    variants: {
      tone: {
        neutral: '',
        good: 'text-[color:var(--good)]',
        info: 'text-[color:var(--info)]',
        warning: 'text-[color:var(--warning)]',
        danger: 'text-[color:var(--danger)]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export const MetricCard = forwardRef(function MetricCard(
  { className, label, value, helper, icon, tone = 'neutral', selected = false, onClick, ...props },
  ref,
) {
  const content = (
    <>
      <div className="flex items-center gap-2">
        {icon && (
          <span className={metricIconVariants({ tone })}>
            <Icon icon={icon} size={16} />
          </span>
        )}
        <span className="text-[length:var(--font-size-body-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-muted)]">
          {label}
        </span>
      </div>
      <strong className={metricValueVariants({ tone })}>{value}</strong>
      {helper && (
        <span className="mt-2 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">{helper}</span>
      )}
    </>
  );

  if (onClick) {
    return (
      <Card
        ref={ref}
        asChild
        variant={selected ? 'selected' : 'default'}
        padding="md"
        className={cn(
          'transition-[border-color,box-shadow,transform] duration-[var(--motion-fast)] hover:-translate-y-px hover:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]',
          className,
        )}
        {...props}
      >
        <button type="button" aria-pressed={selected} onClick={onClick} className="block w-full text-left">
          {content}
        </button>
      </Card>
    );
  }

  return (
    <Card ref={ref} variant={selected ? 'selected' : 'default'} padding="md" className={className} {...props}>
      {content}
    </Card>
  );
});

export { metricIconVariants, metricValueVariants };
