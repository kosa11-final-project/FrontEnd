import { cn } from '@/shared/lib/cn';

export function StrategyActionProgress({ value, label = '진행률', compact = false, tone = 'primary' }) {
  const numericValue = Number(value);
  const hasValue = value !== null && value !== undefined && Number.isFinite(numericValue);
  const safeValue = hasValue ? Math.min(100, Math.max(0, numericValue)) : null;
  const barTone =
    tone === 'danger'
      ? 'bg-[var(--danger)]'
      : tone === 'warning'
        ? 'bg-[var(--warning)]'
        : tone === 'accent'
          ? 'bg-[var(--chart-4)]'
          : 'bg-[var(--primary)]';
  return (
    <div className={cn('min-w-0', compact ? 'space-y-1' : 'space-y-2')}>
      <div className="flex items-center justify-between gap-3 text-[length:var(--font-size-meta)]">
        <span className="text-[color:var(--text-muted)]">{label}</span>
        <strong className={hasValue ? 'text-[color:var(--text-heading)]' : 'text-[color:var(--text-muted)]'}>
          {hasValue ? `${safeValue}%` : '미수집'}
        </strong>
      </div>
      <div
        className={cn('overflow-hidden rounded-full bg-[var(--border)]', compact ? 'h-1.5' : 'h-2.5')}
        role={hasValue ? 'progressbar' : undefined}
        aria-label={hasValue ? label : undefined}
        aria-valuemin={hasValue ? 0 : undefined}
        aria-valuemax={hasValue ? 100 : undefined}
        aria-valuenow={hasValue ? safeValue : undefined}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            hasValue ? barTone : 'bg-transparent',
            safeValue > 0 && 'min-w-1.5',
          )}
          style={{ width: hasValue ? `${safeValue}%` : '0%' }}
        />
      </div>
    </div>
  );
}
