import { Link } from 'react-router-dom';
import { ArrowRight } from 'reicon-react';
import { getRiskSalesPointInventoryUrl } from '@/entities/inventory/model/dashboardLinks.js';
import { formatQuantity } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/Icon.jsx';

export function RiskSalesPointTable({ points }) {
  // ponytail: this widget has one live consumer, the compact dashboard list.
  return (
    <section className="flex min-h-0 min-w-0 flex-col" aria-label="위험재고 보유 판매처 목록">
      {points.length === 0 ? (
        <p className="p-5 text-center text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
          위험재고를 보유한 판매처가 없습니다.
        </p>
      ) : (
        <ol className="dashboard-scrollbar divide-y divide-[var(--border)] overflow-y-auto px-4 pr-2">
          {points.map((point) => (
            <li key={point.id}>
              <Link
                to={getRiskSalesPointInventoryUrl(point)}
                aria-label={`${point.name} 재고 보기`}
                className="-mx-2 grid grid-cols-[30px_minmax(0,1fr)_34px] items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-2.5"
              >
                <span className="grid size-7 place-items-center rounded-full bg-[var(--danger-soft)] text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)] text-[color:var(--danger)]">
                  {point.rank}
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
                    {point.name}
                  </strong>
                  <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-body)]">
                    {point.type} · 위험 SKU{' '}
                    <strong className="text-[color:var(--danger)]">{formatQuantity(point.riskSkuCount)}</strong> · 폐기{' '}
                    <strong className="text-[color:var(--danger)]">{formatQuantity(point.expectedDisposal)}</strong>
                  </span>
                </span>
                <span className="grid size-8 place-items-center rounded-full text-[color:var(--primary-strong)]">
                  <Icon icon={ArrowRight} size={16} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
