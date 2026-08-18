import { describe, expect, it } from 'vitest';
import { mapInventoryStatisticsResponse } from './statisticsMapper.js';

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
      criticalSkuCount: 2,
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
});
