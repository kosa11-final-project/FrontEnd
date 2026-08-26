import { formatDate, formatNumber, formatPercent, formatQuantity } from '@/shared/lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';

function getRiskComposition(point = {}) {
  const critical = point.criticalStockQty ?? 0;
  const warning = point.warningStockQty ?? Math.max(0, (point.riskStockQty ?? 0) - critical);
  const total = critical + warning;
  const ratio = point.totalStockQty ? (total / point.totalStockQty) * 100 : null;
  return { critical, warning, total, ratio };
}

function getChange(current, previous) {
  const difference = current - previous;
  const rate = previous ? (difference / previous) * 100 : 0;
  return { difference, rate };
}

function ComparisonBar({ label, composition, maximumTotal }) {
  const criticalWidth = maximumTotal ? (composition.critical / maximumTotal) * 100 : 0;
  const warningWidth = maximumTotal ? (composition.warning / maximumTotal) * 100 : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-[length:var(--font-size-body-sm)]">
        <span className="font-[var(--font-weight-semibold)] text-[color:var(--text-heading)]">{label}</span>
        <strong className="text-[color:var(--text-heading)]">{formatQuantity(composition.total)}</strong>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-[var(--surface-subtle)]" aria-hidden="true">
        <span className="bg-[var(--danger)]" style={{ width: `${criticalWidth}%` }} />
        <span className="bg-[var(--warning)]" style={{ width: `${warningWidth}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
        <span>심각 {formatQuantity(composition.critical)}</span>
        <span>경고 {formatQuantity(composition.warning)}</span>
        <span>
          전체 재고 중 {Number.isFinite(composition.ratio) ? formatPercent(composition.ratio) : '집계 준비 중'}
        </span>
      </div>
    </div>
  );
}

function ChangeRow({ label, current, previous, unit = '개' }) {
  const { difference, rate } = getChange(current, previous);
  const improved = difference <= 0;

  return (
    <li className="flex items-center justify-between gap-4 border-t border-[var(--border)] py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div>
        <span className="block text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">{label}</span>
        <strong className="mt-1 block text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
          {formatQuantity(current, { unit })}
        </strong>
      </div>
      <div className="text-right">
        <strong
          className={`block text-[length:var(--font-size-body-sm)] ${improved ? 'text-[color:var(--good)]' : 'text-[color:var(--danger)]'}`}
        >
          {difference > 0 ? '+' : ''}
          {formatNumber(difference)}
          {unit}
        </strong>
        <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          기간 시작 대비 {rate > 0 ? '+' : ''}
          {formatPercent(rate)}
        </span>
      </div>
    </li>
  );
}

export function InventoryRiskCompositionCard({ trend }) {
  const firstPoint = trend[0] ?? {};
  const lastPoint = trend.at(-1) ?? {};
  const current = getRiskComposition(lastPoint);
  const previous = getRiskComposition(firstPoint);
  const maximumTotal = Math.max(current.total, previous.total, 1);

  return (
    <Card asChild padding="none" className="min-w-0 shadow-[var(--shadow-soft)]">
      <section aria-labelledby="inventory-risk-composition-title">
        <CardHeader className="border-b border-[var(--border)] p-5">
          <CardTitle id="inventory-risk-composition-title">위험재고 구성 변화</CardTitle>
          <CardDescription className="mt-1">
            선택 기간의 시작과 종료 시점에 심각·경고 재고 구성이 어떻게 달라졌는지 비교합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-5">
          <div className="flex flex-wrap gap-4 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[var(--danger)]" /> 심각
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[var(--warning)]" /> 경고
            </span>
          </div>

          <div className="space-y-5">
            <ComparisonBar
              label={firstPoint.date ? `기간 시작 · ${formatDate(firstPoint.date)}` : '기간 시작'}
              composition={previous}
              maximumTotal={maximumTotal}
            />
            <ComparisonBar
              label={lastPoint.date ? `기간 종료 · ${formatDate(lastPoint.date)}` : '기간 종료'}
              composition={current}
              maximumTotal={maximumTotal}
            />
          </div>

          <ul className="m-0 list-none rounded-[var(--radius-card)] bg-[var(--surface-subtle)] p-4">
            <ChangeRow label="위험재고 수량" current={current.total} previous={previous.total} />
            <ChangeRow label="심각 재고" current={current.critical} previous={previous.critical} />
            <ChangeRow label="경고 재고" current={current.warning} previous={previous.warning} />
          </ul>
        </CardContent>
      </section>
    </Card>
  );
}
