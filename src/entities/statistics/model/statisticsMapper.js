const RISK_GRADES = Object.freeze(['CRITICAL', 'WARNING', 'NORMAL', 'GOOD', 'UNASSESSED']);
const REGION_LABELS = Object.freeze({
  SEOUL: '서울권',
  GYEONGGI: '경기권',
  BUSAN: '부산/경남권',
  DAEGU: '대구/경북권',
  CHUNGCHEONG: '충청/대전권',
  ULSAN: '울산권',
  ONLINE: '온라인/전국',
});

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mapRiskDistribution(distribution = []) {
  const distributionByGrade = new Map(distribution.map((item) => [item?.riskGrade, item]));

  return RISK_GRADES.map((riskGrade) => {
    const item = distributionByGrade.get(riskGrade) ?? {};
    return {
      riskGrade,
      skuCount: toNumber(item.skuCount),
      stockQty: toNumber(item.stockQty),
    };
  });
}

function mapDataQuality(dataQuality = {}) {
  return {
    unassessedSkuCount: toNumber(dataQuality.unassessedSkuCount),
    unassessedStockQty: toNumber(dataQuality.unassessedStockQty),
    missingForecastSkuCount: toNumber(dataQuality.missingForecastSkuCount),
    missingForecastStockQty: toNumber(dataQuality.missingForecastStockQty),
  };
}

function mapFinancialSummary(financialSummary = {}) {
  return {
    totalInventoryCostAmount: toNumber(financialSummary.totalInventoryCostAmount),
    criticalInventoryCostAmount: toNumber(financialSummary.criticalInventoryCostAmount),
    expectedDisposalLossAmount30d: toNumber(financialSummary.expectedDisposalLossAmount30d),
    missingCostSkuCount: toNumber(financialSummary.missingCostSkuCount),
    missingCostStockQty: toNumber(financialSummary.missingCostStockQty),
  };
}

export function mapInventoryStatisticsSummary(summary = {}) {
  return {
    totalSkuCount: toNumber(summary.totalSkuCount),
    totalStockQty: toNumber(summary.totalStockQty),
    availableStockQty: toNumber(summary.availableStockQty),
    criticalSkuCount: toNumber(summary.criticalSkuCount),
    criticalStockQty: toNumber(summary.criticalStockQty),
    shortageSkuCount: toNumber(summary.shortageSkuCount),
    expectedDisposalQty30d: toNumber(summary.expectedDisposalQty30d),
    riskDistribution: mapRiskDistribution(summary.riskDistribution),
    dataQuality: mapDataQuality(summary.dataQuality),
    financialSummary: mapFinancialSummary(summary.financialSummary),
  };
}

function mapLocation(location = {}) {
  const summary = mapInventoryStatisticsSummary(location);
  const region = location.region ?? '미분류';
  return {
    id: String(location.id ?? location.code ?? ''),
    code: location.code ?? String(location.id ?? ''),
    name: location.name ?? '',
    scopeType: location.scopeType ?? '',
    region: REGION_LABELS[region] ?? region,
    ...summary,
    criticalStockRatio: toNumber(location.criticalStockRatio),
  };
}

export function mapInventoryStatisticsResponse(response = {}) {
  const scopeSummaries = Object.fromEntries(
    Object.entries(response.scopeSummaries ?? {}).map(([scopeType, summary]) => [
      scopeType,
      mapInventoryStatisticsSummary(summary),
    ]),
  );

  return {
    asOfDate: response.asOfDate ?? null,
    calculatedAt: response.calculatedAt ?? null,
    canViewFinancials: Boolean(response.canViewFinancials),
    trendScopeType: response.trendScopeType ?? 'NATIONAL',
    trendScopeCode: response.trendScopeCode ?? 'ALL',
    scopeSummaries,
    locations: (response.locations ?? []).map(mapLocation),
    dailyTrend: (response.dailyTrend ?? []).map((point) => {
      const totalStockQty = toNumber(point.totalStockQty);
      const criticalSkuCount = toNumber(point.criticalSkuCount);
      const warningSkuCount = toNumber(point.warningSkuCount);
      const criticalStockQty = toNumber(point.criticalStockQty);
      const riskStockQty = toNumber(point.riskStockQty ?? point.criticalStockQty);

      return {
        date: point.date,
        totalStockQty,
        criticalSkuCount,
        warningSkuCount,
        riskSkuCount: toNumber(point.riskSkuCount ?? criticalSkuCount + warningSkuCount),
        riskStockQty,
        riskStockRatio: toNumber(point.riskStockRatio ?? (totalStockQty ? (riskStockQty / totalStockQty) * 100 : 0)),
        warningStockQty: toNumber(point.warningStockQty ?? Math.max(0, riskStockQty - criticalStockQty)),
        expectedDisposalQty30d: toNumber(point.expectedDisposalQty30d),
        expectedDisposalLossAmount30d: toNumber(point.expectedDisposalLossAmount30d),
        shortageSkuCount: toNumber(point.shortageSkuCount),
        criticalStockQty,
      };
    }),
  };
}

