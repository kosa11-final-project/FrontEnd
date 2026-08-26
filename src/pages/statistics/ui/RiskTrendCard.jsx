import { useId, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate, formatNumber, formatPercent, formatQuantity } from '@/shared/lib/format';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';

const trendMetrics = Object.freeze({
  riskStockQty: { label: '위험 수량', color: 'var(--primary)', format: formatQuantity },
  riskStockRatio: { label: '위험 비율', color: 'var(--info)', format: formatPercent },
  criticalStockQty: { label: '심각 재고', color: 'var(--danger)', format: formatQuantity },
  warningStockQty: { label: '경고 재고', color: 'var(--warning)', format: formatQuantity },
  riskSkuCount: {
    label: '위험 SKU',
    color: 'var(--warning)',
    format: (value) => formatQuantity(value, { unit: '종' }),
  },
});

function formatAxisDate(value) {
  return value.slice(5).replace('-', '.');
}

function TrendTooltip({ active, payload, metric }) {
  if (!active || !payload?.[0]?.payload) return null;
  const point = payload[0].payload;
  const meta = trendMetrics[metric];
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-[var(--shadow-soft)]">
      <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
        {formatDate(point.date)}
      </span>
      <strong className="mt-1 block text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
        {meta.label} {meta.format(point[metric])}
      </strong>
    </div>
  );
}

export function RiskTrendCard({ trend, scopeName = '전체' }) {
  const [metric, setMetric] = useState('riskStockQty');
  const gradientId = `risk-inventory-${useId().replaceAll(':', '')}`;
  const meta = trendMetrics[metric];
  const firstPoint = trend[0];
  const lastPoint = trend.at(-1);
  const change = firstPoint && lastPoint ? lastPoint[metric] - firstPoint[metric] : 0;
  const metricValues = trend.map((point) => point[metric]).filter(Number.isFinite);
  const minimumValue = metricValues.length ? Math.min(...metricValues) : 0;
  const maximumValue = metricValues.length ? Math.max(...metricValues) : 0;
  const domainPadding = Math.max((maximumValue - minimumValue) * 0.18, maximumValue * 0.02, 1);
  const yAxisDomain = metricValues.length
    ? [Math.max(0, Math.floor(minimumValue - domainPadding)), Math.ceil(maximumValue + domainPadding)]
    : [0, 'auto'];

  return (
    <Card asChild padding="none" className="min-w-0 shadow-[var(--shadow-soft)]">
      <section aria-labelledby="risk-inventory-trend-title">
        <CardHeader className="border-b border-[var(--border)] p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle id="risk-inventory-trend-title">{scopeName} 위험재고 추이</CardTitle>
              <CardDescription className="mt-1">
                입고·판매·이동·폐기를 포함한 전체 위험재고 상태가 언제 어떻게 변했는지 확인합니다.
              </CardDescription>
            </div>
            <div
              className="flex max-w-full shrink-0 flex-nowrap justify-end gap-0.5 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] p-1"
              aria-label="위험재고 추이 지표 선택"
            >
              {Object.entries(trendMetrics).map(([value, option]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  className="whitespace-nowrap px-1.5 text-[length:var(--font-size-meta)]"
                  variant={metric === value ? 'primary' : 'ghost'}
                  aria-pressed={metric === value}
                  onClick={() => setMetric(value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">기간 마지막 값</span>
              <strong className="ml-2 text-[length:var(--font-size-headline2)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
                {lastPoint ? meta.format(lastPoint[metric]) : '-'}
              </strong>
            </div>
            <span
              className={`text-[length:var(--font-size-body-sm)] font-[var(--font-weight-semibold)] ${change <= 0 ? 'text-[color:var(--good)]' : 'text-[color:var(--danger)]'}`}
            >
              기간 시작 대비 {change > 0 ? '+' : ''}
              {formatNumber(change)}
            </span>
          </div>

          <div className="h-[310px] w-full" role="img" aria-label={`${meta.label} 기간별 영역 차트`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={meta.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={meta.color} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis
                  width={64}
                  domain={yAxisDomain}
                  tickFormatter={(value) => formatNumber(value)}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TrendTooltip metric={metric} />} />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke={meta.color}
                  strokeWidth={2.5}
                  fill={`url(#${gradientId})`}
                  activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--card)' }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </section>
    </Card>
  );
}
