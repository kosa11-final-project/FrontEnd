import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, ChevronDown, ChevronUp, InfoCircle } from 'reicon-react';
import {
  getBlockedActionCount,
  isDisplayableStrategyNumber,
  StrategyActionStepProgress,
  StrategyActionTypeBadge,
  StrategyProductImage,
  StrategyStatusBadge,
  StrategySyncStatus,
} from '@/entities/strategy';
import { formatPercent, formatQuantity } from '@/shared/lib/format';
import { Badge, Button, Card, Icon, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui';

const salesResultPattern =
  /실제\s*판매(?:량)?\s*([\d,.]+)\s*\/\s*목표(?:\s*판매(?:량)?)?\s*([\d,.]+)(?:\s*\(달성률\s*([\d,.]+)%\))?/;

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(String(value).replaceAll(',', ''));
  return Number.isFinite(number) ? number : null;
}

export function getStrategySalesPerformance(strategy) {
  const match = strategy.resultSummary?.match(salesResultPattern);
  const actual = toFiniteNumber(match?.[1]) ?? toFiniteNumber(strategy.performance?.actualSalesQuantity);
  const target = toFiniteNumber(match?.[2]);
  const providedRate = toFiniteNumber(match?.[3]);
  const achievementRate = providedRate ?? (actual !== null && target > 0 ? (actual / target) * 100 : null);
  const difference = actual !== null && target !== null ? actual - target : null;

  return {
    actual,
    target,
    achievementRate,
    difference,
    achieved: target > 0 && difference !== null && difference >= 0,
  };
}

