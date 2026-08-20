import { AlertTriangle, Box, Clock, Refresh, Warning } from 'reicon-react';
import { formatDateTime, formatQuantity } from '@/shared/lib/format';
import { Icon, MetricCard } from '@/shared/ui';

export function DashboardSummary({ calculatedAt, summary }) {
  const metrics = [
    {
      label: '전체 판매 가능 재고',
      value: formatQuantity(summary.totalAvailableStock),
      helper: '전국 온·오프라인 재고 기준',
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
      tone: 'danger',
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
      tone: 'danger',
    },
  ];

  return (
    <section aria-labelledby="dashboard-summary-title">
      <h2 id="dashboard-summary-title" className="sr-only">
        핵심 재고 지표
      </h2>

      <div className="mb-2 flex justify-end">
        <p className="inline-flex items-center gap-1.5 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          <Icon icon={Refresh} size={13} aria-hidden="true" />
          마지막 정상 동기화
          <strong className="text-[color:var(--text-heading)]">{formatDateTime(calculatedAt)}</strong>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            className="p-3 shadow-[var(--shadow-soft)] [&>strong]:mt-2 [&>strong]:text-[length:var(--font-size-title)] [&>span:last-child]:mt-1"
          />
        ))}
      </div>
    </section>
  );
}
