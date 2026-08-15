import { AlertTriangle, Box, Clock, Warning } from 'reicon-react';
import { dashboardInventorySummary } from '@/entities/inventory';
import { formatQuantity } from '@/shared/lib/format';
import { MetricCard } from '@/shared/ui';

export function DashboardSummary({ summary = dashboardInventorySummary }) {
  const metrics = [
    {
      label: '전체 판매 가능 재고',
      value: formatQuantity(summary.totalAvailableStock),
      helper: '전국 8개 물류센터 기준',
      icon: Box,
      tone: 'good',
    },
    {
      label: '위험·주의 SKU',
      value: formatQuantity(summary.riskAndCautionSkuCount),
      helper: (
        <>
          <span className="font-[var(--font-weight-semibold)] text-[color:var(--danger)]">위험 5개</span>
          {' · '}
          <span className="font-[var(--font-weight-semibold)] text-[color:var(--warning)]">주의 7개</span>
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

      <div className="grid grid-cols-1 gap-[var(--spacing-card-gap)] sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  );
}