function StrategySalesPerformance({ strategy }) {
  const performance = getStrategySalesPerformance(strategy);
  const differenceQuantity = formatQuantity(Math.abs(performance.difference));
  const comparisonText =
    performance.difference === null
      ? '목표 데이터가 수집되면 비교할 수 있어요'
      : performance.difference > 0
        ? `목표보다 ${differenceQuantity} 더 판매했어요`
        : performance.difference < 0
          ? `목표보다 ${differenceQuantity} 덜 판매했어요`
          : '목표 판매량을 정확히 달성했어요';
  const hasTargetComparison = performance.difference !== null && performance.target > 0;

  return (
    <section
      aria-label="판매 성과 요약"
      className={`min-w-0 rounded-[var(--radius-card)] px-3 py-2.5 ${
        performance.achieved ? 'bg-[color-mix(in_srgb,var(--good-soft)_42%,var(--card))]' : 'bg-[var(--surface-subtle)]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">판매 성과</strong>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <button
                  type="button"
                  aria-label="판매 성과 비교 설명"
                  aria-description={comparisonText}
                  onClick={(event) => event.stopPropagation()}
                  className="grid size-5 place-items-center rounded-full text-[color:var(--text-muted)] hover:text-[color:var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <Icon icon={InfoCircle} size={13} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent tone="light" side="top" className="max-w-[240px] leading-relaxed">
                {comparisonText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {hasTargetComparison ? (
          <Badge variant={performance.achieved ? 'good' : 'warning'} size="sm">
            {performance.achieved ? '목표 달성' : '목표 미달'}
          </Badge>
        ) : null}
      </div>

      <dl className="mt-1 grid grid-cols-3">
        <div className="min-w-0 pr-3">
          <dt className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">실적</dt>
          <dd className="mt-0.5 truncate text-[length:var(--font-size-subtitle2)] font-bold tabular-nums text-[color:var(--text-heading)]">
            {formatQuantity(performance.actual, { fallback: '미수집' })}
          </dd>
        </div>
        <div className="min-w-0 border-l border-[color:color-mix(in_srgb,var(--border)_65%,transparent)] px-3">
          <dt className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">목표</dt>
          <dd className="mt-0.5 truncate text-[length:var(--font-size-subtitle2)] font-bold tabular-nums text-[color:var(--text-heading)]">
            {formatQuantity(performance.target, { fallback: '미수집' })}
          </dd>
        </div>
        <div className="min-w-0 border-l border-[color:color-mix(in_srgb,var(--border)_65%,transparent)] pl-3">
          <dt className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">달성률</dt>
          <dd
            className={`mt-0.5 truncate text-[length:var(--font-size-subtitle2)] font-bold tabular-nums ${
              hasTargetComparison
                ? performance.achieved
                  ? 'text-[color:var(--good)]'
                  : 'text-[color:var(--warning)]'
                : 'text-[color:var(--text-heading)]'
            }`}
          >
            {formatPercent(performance.achievementRate, { fallback: '미수집', maximumFractionDigits: 1 })}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function StrategyExecutionCard({ strategy }) {
  const [expanded, setExpanded] = useState(false);
  const progressId = useId();
  const blocked = getBlockedActionCount(strategy.actions);
  const actionTypes = [...new Set(strategy.actions.map((action) => action.type).filter(Boolean))];
  const detailPath = `/execution/${strategy.id}`;
  const toggleExpanded = () => setExpanded((value) => !value);
  const handleSummaryClick = () => {
    if (window.getSelection()?.toString()) return;
    toggleExpanded();
  };
  const handleSummaryKeyDown = (event) => {
    if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    toggleExpanded();
  };

  return (
    <Card
      asChild
      padding="none"
      className="overflow-hidden shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-panel)]"
    >
      <article aria-labelledby={`${strategy.id}-title`}>
        <header
          role="button"
          tabIndex={0}
          aria-label={`${strategy.product.name} 실행 단계 ${expanded ? '닫기' : '보기'}`}
          aria-expanded={expanded}
          aria-controls={progressId}
          onClick={handleSummaryClick}
          onKeyDown={handleSummaryKeyDown}
          className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 pb-2 pt-2 transition-colors hover:bg-[color:color-mix(in_srgb,var(--surface-subtle)_45%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)_auto] lg:items-stretch"
        >
          <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
            <StrategyProductImage
              src={strategy.product.imageUrl}
              alt={`${strategy.product.name} 상품 이미지`}
              size="lg"
              className="size-12 shrink-0 sm:size-14"
            />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <StrategyStatusBadge status={strategy.status} size="sm" />
                {isDisplayableStrategyNumber(strategy.number) ? (
                  <span
                    className="max-w-full truncate rounded-[var(--radius-control)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-body)]"
                    title={strategy.number}
                  >
                    {strategy.number}
                  </span>
                ) : null}
                {blocked ? (
                  <span className="inline-flex items-center gap-1 text-[length:var(--font-size-meta)] font-semibold text-[color:var(--danger)]">
                    <Icon icon={AlertCircle} size={13} aria-hidden="true" />
                    차단 {blocked}건
                  </span>
                ) : null}
              </div>
              <h2
                id={`${strategy.id}-title`}
                className="mt-1 truncate text-[length:var(--font-size-subtitle1)] font-bold text-[color:var(--text-heading)]"
                title={strategy.product.name}
              >
                {strategy.product.name}
              </h2>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="truncate text-[length:var(--font-size-meta)] font-medium text-[color:var(--text-body)]">
                  {strategy.product.sku}
                </span>
                {actionTypes.map((type) => (
                  <StrategyActionTypeBadge key={type} type={type} compact />
                ))}
                {!actionTypes.length ? (
                  <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-body)]">
                    전략 옵션 없음
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:pl-1">
            <StrategySalesPerformance strategy={strategy} />
          </div>

          <span
            className="col-start-2 row-start-1 grid size-7 self-center place-items-center rounded-full text-[color:var(--text-body)] lg:col-start-3"
            aria-hidden="true"
          >
            <Icon icon={expanded ? ChevronUp : ChevronDown} size={17} />
          </span>
        </header>

        {expanded ? (
          <section
            id={progressId}
            aria-label={`${strategy.product.name} 실행 단계`}
            className="border-t border-[#DCE4DF]"
          >
            <StrategyActionStepProgress actions={strategy.actions} detailHref={detailPath} />
          </section>
        ) : null}

        <footer className="flex items-center justify-between gap-3 border-t border-[#DCE4DF] bg-white px-3 py-2">
          <StrategySyncStatus lastSyncedAt={strategy.lastSyncedAt} />
          <Button asChild size="md">
            <Link to={detailPath}>
              상세 리포트
              <Icon icon={ArrowRight} size={16} aria-hidden="true" />
            </Link>
          </Button>
        </footer>
      </article>
    </Card>
  );
}
