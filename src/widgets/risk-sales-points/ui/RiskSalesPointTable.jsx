import { Link } from 'react-router-dom';
import { ArrowRight, Store } from 'reicon-react';
import { getRiskSalesPointInventoryUrl } from '@/entities/inventory';
import { formatQuantity } from '@/shared/lib/format';
import { Badge, Card, CardDescription, CardHeader, CardTitle, DataTable, Icon } from '@/shared/ui';

const columns = [
  {
    id: 'rank',
    header: '순위',
    enableSorting: false,
    meta: { align: 'center', width: 56 },
    cell: ({ row }) => <strong className="text-[color:var(--text-heading)]">{row.original.rank}</strong>,
  },
  {
    accessorKey: 'name',
    header: '판매처',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-44">
        <p className="font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">{row.original.name}</p>
        <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          {row.original.type} · {row.original.region}
        </p>
      </div>
    ),
  },
  {
    accessorKey: 'availableStock',
    header: '판매 가능 재고',
    enableSorting: false,
    meta: { align: 'right' },
    cell: ({ getValue }) => (
      <span className="font-[var(--font-weight-semibold)] text-[color:var(--text-heading)]">
        {formatQuantity(getValue())}
      </span>
    ),
  },
  {
    accessorKey: 'riskSkuCount',
    header: '위험 SKU',
    enableSorting: false,
    meta: { align: 'center' },
    cell: ({ getValue }) => <Badge variant="danger">{formatQuantity(getValue())}</Badge>,
  },
  {
    accessorKey: 'expectedDisposal',
    header: '예상 폐기수량',
    enableSorting: false,
    meta: { align: 'right' },
    cell: ({ getValue }) => <strong className="text-[color:var(--danger)]">{formatQuantity(getValue())}</strong>,
  },
  {
    id: 'detail',
    header: '상세',
    enableSorting: false,
    meta: { align: 'right' },
    cell: ({ row }) => (
      <Link
        to={getRiskSalesPointInventoryUrl(row.original)}
        className="inline-flex items-center gap-1 font-[var(--font-weight-bold)] text-[color:var(--primary-strong)] hover:underline"
      >
        재고 보기
        <Icon icon={ArrowRight} size={13} aria-hidden="true" />
      </Link>
    ),
  },
];

function CompactRiskSalesPointList({ points }) {
  return (
    <Card asChild padding="none" className="min-w-0 overflow-hidden shadow-[var(--shadow-soft)]">
      <section aria-labelledby="risk-sales-points-title">
        <CardHeader className="border-b border-[var(--border)] p-4">
          <CardTitle id="risk-sales-points-title" className="flex items-center gap-2">
            <Icon icon={Store} size={17} className="text-[color:var(--danger)]" aria-hidden="true" />
            위험재고 보유 판매처 TOP 10
          </CardTitle>
          <CardDescription>위험 SKU 수 → 예상 폐기수량 순</CardDescription>
        </CardHeader>

        {points.length === 0 ? (
          <p className="p-5 text-center text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
            위험재고를 보유한 판매처가 없습니다.
          </p>
        ) : (
          <>
            <ol className="max-h-[218px] divide-y divide-[var(--border)] overflow-y-auto px-4 pr-2">
              {points.map((point) => (
                <li key={point.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 py-2">
                  <span className="grid size-6 place-items-center rounded-full bg-[var(--danger-soft)] text-[length:var(--font-size-tiny)] font-[var(--font-weight-bold)] text-[color:var(--danger)]">
                    {point.rank}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                      {point.name}
                    </strong>
                    <span className="mt-0.5 block text-[length:var(--font-size-tiny)] text-[color:var(--text-muted)]">
                      {point.type} · 위험 SKU{' '}
                      <strong className="text-[color:var(--danger)]">{formatQuantity(point.riskSkuCount)}</strong> ·
                      폐기{' '}
                      <strong className="text-[color:var(--danger)]">{formatQuantity(point.expectedDisposal)}</strong>
                    </span>
                  </span>
                  <Link
                    to={getRiskSalesPointInventoryUrl(point)}
                    aria-label={`${point.name} 재고 보기`}
                    className="grid size-7 place-items-center rounded-full text-[color:var(--primary-strong)] hover:bg-[var(--primary-soft)]"
                  >
                    <Icon icon={ArrowRight} size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
            {points.length > 5 ? (
              <p className="border-t border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-center text-[length:var(--font-size-tiny)] text-[color:var(--text-muted)]">
                목록 안에서 스크롤해 전체 {points.length}개 판매처를 확인할 수 있습니다.
              </p>
            ) : null}
          </>
        )}
      </section>
    </Card>
  );
}

export function RiskSalesPointTable({ compact = false, points }) {
  if (compact) return <CompactRiskSalesPointList points={points} />;

  return (
    <Card asChild padding="none" className="min-w-0 overflow-hidden shadow-[var(--shadow-soft)]">
      <section aria-labelledby="risk-sales-points-title">
        <CardHeader className="border-b border-[var(--border)] p-5">
          <CardTitle id="risk-sales-points-title" className="flex items-center gap-2">
            <Icon icon={Store} size={18} className="text-[color:var(--danger)]" aria-hidden="true" />
            위험재고 보유 판매처 TOP 10
          </CardTitle>
          <CardDescription>위험 SKU 수가 많은 순서이며, 동점이면 예상 폐기수량을 비교합니다.</CardDescription>
        </CardHeader>

        <DataTable
          ariaLabel="위험재고 보유 판매처 순위"
          caption="위험재고 보유 판매처 TOP 10"
          columns={columns}
          data={points}
          density="compact"
          surface="plain"
          enableSorting={false}
          getRowId={(row) => row.id}
          emptyMessage="위험재고를 보유한 판매처가 없습니다."
          className="rounded-none border-0"
        />
      </section>
    </Card>
  );
}
