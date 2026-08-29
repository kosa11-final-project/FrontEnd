export const MAX_STATISTICS_RANGE_DAYS = 365;

export const STATISTICS_PERIODS = Object.freeze([
  { value: '7D', label: '7일', days: 7 },
  { value: '30D', label: '30일', days: 30 },
  { value: '3M', label: '3개월', days: 90 },
  { value: '6M', label: '6개월', days: 180 },
  { value: '1Y', label: '1년', days: MAX_STATISTICS_RANGE_DAYS },
  { value: 'CUSTOM', label: '직접 선택', days: null },
]);

export const STATISTICS_SCOPES = Object.freeze([
  { value: 'NATIONAL', label: '전국' },
  { value: 'WAREHOUSE', label: '물류센터' },
  { value: 'OFFLINE_STORE', label: '오프라인 매장' },
  { value: 'ONLINE_STORE', label: '온라인 판매처' },
]);

export const LOCATION_COMPARISON_SCOPES = Object.freeze(STATISTICS_SCOPES.filter(({ value }) => value !== 'NATIONAL'));

export const RISK_GRADE_META = Object.freeze({
  GOOD: { label: '양호', color: 'var(--good)', tone: 'good' },
  NORMAL: { label: '보통', color: 'var(--info)', tone: 'info' },
  WARNING: { label: '주의', color: 'var(--warning)', tone: 'warning' },
  CRITICAL: { label: '위험', color: 'var(--danger)', tone: 'danger' },
  UNASSESSED: { label: '미평가', color: 'var(--color-gray-300)', tone: 'neutral' },
});

