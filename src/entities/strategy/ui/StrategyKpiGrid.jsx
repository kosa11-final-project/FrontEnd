import { formatKpiValue } from '../model/strategy.js';

export function StrategyKpiGrid({ kpis = [], compact = false }) {
  return (
    <dl className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-3 xl:grid-cols-3'}>
      {kpis.map((kpi) => {
        const missing = kpi.value === null || kpi.value === undefined;
        return (
          <div
            key={kpi.label}
            className="min-w-0 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] p-3"
          >
            <dt
              className="truncate text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]"
              title={kpi.label}
            >
              {kpi.label}
            </dt>
            <dd
              className={
                missing
                  ? 'mt-1 font-semibold text-[color:var(--text-muted)]'
                  : 'mt-1 font-bold text-[color:var(--text-heading)]'
              }
            >
              {formatKpiValue(kpi)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
