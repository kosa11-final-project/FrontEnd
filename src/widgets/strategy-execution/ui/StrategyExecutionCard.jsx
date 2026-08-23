import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'reicon-react';
import {
  getBlockedActionCount,
  getRepresentativeKpis,
  formatKpiValue,
  StrategyActionStepProgress,
  StrategyActionTypeBadge,
  StrategyProductImage,
  StrategyStatusBadge,
  StrategySyncStatus,
} from '@/entities/strategy';
import { cn } from '@/shared/lib/cn';
import { Button, Card, Icon } from '@/shared/ui';

const actionCardToneClasses = Object.freeze({
  REALLOCATION: {
    card: 'border-[color:color-mix(in_srgb,var(--primary)_55%,var(--border))] bg-[color:color-mix(in_srgb,var(--primary)_5%,var(--card))]',
    badge:
      'border-[color:color-mix(in_srgb,var(--primary)_42%,var(--border))] bg-[var(--primary-soft)] text-[color:var(--primary-strong)]',
    dot: 'bg-[var(--primary)]',
  },
  RT_TRANSFER: {
    card: 'border-[color:color-mix(in_srgb,var(--info)_55%,var(--border))] bg-[color:color-mix(in_srgb,var(--info)_6%,var(--card))]',
    badge:
      'border-[color:color-mix(in_srgb,var(--info)_42%,var(--border))] bg-[var(--info-soft)] text-[color:var(--info)]',
    dot: 'bg-[var(--info)]',
  },
  PRICE_DISCOUNT: {
    card: 'border-[color:color-mix(in_srgb,var(--warning)_62%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_8%,var(--card))]',
    badge:
      'border-[color:color-mix(in_srgb,var(--warning)_48%,var(--border))] bg-[var(--warning-soft)] text-[color:var(--chart-3)]',
    dot: 'bg-[var(--warning)]',
  },
  CHANNEL_EXPANSION: {
    card: 'border-[color:color-mix(in_srgb,var(--chart-4)_55%,var(--border))] bg-[color:color-mix(in_srgb,var(--chart-4)_6%,var(--card))]',
    badge:
      'border-[color:color-mix(in_srgb,var(--chart-4)_42%,var(--border))] bg-[color:color-mix(in_srgb,var(--chart-4)_10%,var(--card))] text-[color:var(--chart-4)]',
    dot: 'bg-[var(--chart-4)]',
  },
  CHANNEL_CONCENTRATION: {
    card: 'border-[var(--border-strong)] bg-[var(--surface-subtle)]',
    badge: 'border-[var(--border-strong)] bg-[var(--card)] text-[color:var(--text-body)]',
    dot: 'bg-[var(--text-body)]',
  },
});

const defaultActionCardToneClasses = Object.freeze({
  card: 'border-[var(--border)] bg-[var(--card)]',
  badge: '',
  dot: 'bg-[var(--primary)]',
});

export function StrategyExecutionCard({ strategy }) {
  const blocked = getBlockedActionCount(strategy.actions);
  const representativeKpis = getRepresentativeKpis(strategy.actions);

  return (
    <Card
      asChild
      padding="none"
      className="overflow-hidden shadow-[var(--shadow-panel)] transition-shadow hover:shadow-[var(--shadow-panel)]"
    >
      <article aria-labelledby={`${strategy.id}-title`}>
        <header className="bg-[linear-gradient(180deg,var(--surface-subtle),var(--card))] p-4 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <StrategyProductImage
              src={strategy.product.imageUrl}
              alt={`${strategy.product.name} 상품 이미지`}
              size="lg"
              className="size-20 sm:size-24"
            />
            <div className="min-w-0 flex-1 sm:pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <StrategyStatusBadge status={strategy.status} />
                <span className="rounded-[var(--radius-control)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
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
                className="mt-2 max-w-3xl text-[length:var(--font-size-headline2)] font-bold leading-[var(--line-height-heading)] text-[color:var(--text-heading)]"
              >
                {strategy.product.name}
              </h2>
              <p className="mt-1 text-[length:var(--font-size-body-sm)] font-medium text-[color:var(--text-muted)]">
                {strategy.product.sku}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:max-w-64 sm:justify-end">
              {strategy.actions.map((action) => (
                <StrategyActionTypeBadge key={action.id} type={action.type} compact />
              ))}
              {!strategy.actions.length ? (
                <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">액션 없음</span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="grid gap-4 bg-[var(--card)] p-4 sm:p-5 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
          <section aria-label="전략 진행 상황" className="flex h-full min-w-0 flex-col">
            <h3 className="mb-2 text-[length:var(--font-size-body-sm)] font-bold text-[color:var(--text-heading)]">
              전략 진행 상황
            </h3>
            <div className="grid min-h-28 flex-1 items-center rounded-[var(--radius-panel)] border border-[var(--border)] bg-[linear-gradient(135deg,var(--card),var(--surface-subtle))] p-4 shadow-[var(--shadow-soft)]">
              <StrategyActionStepProgress actions={strategy.actions} />
            </div>
          </section>

          <section aria-label="주요 전략 지표" className="flex h-full min-w-0 flex-col">
            <h3 className="mb-2 text-[length:var(--font-size-body-sm)] font-bold text-[color:var(--text-heading)]">
              주요 전략 지표
            </h3>
            <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
              {representativeKpis.map(({ actionId, type, target, kpi }) => {
                const tone = actionCardToneClasses[type] ?? defaultActionCardToneClasses;
                return (
                  <div
                    key={actionId}
                    data-action-type={type}
                    className={cn(
                      'group flex h-full min-h-28 min-w-0 flex-col rounded-[var(--radius-panel)] border p-3 shadow-[var(--shadow-soft)] transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)]',
                      tone.card,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <StrategyActionTypeBadge type={type} compact className={tone.badge} />
                      <span className={cn('size-2 rounded-full opacity-80', tone.dot)} aria-hidden="true" />
                    </div>
                    <strong className="mt-auto text-[length:var(--font-size-headline2)] text-[color:var(--text-heading)]">
                      {formatKpiValue(kpi)}
                    </strong>
                    <p
                      className="mt-0.5 line-clamp-1 text-[length:var(--font-size-meta)] leading-[var(--line-height-body)] text-[color:var(--text-muted)]"
                      title={target}
                    >
                      {kpi?.label ?? '성과 미수집'} · {target}
                    </p>
                  </div>
                );
              })}
              {!representativeKpis.length ? (
                <div className="grid min-h-28 place-items-center rounded-[var(--radius-panel)] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-center text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)] sm:col-span-2">
                  표시할 액션 성과가 없습니다.
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <footer className="flex flex-col gap-2 border-t border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <StrategySyncStatus lastSyncedAt={strategy.lastSyncedAt} />
          <Button asChild size="sm" className="w-full text-[color:var(--color-white)] sm:w-auto">
            <Link to={`/execution/${strategy.id}`}>
              상세 리포트 보기
              <Icon icon={ArrowRight} size={15} aria-hidden="true" />
            </Link>
          </Button>
        </footer>
      </article>
    </Card>
  );
}