const INVENTORY_INSIGHT_META = Object.freeze({
  IMPROVED: { label: '전반적 개선', title: '전반적인 재고 상태가 개선되었습니다.', tone: 'good' },
  MIXED: { label: '일부 개선', title: '일부 지표는 개선됐지만 추가 확인이 필요합니다.', tone: 'warning' },
  WORSENED: { label: '위험 증가', title: '재고 위험이 이전 기간보다 증가했습니다.', tone: 'danger' },
  STABLE: { label: '변화 없음', title: '재고 상태가 이전 기간과 비슷합니다.', tone: 'info' },
  NOT_COMPARABLE: { label: '비교 준비 중', title: '이전 기간 비교 데이터가 필요합니다.', tone: 'neutral' },
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

function getRiskGradeStockQty(summary, riskGrade) {
  return summary?.riskDistribution?.find((item) => item.riskGrade === riskGrade)?.stockQty;
}

function getRiskStockQty(summary) {
  const criticalStockQty = getRiskGradeStockQty(summary, 'CRITICAL');
  const warningStockQty = getRiskGradeStockQty(summary, 'WARNING');
  if (!Number.isFinite(criticalStockQty) || !Number.isFinite(warningStockQty)) return null;
  return criticalStockQty + warningStockQty;
}

function getChangeRate(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function getChangeDirection(changeRate) {
  if (changeRate <= -1) return 'IMPROVED';
  if (changeRate >= 1) return 'WORSENED';
  return 'STABLE';
}

function getInventoryInsightStatus(changes) {
  const directions = changes.map(({ changeRate }) => getChangeDirection(changeRate));
  const improvedCount = directions.filter((direction) => direction === 'IMPROVED').length;
  const worsenedCount = directions.filter((direction) => direction === 'WORSENED').length;

  if (improvedCount && !worsenedCount) return 'IMPROVED';
  if (worsenedCount && !improvedCount) return 'WORSENED';
  if (improvedCount && worsenedCount) return 'MIXED';
  return 'STABLE';
}

function getInventoryChangeText({ label, changeRate }) {
  const direction = getChangeDirection(changeRate);
  const subject = label === '폐기위험' ? `${label}은` : `${label}는`;
  if (direction === 'STABLE') return `${subject} 비슷한 수준을 유지`;
  return `${subject} ${Math.abs(changeRate).toFixed(1)}% ${direction === 'IMPROVED' ? '감소' : '증가'}`;
}

export function buildInventoryImprovementInsight(summary, previousSummary) {
  const changes = [
    {
      key: 'riskStock',
      label: '위험재고',
      changeRate: getChangeRate(getRiskStockQty(summary), getRiskStockQty(previousSummary)),
    },
    {
      key: 'disposalRisk',
      label: '폐기위험',
      changeRate: getChangeRate(summary?.expectedDisposalQty30d, previousSummary?.expectedDisposalQty30d),
    },
    {
      key: 'shortageSku',
      label: '부족 SKU',
      changeRate: getChangeRate(summary?.shortageSkuCount, previousSummary?.shortageSkuCount),
    },
  ];

  if (changes.some(({ changeRate }) => !Number.isFinite(changeRate))) {
    return {
      status: 'NOT_COMPARABLE',
      ...INVENTORY_INSIGHT_META.NOT_COMPARABLE,
      description: '현재 재고 수치는 확인할 수 있으며, 직전 동일 기간 데이터 연결 후 개선 여부를 표시합니다.',
      changes,
    };
  }

  const status = getInventoryInsightStatus(changes);
  return {
    status,
    ...INVENTORY_INSIGHT_META[status],
    description: `직전 동일 기간 대비 ${changes.map(getInventoryChangeText).join(', ')}했습니다.`,
    changes,
  };
}

export function getStatisticsPeriodRange(period, asOfDate, customRange) {
  if (period === 'CUSTOM' && customRange?.from && customRange?.to) {
    const from = customRange.from <= customRange.to ? customRange.from : customRange.to;
    const to = customRange.from <= customRange.to ? customRange.to : customRange.from;
    if (getInclusiveDayCount(from, to) <= MAX_STATISTICS_RANGE_DAYS) return { from, to };

    const clampedFrom = parseDateOnly(to);
    clampedFrom.setUTCDate(clampedFrom.getUTCDate() - (MAX_STATISTICS_RANGE_DAYS - 1));
    return { from: formatDateOnly(clampedFrom), to };
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
  const totalSkuRatio = nationalSummary.totalSkuCount
    ? summary.totalSkuCount / nationalSummary.totalSkuCount
    : skuRatio;
  const disposalRatio = nationalSummary.expectedDisposalQty30d
    ? summary.expectedDisposalQty30d / nationalSummary.expectedDisposalQty30d
    : stockRatio;
  const totalStockRatio = nationalSummary.totalStockQty
    ? summary.totalStockQty / nationalSummary.totalStockQty
    : stockRatio;

  return points.map((point) => {
    const totalStockQty = Math.max(0, Math.round((point.totalStockQty ?? 0) * totalStockRatio));
    const criticalSkuCount = Math.max(0, Math.round(point.criticalSkuCount * skuRatio));
    const warningSkuCount = Math.max(0, Math.round((point.warningSkuCount ?? 0) * totalSkuRatio));
    const riskStockQty = Math.max(0, Math.round((point.riskStockQty ?? point.criticalStockQty) * stockRatio));

    return {
      ...point,
      totalStockQty,
      criticalSkuCount,
      warningSkuCount,
      riskSkuCount: criticalSkuCount + warningSkuCount,
      riskStockQty,
      riskStockRatio: totalStockQty ? (riskStockQty / totalStockQty) * 100 : 0,
      warningStockQty: Math.max(
        0,
        Math.round(
          (point.warningStockQty ?? Math.max(0, (point.riskStockQty ?? 0) - (point.criticalStockQty ?? 0))) *
            stockRatio,
        ),
      ),
      expectedDisposalQty30d: Math.max(0, Math.round((point.expectedDisposalQty30d ?? 0) * disposalRatio)),
      expectedDisposalLossAmount30d: Math.max(
        0,
        Math.round((point.expectedDisposalLossAmount30d ?? 0) * disposalRatio),
      ),
      shortageSkuCount: Math.max(0, Math.round((point.shortageSkuCount ?? 0) * totalSkuRatio)),
      criticalStockQty: Math.max(0, Math.round(point.criticalStockQty * stockRatio)),
    };
  });
}

export function sortLocationsByRisk(locations, scopeType) {
  return getScopeLocations(locations, scopeType).sort(
    (left, right) =>
      right.criticalStockRatio - left.criticalStockRatio ||
      right.criticalStockQty - left.criticalStockQty ||
      left.name.localeCompare(right.name, 'ko'),
  );
}
