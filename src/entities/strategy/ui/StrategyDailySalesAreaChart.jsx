import { useId, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import { Button } from '@/shared/ui';
import { EmptyPerformanceState } from './EmptyPerformanceState.jsx';

const ALL_SALES_POINTS = 'ALL';
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const SERIES_COLORS = Object.freeze({
  DESTINATION: '#27B06E',
  SOURCE: '#EAB308',
});

function toUtcTimestamp(value) {
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function buildDailySalesChartData(records = [], establishedAt, salesPoint = ALL_SALES_POINTS) {
  const startTimestamp = toUtcTimestamp(establishedAt);
  if (startTimestamp === null) return [];
  const endTimestamp = startTimestamp + 89 * DAY_IN_MILLISECONDS;
  const quantitiesByDate = new Map();

  records.forEach((record) => {
    const dateTimestamp = toUtcTimestamp(record.date);
    const quantity = Number(record.quantity);
    if (
      dateTimestamp === null ||
      dateTimestamp < startTimestamp ||
      dateTimestamp > endTimestamp ||
      !Number.isFinite(quantity) ||
      (salesPoint !== ALL_SALES_POINTS && record.salesPoint !== salesPoint)
    ) {
      return;
    }
    quantitiesByDate.set(record.date, (quantitiesByDate.get(record.date) ?? 0) + quantity);
  });

  return [...quantitiesByDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, quantity]) => ({ date, quantity }));
}