export function mapStrategyStatisticsResponse(response = {}) {
  const summary = response.summary ?? {};
  const mappedSummary = {
    completedCount: toNumber(summary.completedCount),
    goalAchievedCount: toNumber(summary.goalAchievedCount),
    goalAchievedStrategyRate: toNumber(summary.goalAchievedStrategyRate),
    averageAchievementRate: toNumber(summary.averageAchievementRate),
    baselineRiskStockQty: toNumber(summary.baselineRiskStockQty),
    endRiskStockQty: toNumber(summary.endRiskStockQty),
    riskStockReductionQty: toNumber(summary.riskStockReductionQty),
    riskStockReductionRate: toNumber(summary.riskStockReductionRate),
    baselineExpectedDisposalQty: toNumber(summary.baselineExpectedDisposalQty),
    endExpectedDisposalQty: toNumber(summary.endExpectedDisposalQty),
    avoidedDisposalQty: toNumber(summary.avoidedDisposalQty),
    baselineEstimatedLossAmount: toNumber(summary.baselineEstimatedLossAmount),
    endEstimatedLossAmount: toNumber(summary.endEstimatedLossAmount),
    estimatedLossSavingsAmount: toNumber(summary.estimatedLossSavingsAmount),
  };
  const mapPerformance = (item = {}) => ({
    id: String(item.id ?? item.code ?? ''),
    code: item.code ?? String(item.id ?? ''),
    name: item.name ?? '',
    scopeType: item.scopeType ?? '',
    completedCount: toNumber(item.completedCount),
    goalAchievementRate: toNumber(item.goalAchievementRate),
    baselineRiskStockQty: toNumber(item.baselineRiskStockQty),
    riskStockReductionQty: toNumber(item.riskStockReductionQty),
    riskStockReductionRate: toNumber(item.riskStockReductionRate),
    estimatedLossSavingsAmount: toNumber(item.estimatedLossSavingsAmount),
  });

  return {
    fromDate: response.fromDate ?? null,
    toDate: response.toDate ?? null,
    scopeType: response.scopeType ?? 'NATIONAL',
    scopeCode: response.scopeCode ?? 'ALL',
    summary: mappedSummary,
    beforeAfterComparison: [
      {
        key: 'risk-stock',
        label: '위험재고',
        before: mappedSummary.baselineRiskStockQty,
        after: mappedSummary.endRiskStockQty,
        reduction: mappedSummary.riskStockReductionQty,
        format: 'quantity',
      },
      {
        key: 'disposal-risk',
        label: '폐기위험 재고',
        before: mappedSummary.baselineExpectedDisposalQty,
        after: mappedSummary.endExpectedDisposalQty,
        reduction: mappedSummary.avoidedDisposalQty,
        format: 'quantity',
      },
      {
        key: 'estimated-loss',
        label: '추정 손실액',
        before: mappedSummary.baselineEstimatedLossAmount,
        after: mappedSummary.endEstimatedLossAmount,
        reduction: mappedSummary.estimatedLossSavingsAmount,
        format: 'currency',
      },
    ],
    locationPerformance: (response.locationPerformance ?? []).map(mapPerformance),
    scopePerformance: (response.scopePerformance ?? []).map(mapPerformance),
    dailyTrend: (response.dailyTrend ?? []).map((point) => ({
      date: point.date,
      completedCount: toNumber(point.completedCount),
      goalAchievedCount: toNumber(point.goalAchievedCount),
      achievementRate: toNumber(point.achievementRate),
      baselineRiskStockQty: toNumber(point.baselineRiskStockQty),
      riskStockReductionQty: toNumber(point.riskStockReductionQty),
      avoidedDisposalQty: toNumber(point.avoidedDisposalQty),
      estimatedLossSavingsAmount: toNumber(point.estimatedLossSavingsAmount),
    })),
    actionCombinationBreakdown: (response.actionCombinationBreakdown ?? []).map((item) => ({
      code: item.code ?? 'NO_ACTION',
      label: item.label ?? '액션 미등록',
      completedCount: toNumber(item.completedCount),
      averageAchievementRate: toNumber(item.averageAchievementRate),
      riskReductionRate: toNumber(item.riskReductionRate),
      avoidedDisposalQty: toNumber(item.avoidedDisposalQty),
      estimatedLossSavingsAmount: toNumber(item.estimatedLossSavingsAmount),
    })),
  };
}
