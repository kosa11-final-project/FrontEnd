import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'reicon-react';
import {
  getBlockedActionCount,
  getCompletedActionCount,
  getRepresentativeKpis,
  formatKpiValue,
  StrategyActionProgress,
  StrategyActionTypeBadge,
  StrategyProductImage,
  StrategyStatusBadge,
  StrategySyncStatus,
} from '@/entities/strategy';
import { Button, Card, Icon } from '@/shared/ui';

export function StrategyExecutionCard({ strategy }) {
  const completed = getCompletedActionCount(strategy.actions);
  const blocked = getBlockedActionCount(strategy.actions);
  const representativeKpis = getRepresentativeKpis(strategy.actions);
  const hasKnownActionStatus = strategy.actions.some((action) => action.status);
  return (
    <Card asChild padding="lg" className="shadow-[var(--shadow-soft)]">
      <article aria-labelledby={`${strategy.id}-title`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <StrategyProductImage src={strategy.product.imageUrl} alt={`${strategy.product.name} 상품 이미지`} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StrategyStatusBadge status={strategy.status} />
                <span className="text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
                  {strategy.number}
                </span>
                {blocked ? (
                  <span className="inline-flex items-center gap-1 text-[length:var(--font-size-meta)] font-semibold text-[color:var(--danger)]">
                    <Icon icon={AlertCircle} size={14} aria-hidden="true" />
                    차단 {blocked}건
                  </span>
                ) : null}
              </div>
              <h2
                id={`${strategy.id}-title`}
                className="mt-2 text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]"
              >
                {strategy.product.name}
              </h2>
              <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
                {strategy.product.sku}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {strategy.actions.map((action) => (
              <StrategyActionTypeBadge key={action.id} type={action.type} compact />
            ))}
            {!strategy.actions.length ? (
              <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">액션 없음</span>
            ) : null}
          </div>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] p-4">
            <div className="mb-3 flex items-center justify-between text-[length:var(--font-size-body-sm)]">
              <span>액션 완료</span>
              <strong
                className={hasKnownActionStatus ? 'text-[color:var(--text-heading)]' : 'text-[color:var(--text-muted)]'}
              >
                {hasKnownActionStatus ? `${completed} / ${strategy.actions.length}` : '미수집'}
              </strong>
            </div>
            <StrategyActionProgress value={strategy.progress} label="전략 전체 진행률" />
          </div>
          <div>
            <p className="mb-2 text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
              액션별 대표 KPI
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {representativeKpis.map(({ actionId, type, target, kpi }) => (
                <div key={actionId} className="min-w-0 rounded-[var(--radius-card)] bg-[var(--surface-subtle)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <StrategyActionTypeBadge type={type} compact />
                    <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                      {formatKpiValue(kpi)}
                    </strong>
                  </div>
                  <p
                    className="mt-1 truncate text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]"
                    title={target}
                  >
                    {kpi?.label ?? '성과 미수집'} · {target}
                  </p>
                </div>
              ))}
              {!representativeKpis.length ? (
                <p className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
                  표시할 액션 성과가 없습니다.
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <StrategySyncStatus lastSyncedAt={strategy.lastSyncedAt} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild size="sm" className="text-[color:var(--color-white)]">
              <Link to={`/execution/${strategy.id}`}>
                세부 내역 조회
                <Icon icon={ArrowRight} size={15} aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </article>
    </Card>
  );
}