export function buildDailySalesComparisonData(records = [], establishedAt, series = []) {
  const startTimestamp = toUtcTimestamp(establishedAt);
  if (startTimestamp === null) return [];
  const endTimestamp = startTimestamp + 89 * DAY_IN_MILLISECONDS;
  const seriesKeyBySalesPoint = new Map(series.map((item) => [item.salesPoint, item.key]));
  const pointsByDate = new Map();

  records.forEach((record) => {
    const dateTimestamp = toUtcTimestamp(record.date);
    const quantity = Number(record.quantity);
    const seriesKey = seriesKeyBySalesPoint.get(record.salesPoint);
    if (
      !seriesKey ||
      dateTimestamp === null ||
      dateTimestamp < startTimestamp ||
      dateTimestamp > endTimestamp ||
      !Number.isFinite(quantity)
    ) {
      return;
    }
    const point = pointsByDate.get(record.date) ?? { date: record.date };
    point[seriesKey] = (point[seriesKey] ?? 0) + quantity;
    pointsByDate.set(record.date, point);
  });

  return [...pointsByDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

function formatAxisDate(value) {
  return value.slice(5).replace('-', '.');
}

export function getDelayedSeriesStartMarkers(chartData = [], series = []) {
  const chartStartDate = chartData[0]?.date;
  if (!chartStartDate) return [];

  const markersByDate = new Map();
  series.forEach((item) => {
    const firstPoint = chartData.find((point) => Number.isFinite(point[item.key]));
    if (!firstPoint || firstPoint.date === chartStartDate) return;

    const marker = markersByDate.get(firstPoint.date) ?? { date: firstPoint.date, series: [] };
    marker.series.push(item);
    markersByDate.set(firstPoint.date, marker);
  });

  return [...markersByDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

function SalesTooltip({ active, payload, startMarkersByDate }) {
  if (!active || !payload?.[0]?.payload) return null;
  const point = payload[0].payload;
  const startMarker = startMarkersByDate.get(point.date);
  return (
    <div className="max-w-[280px] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-[var(--shadow-soft)]">
      <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
        {formatDate(point.date)}
      </span>
      <div className="mt-1 grid gap-1">
        {payload.map((item) => (
          <span
            key={item.dataKey}
            className="flex items-center justify-between gap-4 text-[length:var(--font-size-body-sm)]"
          >
            <span className="inline-flex items-center gap-1.5 text-[color:var(--text-body)]">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
              {item.name}
            </span>
            <strong className="text-[color:var(--text-heading)]">{formatQuantity(item.value)}</strong>
          </span>
        ))}
      </div>
      {startMarker ? (
        <div className="mt-2 border-t border-[var(--border)] pt-2 text-[length:var(--font-size-meta)]">
          <strong className="text-[color:var(--text-heading)]">그래프 시작 지점</strong>
          {startMarker.series.map((item) => (
            <p key={item.key} className="mt-1 leading-relaxed text-[color:var(--text-muted)]">
              {item.label} · {item.name}의 판매 데이터가 이 날짜부터 수집되어 그래프가 여기서 시작됩니다.
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function StrategyDailySalesAreaChart({ establishedAt, records = [], salesPointComparison = [] }) {
  const [salesPoint, setSalesPoint] = useState(ALL_SALES_POINTS);
  const gradientId = `strategy-sales-${useId().replaceAll(':', '')}`;
  const salesPoints = useMemo(
    () => [...new Set(records.map((record) => record.salesPoint).filter(Boolean))],
    [records],
  );
  const comparisonBySalesPoint = useMemo(
    () => new Map(salesPointComparison.map((item) => [item.salesPoint, item])),
    [salesPointComparison],
  );
  const series = useMemo(
    () =>
      salesPoints.map((name, index) => {
        const comparison = comparisonBySalesPoint.get(name);
        const role = comparison?.role ?? (index === 0 ? 'DESTINATION' : 'SOURCE');
        return {
          key: `salesPoint${index}`,
          salesPoint: name,
          name,
          role,
          label: comparison?.label ?? (role === 'DESTINATION' ? '이동 대상 판매처' : '기존 판매처'),
          color: SERIES_COLORS[role] ?? SERIES_COLORS.SOURCE,
        };
      }),
    [comparisonBySalesPoint, salesPoints],
  );
  const activeSeries = useMemo(() => {
    if (salesPoint === ALL_SALES_POINTS) return series;
    const selectedSeries = series.find((item) => item.salesPoint === salesPoint);
    return selectedSeries ? [{ ...selectedSeries, key: 'quantity' }] : [];
  }, [salesPoint, series]);
  const chartData = useMemo(
    () =>
      salesPoint === ALL_SALES_POINTS
        ? buildDailySalesComparisonData(records, establishedAt, series)
        : buildDailySalesChartData(records, establishedAt, salesPoint),
    [establishedAt, records, salesPoint, series],
  );
  const salesPointLabel = salesPoint === ALL_SALES_POINTS ? '전체 판매처' : salesPoint;
  const totalQuantity = chartData.reduce(
    (total, point) => total + activeSeries.reduce((pointTotal, item) => pointTotal + (point[item.key] ?? 0), 0),
    0,
  );
  const maximumQuantity = chartData.length
    ? Math.max(...chartData.flatMap((point) => activeSeries.map((item) => point[item.key] ?? 0)))
    : 0;
  const lastPoint = chartData.at(-1);
  const lastPointQuantity = lastPoint
    ? activeSeries.reduce((total, item) => total + (lastPoint[item.key] ?? 0), 0)
    : null;
  const delayedSeriesStartMarkers = useMemo(
    () => getDelayedSeriesStartMarkers(chartData, activeSeries),
    [activeSeries, chartData],
  );
  const startMarkersByDate = useMemo(
    () => new Map(delayedSeriesStartMarkers.map((marker) => [marker.date, marker])),
    [delayedSeriesStartMarkers],
  );

  if (!establishedAt || !records.length) {
    return (
      <EmptyPerformanceState
        title="일별 판매 성과가 아직 수집되지 않았습니다."
        description="전략 실행 이후 판매처별 SKU 판매 데이터가 수집되면 최대 90일간 표시됩니다."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">기간 누적 판매량</span>
          <strong className="ml-2 text-[length:var(--font-size-headline2)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
            {formatQuantity(totalQuantity)}
          </strong>
          <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            전략 수립일 {formatDate(establishedAt)}부터 최대 90일 · 일 최고 {formatQuantity(maximumQuantity)}
          </p>
        </div>
        <div
          className="flex flex-wrap items-center gap-1 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] p-1"
          role="group"
          aria-label="판매처 선택"
        >
          {[ALL_SALES_POINTS, ...salesPoints].map((value) => {
            const label = value === ALL_SALES_POINTS ? '전체 판매처' : value;
            return (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={salesPoint === value ? 'primary' : 'ghost'}
                aria-pressed={salesPoint === value}
                onClick={() => setSalesPoint(value)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {chartData.length ? (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[length:var(--font-size-meta)]">
            {activeSeries.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1.5 text-[color:var(--text-body)]">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                <strong className="font-[var(--font-weight-semibold)]">{item.label}</strong> · {item.name}
              </span>
            ))}
          </div>
          <div className="h-[300px] w-full" role="img" aria-label={`${salesPointLabel} SKU 일별 판매량 비교 영역 차트`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  {activeSeries.map((item) => (
                    <linearGradient key={item.key} id={`${gradientId}-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={item.color} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  width={52}
                  domain={[0, 'auto']}
                  allowDecimals={false}
                  tickFormatter={(value) => formatNumber(value)}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<SalesTooltip startMarkersByDate={startMarkersByDate} />} />
                {delayedSeriesStartMarkers.map((marker) => {
                  const label = marker.series.map((item) => item.label).join(' · ');
                  const stroke = marker.series.length === 1 ? marker.series[0].color : 'var(--text-muted)';
                  return (
                    <ReferenceLine
                      key={marker.date}
                      x={marker.date}
                      stroke={stroke}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      label={{
                        value: `${label} 시작`,
                        position: 'insideTopRight',
                        fill: 'var(--text-muted)',
                        fontSize: 11,
                      }}
                    />
                  );
                })}
                {activeSeries.map((item) => (
                  <Area
                    key={item.key}
                    type="monotone"
                    dataKey={item.key}
                    name={`${item.label} · ${item.name}`}
                    stroke={item.color}
                    strokeWidth={2.5}
                    fill={`url(#${gradientId}-${item.key})`}
                    fillOpacity={1}
                    connectNulls
                    activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--card)' }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {lastPoint ? (
            <p className="sr-only">
              마지막 수집일 {formatDate(lastPoint.date)}의 {salesPointLabel} 판매량은{' '}
              {formatQuantity(lastPointQuantity)}입니다.
            </p>
          ) : null}
        </>
      ) : (
        <EmptyPerformanceState
          title="선택한 판매처의 기간 내 판매 데이터가 없습니다."
          description="전략 수립일로부터 90일 이내에 수집된 데이터만 표시합니다."
        />
      )}
    </div>
  );
}
