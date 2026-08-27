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

const SCOPE_PERFORMANCE_LABELS = Object.freeze({
  WAREHOUSE: '물류센터',
  OFFLINE_STORE: '오프라인 매장',
  ONLINE_STORE: '온라인 판매처',
});

function aggregateScopePerformance(locations) {
  return Object.entries(SCOPE_PERFORMANCE_LABELS).map(([scopeType, name]) => {
    const items = locations.filter((item) => item.scopeType === scopeType);
    const completedCount = sum(items, 'completedCount');
    const baselineRiskStockQty = sum(items, 'baselineRiskStockQty');
    const riskStockReductionQty = sum(items, 'riskStockReductionQty');
    const weightedGoalAchievementRate = items.reduce(
      (total, item) => total + item.goalAchievementRate * item.completedCount,
      0,
    );

    return {
      id: scopeType,
      code: scopeType,
      name,
      scopeType,
      completedCount,
      goalAchievementRate: completedCount ? weightedGoalAchievementRate / completedCount : 0,
      baselineRiskStockQty,
      riskStockReductionQty,
      riskStockReductionRate: baselineRiskStockQty ? (riskStockReductionQty / baselineRiskStockQty) * 100 : 0,
      estimatedLossSavingsAmount: sum(items, 'estimatedLossSavingsAmount'),
    };
  });
}

export function buildStrategyPreviewEnhancements(summary, locationPerformance = []) {
  const baselineRiskStockQty = Number(summary?.baselineRiskStockQty) || 0;
  const riskStockReductionQty = Math.min(
    baselineRiskStockQty,
    Math.max(0, Number(summary?.riskStockReductionQty) || 0),
  );
  const avoidedDisposalQty = Math.max(0, Number(summary?.avoidedDisposalQty) || 0);
  const estimatedLossSavingsAmount = Math.max(0, Number(summary?.estimatedLossSavingsAmount) || 0);
  const disposalRiskAfterQty = Math.round(avoidedDisposalQty * 0.72);
  const estimatedLossAfterAmount = Math.round(estimatedLossSavingsAmount * 0.58);
  const locationBaselineTotal = sum(locationPerformance, 'baselineRiskStockQty');
  const locationScale = locationBaselineTotal ? baselineRiskStockQty / locationBaselineTotal : 1;

  const scaledLocationPerformance = locationPerformance
    .map((item) => ({
      ...item,
      completedCount: Math.max(1, Math.round(item.completedCount * locationScale)),
      baselineRiskStockQty: Math.round(item.baselineRiskStockQty * locationScale),
      riskStockReductionQty: Math.round(item.riskStockReductionQty * locationScale),
      estimatedLossSavingsAmount: Math.round(item.estimatedLossSavingsAmount * locationScale),
    }))
    .sort((left, right) => right.riskStockReductionRate - left.riskStockReductionRate);

  return {
    beforeAfterComparison: [
      {
        key: 'risk-stock',
        label: '위험재고',
        before: baselineRiskStockQty,
        after: Math.max(0, baselineRiskStockQty - riskStockReductionQty),
        reduction: riskStockReductionQty,
        format: 'quantity',
      },
      {
        key: 'disposal-risk',
        label: '폐기위험 재고',
        before: avoidedDisposalQty + disposalRiskAfterQty,
        after: disposalRiskAfterQty,
        reduction: avoidedDisposalQty,
        format: 'quantity',
      },
      {
        key: 'estimated-loss',
        label: '추정 손실액',
        before: estimatedLossSavingsAmount + estimatedLossAfterAmount,
        after: estimatedLossAfterAmount,
        reduction: estimatedLossSavingsAmount,
        format: 'currency',
      },
    ],
    locationPerformance: scaledLocationPerformance,
    scopePerformance: aggregateScopePerformance(scaledLocationPerformance).sort(
      (left, right) => right.riskStockReductionRate - left.riskStockReductionRate,
    ),
    enhancementsPreview: true,
  };
}

export function buildStrategyStatisticsView(data, range, scopeType = 'NATIONAL') {
  const scopeFactor = SCOPE_FACTORS[scopeType] ?? 1;
  const currentPoints = filterRange(data.dailyTrend, range);

  const current = summarize(currentPoints, scopeFactor);

  return {
    range,
    scopeType,
    current,
    trend: currentPoints.map((point) => ({
      ...point,
      completedCount: Math.round(point.completedCount * scopeFactor),
      riskStockReductionQty: Math.round(point.riskStockReductionQty * scopeFactor),
      avoidedDisposalQty: Math.round(point.avoidedDisposalQty * scopeFactor),
      estimatedLossSavingsAmount: Math.round(point.estimatedLossSavingsAmount * scopeFactor),
    })),
    actionCombinationBreakdown: scaleCombinationBreakdown(data.actionCombinationBreakdown, scopeFactor, range),
    ...buildStrategyPreviewEnhancements(current, data.locationPerformance),
  };
}
