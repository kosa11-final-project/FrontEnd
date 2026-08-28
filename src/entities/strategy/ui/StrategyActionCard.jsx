import { AlertCircle } from 'reicon-react';
import { Badge, Card, Icon } from '@/shared/ui';
import { actionTypeMeta, formatKpiValue, relationshipMeta } from '../model/strategy.js';
import { StrategyActionProgress } from './StrategyActionProgress.jsx';
import { StrategyActionTypeBadge } from './StrategyActionTypeBadge.jsx';
import { StrategyKpiGrid } from './StrategyKpiGrid.jsx';
import { StrategyStatusBadge } from './StrategyStatusBadge.jsx';

export function StrategyActionCard({ action, index, actionNames = {} }) {
  const relation = relationshipMeta[action.relationship];
  const isProblem = ['FAILED', 'BLOCKED'].includes(action.status);
  const typeLabel = actionTypeMeta[action.type]?.label;
  const displayTitle =
    !action.title || action.title === action.type ? (typeLabel ?? action.type ?? '전략명 미수집') : action.title;
  const requestQuantityIndex = action.kpis?.findIndex((kpi) => kpi.label?.replaceAll(' ', '') === '요청수량') ?? -1;
  const requestQuantityKpi = requestQuantityIndex >= 0 ? action.kpis[requestQuantityIndex] : null;
  const remainingKpis = action.kpis?.filter((_, index) => index !== requestQuantityIndex) ?? [];
  return (
    <Card
      asChild
      padding="md"
      className={isProblem ? 'h-full border-[var(--danger)]' : 'h-full shadow-[var(--shadow-soft)]'}
    >
      <article aria-labelledby={`${action.id}-title`} className="flex flex-col">
        <header className="flex min-w-0 items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[color:var(--primary-strong)]">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <StrategyActionTypeBadge type={action.type} />
              <Badge variant="neutral">{relation?.label ?? action.relationship ?? '관계 미수집'}</Badge>
              <StrategyStatusBadge status={action.status} scope="action" />
            </div>
            <h3
              id={`${action.id}-title`}
              className="mt-2 line-clamp-2 text-[length:var(--font-size-subtitle1)] font-bold text-[color:var(--text-heading)]"
              title={displayTitle}
            >
              {displayTitle}
            </h3>
            <p
              className="mt-1 line-clamp-2 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]"
              title={action.target}
            >
              대상: {action.target || '미수집'}
            </p>
            {action.dependsOn?.length ? (
              <p className="mt-1 line-clamp-2 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                선행 전략: {action.dependsOn.map((id) => actionNames[id] ?? id).join(', ')}
              </p>
            ) : null}
          </div>
          {requestQuantityKpi ? (
            <dl
              aria-label="요청 수량"
              className="shrink-0 border-l border-[var(--border)] pl-3 text-right tabular-nums"
            >
              <dt className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                {requestQuantityKpi.label}
              </dt>
              <dd className="mt-1 font-bold text-[color:var(--text-heading)]">{formatKpiValue(requestQuantityKpi)}</dd>
            </dl>
          ) : null}
        </header>
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <StrategyActionProgress
            value={action.progress}
            compact
            tone={isProblem ? 'danger' : action.status === 'PARTIAL' ? 'warning' : 'primary'}
            label="전략 진행률"
          />
        </div>
        {action.note ? (
          <div className="mt-4 flex gap-2 rounded-[var(--radius-card)] bg-[var(--warning-soft)] p-3 text-[length:var(--font-size-body-sm)] text-[color:var(--text-body)]">
            <Icon
              icon={AlertCircle}
              size={16}
              className="mt-0.5 shrink-0 text-[color:var(--warning)]"
              aria-hidden="true"
            />
            <span>{action.note}</span>
          </div>
        ) : null}
        {remainingKpis.length || !requestQuantityKpi ? (
          <div className="mt-auto pt-4">
            {remainingKpis.length ? (
              <StrategyKpiGrid kpis={remainingKpis} compact />
            ) : (
              <p className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
                전략 성과가 아직 수집되지 않았습니다.
              </p>
            )}
          </div>
        ) : null}
      </article>
    </Card>
  );
}
