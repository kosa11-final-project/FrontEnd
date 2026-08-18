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
    dailyTrend: (response.dailyTrend ?? []).map((point) => ({
      date: point.date,
      criticalSkuCount: toNumber(point.criticalSkuCount),
      criticalStockQty: toNumber(point.criticalStockQty),
    })),
  };
}
