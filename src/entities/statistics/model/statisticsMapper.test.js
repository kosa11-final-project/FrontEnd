import { describe, expect, it } from 'vitest';
import { mapInventoryStatisticsResponse, mapStrategyStatisticsResponse } from './statisticsMapper.js';

const summary = {
  totalSkuCount: 10,
  totalStockQty: 120.5,
  availableStockQty: 100,
  criticalSkuCount: 2,
  criticalStockQty: 30,
  shortageSkuCount: 1,
  expectedDisposalQty30d: 4,
  riskDistribution: [{ riskGrade: 'CRITICAL', skuCount: 2, stockQty: 30 }],
  dataQuality: {
    unassessedSkuCount: 1,
    unassessedStockQty: 3,
    missingForecastSkuCount: 2,
    missingForecastStockQty: 7,
  },
  financialSummary: {
    totalInventoryCostAmount: 1_000_000,
    criticalInventoryCostAmount: 300_000,
    expectedDisposalLossAmount30d: 40_000,
    missingCostSkuCount: 1,
    missingCostStockQty: 5,
  },
};

describe('statisticsMapper', () => {
  it('백엔드 재고 통계 계약을 화면 모델로 변환한다', () => {
    const result = mapInventoryStatisticsResponse({
      asOfDate: '2026-08-17',
      calculatedAt: '2026-08-17T01:00:00Z',
      canViewFinancials: true,
      trendScopeType: 'WAREHOUSE',
      trendScopeCode: 'SEONGNAM',
      scopeSummaries: { NATIONAL: summary },
      locations: [
        {
          ...summary,
          id: 'SEONGNAM',
          code: 'SEONGNAM',
          name: '성남 스마트푸드센터',
          scopeType: 'WAREHOUSE',
          region: 'GYEONGGI',
          criticalStockRatio: 25,
        },
      ],
      dailyTrend: [{ date: '2026-08-17', criticalSkuCount: 2, criticalStockQty: 30 }],
    });

    expect(result).toMatchObject({
      asOfDate: '2026-08-17',
      canViewFinancials: true,
      trendScopeType: 'WAREHOUSE',
      trendScopeCode: 'SEONGNAM',
    });
    expect(result.scopeSummaries.NATIONAL).toMatchObject({
      totalStockQty: 120.5,
      criticalStockQty: 30,
      dataQuality: { missingForecastStockQty: 7 },
    });
    expect(result.scopeSummaries.NATIONAL.riskDistribution).toHaveLength(5);
    expect(result.locations[0]).toMatchObject({
      id: 'SEONGNAM',
      name: '성남 스마트푸드센터',
      region: '경기권',
      criticalStockRatio: 25,
    });
    expect(result.dailyTrend[0]).toEqual({
      date: '2026-08-17',
      totalStockQty: 0,
      criticalSkuCount: 2,
      warningSkuCount: 0,
      riskSkuCount: 2,
      riskStockQty: 30,
      riskStockRatio: 0,
      warningStockQty: 0,
      expectedDisposalQty30d: 0,
      expectedDisposalLossAmount30d: 0,
      shortageSkuCount: 0,
      criticalStockQty: 30,
    });
  });

  it('선택 필드가 없을 때 안전한 기본 컬렉션과 숫자를 제공한다', () => {
    const result = mapInventoryStatisticsResponse({ scopeSummaries: { NATIONAL: {} } });

    expect(result.locations).toEqual([]);
    expect(result.dailyTrend).toEqual([]);
    expect(result.scopeSummaries.NATIONAL.totalStockQty).toBe(0);
    expect(result.scopeSummaries.NATIONAL.riskDistribution.map(({ riskGrade }) => riskGrade)).toEqual([
      'CRITICAL',
      'WARNING',
      'NORMAL',
      'GOOD',
      'UNASSESSED',
    ]);
  });

  it('AI 전략 성과와 액션 조합 숫자를 화면 모델로 변환한다', () => {
    const result = mapStrategyStatisticsResponse({
      fromDate: '2026-02-23',
      toDate: '2026-08-23',
      summary: {
        completedCount: '82',
        goalAchievedStrategyRate: '44.5',
        riskStockReductionQty: '23050.25',
      },
      dailyTrend: [{ date: '2026-08-23', completedCount: '3', achievementRate: '97.2' }],
      actionCombinationBreakdown: [
        {
          code: 'CHANNEL_EXPANSION+PRICE_DISCOUNT',
          label: '채널 확장 + 할인',
          completedCount: '12',
          riskReductionRate: '48.1',
        },
      ],
    });

    expect(result.summary).toMatchObject({
      completedCount: 82,
      goalAchievedStrategyRate: 44.5,
      riskStockReductionQty: 23050.25,
    });
    expect(result.dailyTrend[0]).toMatchObject({ completedCount: 3, achievementRate: 97.2 });
    expect(result.actionCombinationBreakdown[0]).toMatchObject({
      completedCount: 12,
      riskReductionRate: 48.1,
    });
  });
});
