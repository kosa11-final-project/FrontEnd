import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber, formatQuantity } from '@/shared/lib/format';

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function buildInventoryComparisonChartData(results = []) {
  return results
    .map((result, index) => ({
      id: `${result.locationType ?? 'LOCATION'}-${result.locationId ?? result.location ?? index}`,
      location: result.location || '위치 미수집',
      before: toFiniteNumber(result.before),
      after: toFiniteNumber(result.after),
      moved: toFiniteNumber(result.moved),
      guardrail: result.guardrail || '안전 기준 미수집',
    }))
    .filter((result) => result.before !== null || result.after !== null);
}

function InventoryComparisonTooltip({ active, payload }) {
  if (!active || !payload?.[0]?.payload) return null;
  const result = payload[0].payload;
  return (
    <div className="min-w-48 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-[var(--shadow-soft)]">
      <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
        {result.location}
      </strong>
      <dl className="mt-2 grid grid-cols-[auto_auto] gap-x-5 gap-y-1 text-[length:var(--font-size-meta)]">
        <dt className="text-[color:var(--text-muted)]">전략 시작</dt>
        <dd className="text-right font-semibold text-[color:var(--text-heading)]">
          {formatQuantity(result.before, { fallback: '미수집' })}
        </dd>
        <dt className="text-[color:var(--text-muted)]">재고 증감</dt>
        <dd className="text-right font-semibold text-[color:var(--text-heading)]">
          {formatQuantity(result.moved, { fallback: '미수집' })}
        </dd>
        <dt className="text-[color:var(--text-muted)]">현재 재고</dt>
        <dd className="text-right font-semibold text-[color:var(--text-heading)]">
          {formatQuantity(result.after, { fallback: '미수집' })}
        </dd>
      </dl>
      <p className="mt-2 border-t border-[var(--border)] pt-2 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
        {result.guardrail}
      </p>
    </div>
  );
}

export function InventoryValueLabel({ x = 0, y = 0, width = 0, height = 0, value }) {
  const number = toFiniteNumber(value);
  if (number === null) return null;

  const placeInside = width >= 52;
  return (
    <text
      x={placeInside ? x + width - 6 : x + width + 6}
      y={y + height / 2}
      dy="0.35em"
      textAnchor={placeInside ? 'end' : 'start'}
      fill={placeInside ? 'var(--color-white)' : 'var(--text-body)'}
      fontSize={11}
      fontWeight={700}
      aria-hidden="true"
    >
      {formatQuantity(number)}
    </text>
  );
}

export function StrategyInventoryComparisonBarChart({ results = [] }) {
  const chartData = buildInventoryComparisonChartData(results);
  if (!chartData.length) return null;

  const chartHeight = Math.max(220, chartData.length * 72);

  return (
    <div className="mb-5 border-b border-[var(--border)] pb-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[length:var(--font-size-body-sm)] font-semibold text-[color:var(--text-heading)]">
          위치별 재고 변화 비교
        </p>
        <div
          className="flex items-center gap-3 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]"
          aria-label="차트 범례"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[var(--chart-2)]" aria-hidden="true" />
            전략 시작
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[var(--chart-1)]" aria-hidden="true" />
            현재 재고
          </span>
        </div>
      </div>

      <div
        className="w-full"
        style={{ height: chartHeight }}
        role="img"
        aria-label="위치별 재고 변화 비교 가로 막대 차트"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
            barCategoryGap="24%"
          >
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tickFormatter={(value) => formatNumber(value)}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="location"
              width={104}
              tickFormatter={(value) => (value.length > 9 ? `${value.slice(0, 9)}…` : value)}
              tick={{ fill: 'var(--text-body)', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: 'var(--surface-subtle)' }} content={<InventoryComparisonTooltip />} />
            <Bar dataKey="before" name="전략 시작" fill="var(--chart-2)" radius={[0, 5, 5, 0]} maxBarSize={18}>
              <LabelList dataKey="before" content={<InventoryValueLabel />} />
            </Bar>
            <Bar dataKey="after" name="현재 재고" fill="var(--chart-1)" radius={[0, 5, 5, 0]} maxBarSize={18}>
              <LabelList dataKey="after" content={<InventoryValueLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="sr-only">
        {chartData.map((result) => (
          <li key={result.id}>
            {result.location}: 전략 시작 {formatQuantity(result.before, { fallback: '미수집' })}, 현재 재고{' '}
            {formatQuantity(result.after, { fallback: '미수집' })}, 재고 증감{' '}
            {formatQuantity(result.moved, { fallback: '미수집' })}
          </li>
        ))}
      </ul>
    </div>
  );
}
