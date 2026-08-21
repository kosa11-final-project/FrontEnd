import { AlertCircle } from 'reicon-react';
import { Badge, Card, Icon } from '@/shared/ui';
import { relationshipMeta } from '../model/strategy.js';
import { StrategyActionProgress } from './StrategyActionProgress.jsx';
import { StrategyActionTypeBadge } from './StrategyActionTypeBadge.jsx';
import { StrategyKpiGrid } from './StrategyKpiGrid.jsx';
import { StrategyStatusBadge } from './StrategyStatusBadge.jsx';

export function StrategyActionCard({ action, index, actionNames = {} }) {
  const relation = relationshipMeta[action.relationship];
  const isProblem = ['FAILED', 'BLOCKED'].includes(action.status);
  return (
    <Card asChild padding="md" className={isProblem ? 'border-[var(--danger)]' : 'shadow-[var(--shadow-soft)]'}>
      <article aria-labelledby={`${action.id}-title`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[color:var(--primary-strong)]">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StrategyActionTypeBadge type={action.type} />
                <Badge variant="neutral">{relation?.label ?? action.relationship ?? '관계 미수집'}</Badge>
                <StrategyStatusBadge status={action.status} scope="action" />
              </div>
              <h3
                id={`${action.id}-title`}
                className="mt-2 text-[length:var(--font-size-subtitle1)] font-bold text-[color:var(--text-heading)]"
              >
                {action.title}
              </h3>
              <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
                대상: {action.target || '미수집'}
              </p>
              {action.dependsOn?.length ? (
                <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                  선행 액션: {action.dependsOn.map((id) => actionNames[id] ?? id).join(', ')}
                </p>
              ) : null}
            </div>
          </div>
          <div className="w-full shrink-0 sm:w-44">
            <StrategyActionProgress
              value={action.progress}
              compact
              tone={isProblem ? 'danger' : action.status === 'PARTIAL' ? 'warning' : 'primary'}
              label="액션 진행률"
            />
          </div>
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
        <div className="mt-4">
          {action.kpis?.length ? (
            <StrategyKpiGrid kpis={action.kpis} />
          ) : (
            <p className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
              액션 성과가 아직 수집되지 않았습니다.
            </p>
          )}
        </div>
      </article>
    </Card>
  );
}
