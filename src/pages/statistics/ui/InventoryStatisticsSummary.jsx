import { Link } from 'react-router-dom';
import { AlertTriangle, Box, CheckCircle, Clock, Danger, Warning } from 'reicon-react';
import { formatCurrency, formatNumber, formatQuantity } from '@/shared/lib/format';
import { Alert, Card, Icon, MetricCard } from '@/shared/ui';

export function InventoryStatisticsSummary({ summary, canViewFinancials, inventoryUrl, riskInventoryUrl }) {
  const metrics = [
    {
      label: '전체 재고수량',
      value: formatQuantity(summary.totalStockQty),
      helper: `고유 SKU ${formatNumber(summary.totalSkuCount)}종`,
      icon: Box,
      tone: 'good',
      href: inventoryUrl,
    },
    {
      label: '판매 가능 재고',
      value: formatQuantity(summary.availableStockQty),
      helper: '판매중지·소비기한 경과 제외',
      icon: CheckCircle,
      tone: 'good',
    },
    {
      label: '위험 SKU',
      value: formatQuantity(summary.criticalSkuCount),
      helper: 'CRITICAL 대표등급 기준',
      icon: AlertTriangle,
      tone: 'danger',
      href: riskInventoryUrl,
    },
    {
      label: '위험재고 수량',
      value: formatQuantity(summary.criticalStockQty),
      helper: 'CRITICAL 재고수량 합계',
      icon: Danger,
      tone: 'danger',
      href: riskInventoryUrl,
    },
    {
      label: '부족 SKU',
      value: formatQuantity(summary.shortageSkuCount),
      helper: '안전재고 미만 기준',
      icon: Warning,
      tone: 'danger',
    },
    {
      label: '향후 30일 예상 폐기',
      value: formatQuantity(summary.expectedDisposalQty30d),
      helper: '수요예측·LOT 소비기한 기준',
      icon: Clock,
      tone: 'danger',
    },
  ];

  const financial = summary.financialSummary;
  const hasMissingCost = financial.missingCostSkuCount > 0 || financial.missingCostStockQty > 0;

  return (
    <div className="space-y-4">
      <section aria-labelledby="inventory-statistics-summary-title">
        <div className="mb-3">
          <h2
            id="inventory-statistics-summary-title"
            className="m-0 text-[length:var(--font-size-section-title)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]"
          >
            핵심 재고 지표
          </h2>
          <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
            선택한 범위의 마지막 정상 집계 결과입니다.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-[var(--spacing-card-gap)] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metrics.map(({ href, ...metric }) => {
            const card = (
              <MetricCard
                {...metric}
                helper={href ? `${metric.helper} · 재고 보기 →` : metric.helper}
                className="h-full"
              />
            );

            return href ? (
              <Link
                key={metric.label}
                to={href}
                aria-label={`${metric.label} 통합 재고에서 보기`}
                className="block rounded-[var(--radius-panel)] transition-transform duration-[var(--motion-fast)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              >
                {card}
              </Link>
            ) : (
              <div key={metric.label}>{card}</div>
            );
          })}
        </div>
      </section>

      {canViewFinancials ? (
        <Card asChild padding="md">
          <section aria-labelledby="inventory-financial-summary-title">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2
                  id="inventory-financial-summary-title"
                  className="m-0 text-[length:var(--font-size-section-title)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]"
                >
                  원가 기준 재고 금액
                </h2>
                <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
                  기준일에 유효한 SKU 단위 원가로 계산합니다.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--primary-strong)]">
                <Icon icon={CheckCircle} size={14} aria-hidden="true" />
                원가 조회 권한
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ['전체 재고 원가액', financial.totalInventoryCostAmount],
                ['위험재고 원가액', financial.criticalInventoryCostAmount],
                ['예상 폐기 손실액', financial.expectedDisposalLossAmount30d],
              ].map(([label, value], index) => (
                <div key={label} className="rounded-[var(--radius-card)] bg-[var(--surface-subtle)] p-4">
                  <span className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">{label}</span>
                  <strong
                    className={`mt-2 block text-[length:var(--font-size-headline2)] font-[var(--font-weight-bold)] ${index === 0 ? 'text-[color:var(--text-heading)]' : 'text-[color:var(--danger)]'}`}
                  >
                    {formatCurrency(value)}
                  </strong>
                </div>
              ))}
            </div>

            {hasMissingCost ? (
              <Alert className="mt-3" variant="warning" title="일부 SKU 원가가 등록되지 않았습니다.">
                원가 미등록 {formatQuantity(financial.missingCostSkuCount)} · 재고{' '}
                {formatQuantity(financial.missingCostStockQty)}는 금액 합계에서 제외했습니다.
              </Alert>
            ) : null}
          </section>
        </Card>
      ) : null}
    </div>
  );
}
