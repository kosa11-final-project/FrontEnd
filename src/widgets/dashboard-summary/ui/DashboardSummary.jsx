import { AlertTriangle, Box, Clock, Refresh, Warning } from 'reicon-react';
import { formatDateTime, formatPercent, formatQuantity } from '@/shared/lib/format';
import { Icon, MetricCard } from '@/shared/ui';

export function DashboardSummary({ calculatedAt, summary }) {
  const availabilityRate =
    summary.totalCurrentStock > 0 ? (summary.totalAvailableStock / summary.totalCurrentStock) * 100 : null;
  const metrics = [
    {
      label: '전체 판매 가능 재고',
      value: formatQuantity(summary.totalAvailableStock),
      helper:
        availabilityRate === null
          ? '총현재고 기준 가용률 산정 불가'
          : `총현재고 ${formatQuantity(summary.totalCurrentStock)} 중 ${formatPercent(availabilityRate)}`,
      icon: Box,
      tone: 'good',
    },
    {
      label: '위험·주의 SKU',
      value: formatQuantity(summary.riskAndCautionSkuCount),
      helper: (
        <>
          <span className="font-[var(--font-weight-semibold)] text-[color:var(--danger)]">
            위험 {formatQuantity(summary.criticalSkuCount)}
          </span>
          {' · '}
          <span className="font-[var(--font-weight-semibold)] text-[color:var(--warning)]">
            주의 {formatQuantity(summary.warningSkuCount)}
          </span>
        </>
      ),
      icon: AlertTriangle,
      tone: 'warning',
    },
    {
      label: '부족 SKU',
      value: formatQuantity(summary.shortageSkuCount),
      helper: '안전재고 미만 판매처 기준',
      icon: Warning,
      tone: 'danger',
    },
    {
      label: '향후 30일 예상 폐기',
      value: formatQuantity(summary.expectedDisposal),
      helper: '수요예측·LOT 소비기한 기준',
      icon: Clock,
      tone: 'warning',
    },
  ];

  return (
    <section aria-labelledby="dashboard-summary-title">
      <h2 id="dashboard-summary-title" className="sr-only">
        핵심 재고 지표
      </h2>

      <div className="mb-1.5 flex justify-end">
        <p className="inline-flex items-center gap-1.5 text-[length:var(--font-size-body-sm)] text-[color:var(--text-body)]">
          <Icon icon={Refresh} size={13} aria-hidden="true" />
          마지막 정상 동기화
          <strong className="text-[color:var(--text-heading)]">{formatDateTime(calculatedAt)}</strong>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            className="px-4 py-2.5 shadow-[var(--shadow-soft)] 2xl:grid 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:grid-rows-[auto_auto] 2xl:items-center 2xl:gap-x-3 [&>div>span:first-child]:size-7 [&>div>span:last-child]:text-[13px] [&>div>span:last-child]:text-[color:var(--text-body)] [&>strong]:mt-1 [&>strong]:text-xl 2xl:[&>strong]:mt-0 2xl:[&>strong]:text-right [&>span:last-child]:mt-0.5 [&>span:last-child]:text-[length:var(--font-size-body-sm)] [&>span:last-child]:text-[color:var(--text-body)] 2xl:[&>span:last-child]:col-span-2"
          />
        ))}
      </div>
    </section>
  );
}
