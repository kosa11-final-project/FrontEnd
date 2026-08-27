import { inventoryStatisticsFixture } from './statisticsFixtures.js';

const DAY_IN_MILLISECONDS = 86_400_000;

function cycle(value, size) {
  return ((value % size) + size) % size;
}

function buildCompletedStrategyTrend() {
  const pointCount = 800;
  const legacyPointCount = 400;
  const end = Date.UTC(2026, 7, 16);

  return Array.from({ length: pointCount }, (_, index) => {
    const seriesIndex = index - (pointCount - legacyPointCount);
    const date = new Date(end - (pointCount - 1 - index) * DAY_IN_MILLISECONDS).toISOString().slice(0, 10);
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const workingDayFactor = weekday === 0 || weekday === 6 ? 0.45 : 1;
    const completedCount = Math.max(0, Math.round((2.8 + Math.sin(seriesIndex / 5.5) * 1.1) * workingDayFactor));
    const achievementRate = completedCount
      ? Math.min(106, 77 + seriesIndex * 0.035 + Math.sin(seriesIndex / 9) * 4.5)
      : null;
    const goalAchievedRate = completedCount
      ? Math.min(0.92, Math.max(0.58, 0.74 + Math.sin(seriesIndex / 17) * 0.08 + (achievementRate - 80) * 0.007))
      : 0;
    const goalAchievedCount = Math.min(completedCount, Math.round(completedCount * goalAchievedRate));
    const baselineRiskStockQty = completedCount * (420 + cycle(seriesIndex, 11) * 18);
    const reductionRate = completedCount ? Math.min(72, 43 + seriesIndex * 0.035 + Math.sin(seriesIndex / 8) * 5) : 0;
    const riskStockReductionQty = Math.round(baselineRiskStockQty * (reductionRate / 100));
    const avoidedDisposalQty = Math.round(riskStockReductionQty * (0.17 + cycle(seriesIndex, 4) * 0.015));
    const estimatedLossSavingsAmount = avoidedDisposalQty * (6_300 + cycle(seriesIndex, 6) * 350);

    return {
      date,
      completedCount,
      goalAchievedCount,
      achievementRate,
      baselineRiskStockQty,
      riskStockReductionQty,
      avoidedDisposalQty,
      estimatedLossSavingsAmount,
    };
  });
}

function buildLocationPerformance() {
  const reductionRates = {
    WAREHOUSE: [32.5, 28.9, 27.4, 21.8, 25.2, 23.6, 17.4, 19.7],
    OFFLINE_STORE: [29.7, 26.8, 24.9, 23.4, 20.8, 18.9],
    ONLINE_STORE: [34.6, 27.8],
  };
  const scopeIndexes = { WAREHOUSE: 0, OFFLINE_STORE: 0, ONLINE_STORE: 0 };

  return inventoryStatisticsFixture.locations.map((location, index) => {
    const scopeIndex = scopeIndexes[location.scopeType]++;
    const riskStockReductionRate = reductionRates[location.scopeType][scopeIndex];
    const baselineRiskStockQty = Math.max(620, Math.round(location.criticalStockQty * 0.27));
    const riskStockReductionQty = Math.round(baselineRiskStockQty * (riskStockReductionRate / 100));

    return {
      id: location.id,
      code: location.code,
      name: location.name,
      scopeType: location.scopeType,
      completedCount: Math.max(3, 14 - index),
      goalAchievementRate: Math.max(72, 92 - index * 1.15),
      baselineRiskStockQty,
      riskStockReductionQty,
      riskStockReductionRate,
      estimatedLossSavingsAmount: riskStockReductionQty * (3_100 + (index % 4) * 280),
    };
  });
}

export const strategyStatisticsFixture = Object.freeze({
  asOfDate: '2026-08-16',
  dailyTrend: Object.freeze(buildCompletedStrategyTrend()),
  actionCombinationBreakdown: Object.freeze([
    {
      code: 'PRICE_DISCOUNT',
      label: '할인',
      completedCount: 18,
      averageAchievementRate: 82.4,
      riskReductionRate: 46.8,
      avoidedDisposalQty: 1_240,
      estimatedLossSavingsAmount: 8_310_000,
    },
    {
      code: 'REALLOCATION+PRICE_DISCOUNT',
      label: '재고 이동 + 할인',
      completedCount: 12,
      averageAchievementRate: 89.1,
      riskReductionRate: 63.5,
      avoidedDisposalQty: 1_860,
      estimatedLossSavingsAmount: 13_420_000,
    },
    {
      code: 'CHANNEL_EXPANSION+PRICE_DISCOUNT',
      label: '채널 확장 + 할인',
      completedCount: 9,
      averageAchievementRate: 85.6,
      riskReductionRate: 57.2,
      avoidedDisposalQty: 1_110,
      estimatedLossSavingsAmount: 7_980_000,
    },
    {
      code: 'RT_TRANSFER',
      label: 'RT',
      completedCount: 7,
      averageAchievementRate: 78.3,
      riskReductionRate: 41.7,
      avoidedDisposalQty: 620,
      estimatedLossSavingsAmount: 4_260_000,
    },
    {
      code: 'CHANNEL_EXPANSION+PRICE_DISCOUNT+REALLOCATION',
      label: '채널 확장 + 할인 + 재고 이동',
      completedCount: 3,
      averageAchievementRate: 91.8,
      riskReductionRate: 68.4,
      avoidedDisposalQty: 540,
      estimatedLossSavingsAmount: 3_910_000,
    },
  ]),
  locationPerformance: Object.freeze(buildLocationPerformance()),
});
