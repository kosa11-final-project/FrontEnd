import { AlertTriangle, Clock, Danger, InfoCircle, Package, Warning } from 'reicon-react';
import { formatDate, formatNumber, formatPercent, formatQuantity } from '@/shared/lib/format';
import { Alert, Icon, MetricCard, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui';

function MetricLabel({ label, calculation }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`${label} 계산 기준`}
              className="grid size-5 place-items-center rounded-full text-[color:var(--text-muted)] outline-none transition-colors hover:bg-[var(--surface-subtle)] hover:text-[color:var(--text-heading)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <Icon icon={InfoCircle} size={13} aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent tone="light" side="top" className="max-w-[320px] leading-relaxed">
            {calculation}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}

function getChangeRate(start, end) {
  if (!start) return null;
  return ((end - start) / start) * 100;
}

function formatNetChange(start, end) {
  const difference = end - start;
  if (difference === 0) return '변화 없음';
  return `${difference < 0 ? '↓' : '↑'} ${formatQuantity(Math.abs(difference))}`;
}

function getRiskRatio(point) {
  if (!point?.totalStockQty) return null;
  return ((point.riskStockQty ?? 0) / point.totalStockQty) * 100;
}

function getRiskSkuCount(point) {
  return (point?.criticalSkuCount ?? 0) + (point?.warningSkuCount ?? 0);
}

function buildRiskInsight(firstPoint, lastPoint) {
  const totalChange = lastPoint.riskStockQty - firstPoint.riskStockQty;
  const startRatio = getRiskRatio(firstPoint);
  const endRatio = getRiskRatio(lastPoint);
  const changeText =
    totalChange === 0
      ? '기간 시작과 동일합니다.'
      : `기간 시작보다 ${formatQuantity(Math.abs(totalChange))} ${totalChange < 0 ? '순감했습니다.' : '순증했습니다.'}`;
  const ratioText =
    Number.isFinite(startRatio) && Number.isFinite(endRatio)
      ? `위험재고 비율은 ${formatPercent(startRatio)}에서 ${formatPercent(endRatio)}로 변했습니다.`
      : '위험재고 비율은 API 연결 후 함께 표시됩니다.';

  return {
    title: `기간 종료 위험재고는 ${formatQuantity(lastPoint.riskStockQty)}로, ${changeText}`,
    description: `${ratioText} 신규 입고·판매·이동·폐기가 모두 반영된 전체 재고 상태이며 AI 전략만의 성과를 의미하지 않습니다.`,
  };
}

export function InventoryStatisticsSummary({ trend, scopeName = '전체' }) {
  const firstPoint = trend[0] ?? {};
  const lastPoint = trend.at(-1) ?? {};
  const startRiskStockQty = firstPoint.riskStockQty ?? 0;
  const endRiskStockQty = lastPoint.riskStockQty ?? 0;
  const riskChangeRate = getChangeRate(startRiskStockQty, endRiskStockQty);
  const startRiskRatio = getRiskRatio(firstPoint);
  const endRiskRatio = getRiskRatio(lastPoint);
  const startRiskSkuCount = getRiskSkuCount(firstPoint);
  const endRiskSkuCount = getRiskSkuCount(lastPoint);
  const riskSkuDifference = endRiskSkuCount - startRiskSkuCount;
  const riskSkuChangeText =
    riskSkuDifference === 0
      ? '변화 없음'
      : `${formatNumber(Math.abs(riskSkuDifference))}종 ${riskSkuDifference < 0 ? '감소' : '증가'}`;
  const insight = buildRiskInsight(firstPoint, lastPoint);

  const metrics = [
    {
      label: (
        <MetricLabel
          label="기간 시작 위험재고"
          calculation="선택 기간 안에서 가장 먼저 생성된 정상 스냅샷의 CRITICAL 재고와 WARNING 재고를 더한 값입니다."
        />
      ),
      id: 'start-risk-stock',
      value: formatQuantity(startRiskStockQty),
      helper: formatDate(firstPoint.date),
      icon: Clock,
      tone: 'neutral',
    },
    {
      label: (
        <MetricLabel
          label="기간 종료 위험재고"
          calculation="선택 기간 안에서 가장 마지막에 생성된 정상 스냅샷의 CRITICAL 재고와 WARNING 재고를 더한 값입니다."
        />
      ),
      id: 'end-risk-stock',
      value: formatQuantity(endRiskStockQty),
      helper: formatDate(lastPoint.date),
      icon: Package,
      tone: 'danger',
    },
    {
      label: (
        <MetricLabel
          label="위험재고 순변화"
          calculation="기간 종료 위험재고에서 기간 시작 위험재고를 뺀 순변화입니다. 신규 입고·판매·이동·폐기가 모두 포함되며 AI 전략 성과를 의미하지 않습니다."
        />
      ),
      id: 'net-risk-stock-change',
      value: formatNetChange(startRiskStockQty, endRiskStockQty),
      helper: Number.isFinite(riskChangeRate)
        ? `시작 대비 ${riskChangeRate > 0 ? '+' : ''}${riskChangeRate.toFixed(1)}% · 입출고 포함`
        : '변화율 계산 불가',
      icon: Warning,
      tone: 'neutral',
    },
    {
      label: (
        <MetricLabel
          label="위험재고 비율"
          calculation="각 시점의 전체 재고수량 중 CRITICAL과 WARNING 재고수량이 차지하는 비율입니다. 재고 규모가 변해도 위험 수준을 함께 판단할 수 있습니다."
        />
      ),
      id: 'risk-stock-ratio-change',
      value:
        Number.isFinite(startRiskRatio) && Number.isFinite(endRiskRatio)
          ? `${formatPercent(startRiskRatio)} → ${formatPercent(endRiskRatio)}`
          : '집계 준비 중',
      helper: '기간 시작 → 기간 종료',
      icon: Danger,
      tone: 'danger',
    },
    {
      label: (
        <MetricLabel
          label="위험 SKU 수"
          calculation="각 시점에서 대표 위험등급이 CRITICAL 또는 WARNING인 고유 SKU 수입니다. 같은 SKU는 한 번만 집계합니다."
        />
      ),
      id: 'risk-sku-count-change',
      value: formatQuantity(endRiskSkuCount, { unit: '종' }),
      helper: `시작 ${formatQuantity(startRiskSkuCount, { unit: '종' })} · ${riskSkuChangeText}`,
      icon: AlertTriangle,
      tone: 'warning',
    },
  ];

  return (
    <section aria-label={`${scopeName} 위험재고 핵심 변화`}>
      <Alert variant="info" title={insight.title} className="mb-3">
        {insight.description}
      </Alert>
      <div className="grid grid-cols-1 gap-[var(--spacing-card-gap)] sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} {...metric} className="h-full" />
        ))}
      </div>
    </section>
  );
}
