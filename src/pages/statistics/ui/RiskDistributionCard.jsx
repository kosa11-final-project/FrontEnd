import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber, formatPercent, formatQuantity } from '@/shared/lib/format';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';
import { RISK_GRADE_META } from '../model/statisticsModel.js';

function DistributionTooltip({ active, payload }) {
  if (!active || !payload?.[0]?.payload) return null;
  const item = payload[0].payload;
  const meta = RISK_GRADE_META[item.riskGrade];

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-[var(--shadow-soft)]">
      <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">{meta.label}</strong>
      <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
        재고 {formatQuantity(item.stockQty)} · SKU {formatQuantity(item.skuCount)}
      </p>
    </div>
  );
}

export function RiskDistributionCard({ distribution, getInventoryUrl }) {
  const totalStockQty = distribution.reduce((sum, item) => sum + item.stockQty, 0);
  const totalSkuCount = distribution.reduce((sum, item) => sum + item.skuCount, 0);
  const chartData = distribution.map((item) => ({
    ...item,
    ratio: totalStockQty ? (item.stockQty / totalStockQty) * 100 : 0,
  }));

  return (
    <Card asChild padding="none" className="min-w-0">
      <section aria-labelledby="risk-distribution-title">
        <CardHeader className="border-b border-[var(--border)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle id="risk-distribution-title">위험등급 분포</CardTitle>
              <CardDescription className="mt-1">SKU 대표등급과 실제 재고수량을 함께 비교합니다.</CardDescription>
            </div>
            <Badge variant="outline">총 {formatNumber(totalSkuCount)}종</Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(210px,0.8fr)_minmax(0,1.2fr)] md:items-center">
          <div
            className="relative mx-auto h-[220px] w-full max-w-[280px]"
            role="img"
            aria-label="위험등급별 재고수량 도넛 차트"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="stockQty"
                  nameKey="riskGrade"
                  innerRadius={64}
                  outerRadius={96}
                  paddingAngle={2}
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.riskGrade} fill={RISK_GRADE_META[entry.riskGrade].color} />
                  ))}
                </Pie>
                <Tooltip content={<DistributionTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
              <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">전체 재고</span>
              <strong className="mt-1 text-[length:var(--font-size-subtitle1)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
                {formatQuantity(totalStockQty)}
              </strong>
            </div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {chartData.map((item) => {
              const meta = RISK_GRADE_META[item.riskGrade];
              const inventoryUrl = getInventoryUrl?.(item.riskGrade) ?? null;
              const Row = inventoryUrl ? Link : 'div';
              return (
                <Row
                  key={item.riskGrade}
                  {...(inventoryUrl
                    ? {
                        to: inventoryUrl,
                        'aria-label': `${meta.label} 등급 통합 재고에서 보기`,
                      }
                    : {})}
                  className={`grid grid-cols-[minmax(72px,0.7fr)_1fr_auto] items-center gap-3 rounded-[var(--radius-control)] px-2 py-3 first:pt-2 last:pb-2 ${
                    inventoryUrl
                      ? 'transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
                    <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                      {meta.label}
                    </strong>
                  </div>
                  <div className="min-w-0">
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(2, item.ratio)}%`, background: meta.color }}
                      />
                    </div>
                    <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                      SKU {formatQuantity(item.skuCount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <strong className="block text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                      {formatPercent(item.ratio)}
                      {inventoryUrl ? (
                        <span className="ml-1 text-[color:var(--primary)]" aria-hidden="true">
                          →
                        </span>
                      ) : null}
                    </strong>
                    <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                      {formatQuantity(item.stockQty)}
                    </span>
                  </div>
                </Row>
              );
            })}
          </div>
        </CardContent>
      </section>
    </Card>
  );
}
