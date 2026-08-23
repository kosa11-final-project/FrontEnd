export const STATISTICS_PERIODS = Object.freeze([
  { value: '7D', label: '7일', days: 7 },
  { value: '30D', label: '30일', days: 30 },
  { value: '3M', label: '3개월', days: 90 },
  { value: '6M', label: '6개월', days: 180 },
  { value: 'CUSTOM', label: '직접 선택', days: null },
]);

export const STATISTICS_SCOPES = Object.freeze([
  { value: 'NATIONAL', label: '전국' },
  { value: 'WAREHOUSE', label: '물류센터' },
  { value: 'OFFLINE_STORE', label: '오프라인 매장' },
  { value: 'ONLINE_STORE', label: '온라인 판매처' },
  { value: 'UNASSIGNED', label: '공용 미할당' },
]);

export const LOCATION_COMPARISON_SCOPES = Object.freeze(STATISTICS_SCOPES.filter(({ value }) => value !== 'NATIONAL'));

export const RISK_GRADE_META = Object.freeze({
  CRITICAL: { label: '위험', color: 'var(--danger)', tone: 'danger' },
  WARNING: { label: '주의', color: 'var(--warning)', tone: 'warning' },
  NORMAL: { label: '보통', color: 'var(--info)', tone: 'info' },
  GOOD: { label: '양호', color: 'var(--good)', tone: 'good' },
  UNASSESSED: { label: '미평가', color: 'var(--color-gray-300)', tone: 'neutral' },
});

function parseDateOnly(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function getInclusiveDayCount(from, to) {
  const milliseconds = parseDateOnly(to).getTime() - parseDateOnly(from).getTime();
  return Math.max(1, Math.floor(milliseconds / 86_400_000) + 1);
}

export function getStatisticsPeriodRange(period, asOfDate, customRange) {
  if (period === 'CUSTOM' && customRange?.from && customRange?.to) {
    const from = customRange.from <= customRange.to ? customRange.from : customRange.to;
    const to = customRange.from <= customRange.to ? customRange.to : customRange.from;
    return { from, to };
  }

  const selectedPeriod = STATISTICS_PERIODS.find(({ value }) => value === period) ?? STATISTICS_PERIODS[1];
  const to = parseDateOnly(asOfDate);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (selectedPeriod.days - 1));
  return { from: formatDateOnly(from), to: formatDateOnly(to) };
}

export function getStatisticsGranularity(range) {
  const dayCount = getInclusiveDayCount(range.from, range.to);
  if (dayCount <= 31) return 'DAILY';
  if (dayCount <= 183) return 'WEEKLY';
  return 'MONTHLY';
}

export function selectStatisticsTrend(points, range) {
  const filtered = points.filter(({ date }) => date >= range.from && date <= range.to);
  const granularity = getStatisticsGranularity(range);

  if (granularity === 'DAILY') return filtered;

  if (granularity === 'WEEKLY') {
    return filtered.filter((_, index) => index % 7 === 0 || index === filtered.length - 1);
  }

  const latestByMonth = new Map();
  filtered.forEach((point) => latestByMonth.set(point.date.slice(0, 7), point));
  return [...latestByMonth.values()];
}

export function getScopeLocations(locations, scopeType) {
  if (scopeType === 'NATIONAL') return [];
  return locations.filter((location) => location.scopeType === scopeType);
}

export function getSelectedStatisticsSummary(statistics, scopeType, locationId = 'ALL') {
  if (locationId !== 'ALL') {
    return statistics.locations.find((location) => location.id === locationId) ?? statistics.scopeSummaries[scopeType];
  }

  return statistics.scopeSummaries[scopeType] ?? statistics.scopeSummaries.NATIONAL;
}

export function buildStatisticsQueryParams({ range, scopeType, locationId = 'ALL' }) {
  const scopeCode = scopeType === 'UNASSIGNED' ? 'UNASSIGNED' : locationId;

  return {
    fromDate: range.from,
    toDate: range.to,
    scopeType,
    scopeCode,
  };
}

export function scaleStatisticsTrend(points, summary, nationalSummary) {
  if (!summary || summary === nationalSummary || !nationalSummary.criticalStockQty) return points;

  const stockRatio = summary.criticalStockQty / nationalSummary.criticalStockQty;
  const skuRatio = summary.criticalSkuCount / nationalSummary.criticalSkuCount;

  return points.map((point) => ({
    ...point,
    criticalSkuCount: Math.max(0, Math.round(point.criticalSkuCount * skuRatio)),
    criticalStockQty: Math.max(0, Math.round(point.criticalStockQty * stockRatio)),
  }));
}

export function sortLocationsByRisk(locations, scopeType) {
  return getScopeLocations(locations, scopeType).sort(
    (left, right) =>
      right.criticalStockRatio - left.criticalStockRatio ||
      right.criticalStockQty - left.criticalStockQty ||
      left.name.localeCompare(right.name, 'ko'),
  );
}
