import { useId, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';

const trendMetrics = Object.freeze({
  criticalSkuCount: { label: '위험 SKU 수', color: 'var(--danger)', format: formatQuantity },
  criticalStockQty: { label: '위험재고 수량', color: 'var(--warning)', format: formatQuantity },
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

export function RiskTrendCard({ trend }) {
  const [metric, setMetric] = useState('criticalStockQty');
  const gradientId = `risk-trend-${useId().replaceAll(':', '')}`;
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
    <Card asChild padding="none" className="min-w-0">
      <section aria-labelledby="risk-trend-title">
        <CardHeader className="border-b border-[var(--border)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle id="risk-trend-title">위험재고 추이</CardTitle>
              <CardDescription className="mt-1">동기화 완료 시점별 위험 규모 변화를 확인합니다.</CardDescription>
            </div>
            <div
              className="flex items-center gap-1 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] p-1"
              aria-label="추이 지표 선택"
            >
              {Object.entries(trendMetrics).map(([value, option]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
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

          <div className="h-[280px] w-full" role="img" aria-label={`${meta.label} 기간별 영역 차트`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
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
                  width={56}
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {firstPoint && lastPoint ? (
            <p className="sr-only">
              {formatDate(firstPoint.date)} {meta.format(firstPoint[metric])}에서 {formatDate(lastPoint.date)}{' '}
              {meta.format(lastPoint[metric])}로 변경되었습니다.
            </p>
          ) : null}
        </CardContent>
      </section>
    </Card>
  );
}
