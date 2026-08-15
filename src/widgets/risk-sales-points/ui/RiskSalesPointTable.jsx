import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Store } from 'reicon-react';
import { rankRiskSalesPoints, riskSalesPoints } from '@/entities/inventory';
import { formatQuantity } from '@/shared/lib/format';
import { Badge, Card, CardDescription, CardHeader, CardTitle, DataTable, Icon } from '@/shared/ui';

const columns = [
  {
    id: 'rank',
    header: '순위',
    enableSorting: false,
    meta: { align: 'center', width: 56 },
    cell: ({ row }) => <strong className="text-[color:var(--text-heading)]">{row.index + 1}</strong>,
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
        to={`/inventory?salesPoint=${row.original.id}`}
        className="inline-flex items-center gap-1 font-[var(--font-weight-bold)] text-[color:var(--primary-strong)] hover:underline"
      >
        재고 보기
        <Icon icon={ArrowRight} size={13} aria-hidden="true" />
      </Link>
    ),
  },
];

export function RiskSalesPointTable({ points = riskSalesPoints }) {
  const rankedPoints = useMemo(() => rankRiskSalesPoints(points).slice(0, 10), [points]);

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
          data={rankedPoints}
          density="compact"
          surface="plain"
          enableSorting={false}
          getRowId={(row) => row.id}
          className="rounded-none border-0"
        />
      </section>
    </Card>
  );
}
