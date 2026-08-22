const DAY_IN_MILLISECONDS = 86_400_000;

const SCOPE_FACTORS = Object.freeze({
  NATIONAL: 1,
  WAREHOUSE: 0.54,
  OFFLINE_STORE: 0.34,
  ONLINE_STORE: 0.12,
});

function parseDateOnly(value) {
  return new Date(`${value}T00:00:00Z`);
}

function filterRange(points, range) {
  return points.filter(({ date }) => date >= range.from && date <= range.to);
}

function sum(points, key) {
  return points.reduce((total, point) => total + (Number(point[key]) || 0), 0);
}

function summarize(points, scopeFactor) {
  const completedCount = Math.round(sum(points, 'completedCount') * scopeFactor);
  const goalAchievedCount = Math.min(completedCount, Math.round(sum(points, 'goalAchievedCount') * scopeFactor));
  const weightedAchievementTotal = points.reduce(
    (total, point) => total + (Number(point.achievementRate) || 0) * point.completedCount,
    0,
  );
  const rawCompletedCount = sum(points, 'completedCount');
  const baselineRiskStockQty = Math.round(sum(points, 'baselineRiskStockQty') * scopeFactor);
  const riskStockReductionQty = Math.round(sum(points, 'riskStockReductionQty') * scopeFactor);

  return {
    completedCount,
    goalAchievedCount,
    goalAchievedStrategyRate: completedCount ? (goalAchievedCount / completedCount) * 100 : null,
    averageAchievementRate: rawCompletedCount ? weightedAchievementTotal / rawCompletedCount : null,
    baselineRiskStockQty,
    riskStockReductionQty,
    riskStockReductionRate: baselineRiskStockQty ? (riskStockReductionQty / baselineRiskStockQty) * 100 : null,
    avoidedDisposalQty: Math.round(sum(points, 'avoidedDisposalQty') * scopeFactor),
    estimatedLossSavingsAmount: Math.round(sum(points, 'estimatedLossSavingsAmount') * scopeFactor),
  };
}

function scaleCombinationBreakdown(items, scopeFactor, range) {
  const rangeDays = Math.max(
    1,
    Math.floor((parseDateOnly(range.to).getTime() - parseDateOnly(range.from).getTime()) / DAY_IN_MILLISECONDS) + 1,
  );
  const periodFactor = rangeDays / 30;

  return items.map((item) => ({
    ...item,
    completedCount: Math.max(1, Math.round(item.completedCount * periodFactor * scopeFactor)),
    avoidedDisposalQty: Math.round(item.avoidedDisposalQty * periodFactor * scopeFactor),
    estimatedLossSavingsAmount: Math.round(item.estimatedLossSavingsAmount * periodFactor * scopeFactor),
  }));
}

export function buildStrategyStatisticsView(data, range, scopeType = 'NATIONAL') {
  const scopeFactor = SCOPE_FACTORS[scopeType] ?? 1;
  const currentPoints = filterRange(data.dailyTrend, range);

  return {
    range,
    current: summarize(currentPoints, scopeFactor),
    trend: currentPoints.map((point) => ({
      ...point,
      completedCount: Math.round(point.completedCount * scopeFactor),
      riskStockReductionQty: Math.round(point.riskStockReductionQty * scopeFactor),
      avoidedDisposalQty: Math.round(point.avoidedDisposalQty * scopeFactor),
      estimatedLossSavingsAmount: Math.round(point.estimatedLossSavingsAmount * scopeFactor),
    })),
    actionCombinationBreakdown: scaleCombinationBreakdown(data.actionCombinationBreakdown, scopeFactor, range),
  };
}
