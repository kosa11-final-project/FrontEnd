import { describe, expect, it } from 'vitest';
import {
  buildInventoryImprovementInsight,
  buildStatisticsQueryParams,
  getScopeLocations,
  getStatisticsGranularity,
  getStatisticsPeriodRange,
  selectStatisticsTrend,
  sortLocationsByRisk,
} from './statisticsModel.js';

describe('statisticsModel', () => {
  function createInventorySummary({ riskStockQty, disposalRiskQty, shortageSkuCount }) {
    return {
      expectedDisposalQty30d: disposalRiskQty,
      shortageSkuCount,
      riskDistribution: [
        { riskGrade: 'CRITICAL', stockQty: Math.round(riskStockQty * 0.3) },
        { riskGrade: 'WARNING', stockQty: riskStockQty - Math.round(riskStockQty * 0.3) },
      ],
    };
  }

  it('위험재고·폐기위험·부족 SKU가 모두 줄면 전반적 개선으로 판정한다', () => {
    const insight = buildInventoryImprovementInsight(
      createInventorySummary({ riskStockQty: 900, disposalRiskQty: 80, shortageSkuCount: 95 }),
      createInventorySummary({ riskStockQty: 1_000, disposalRiskQty: 100, shortageSkuCount: 100 }),
    );

    expect(insight.status).toBe('IMPROVED');
    expect(insight.description).toBe(
      '직전 동일 기간 대비 위험재고는 10.0% 감소, 폐기위험은 20.0% 감소, 부족 SKU는 5.0% 감소했습니다.',
    );
  });

  it('위험재고는 줄고 부족 SKU가 늘면 일부 개선으로 판정한다', () => {
    const insight = buildInventoryImprovementInsight(
      createInventorySummary({ riskStockQty: 900, disposalRiskQty: 80, shortageSkuCount: 110 }),
      createInventorySummary({ riskStockQty: 1_000, disposalRiskQty: 100, shortageSkuCount: 100 }),
    );

    expect(insight.status).toBe('MIXED');
  });

  it('직전 기간 데이터가 없으면 비교 불가로 판정한다', () => {
    const insight = buildInventoryImprovementInsight(
      createInventorySummary({ riskStockQty: 900, disposalRiskQty: 80, shortageSkuCount: 95 }),
      null,
    );

    expect(insight.status).toBe('NOT_COMPARABLE');
  });

  it('최근 30일을 기준일 포함 범위로 계산한다', () => {
    expect(getStatisticsPeriodRange('30D', '2026-08-16')).toEqual({
      from: '2026-07-18',
      to: '2026-08-16',
    });
  });

  it('최근 1년을 기준일 포함 365일 범위로 계산한다', () => {
    expect(getStatisticsPeriodRange('1Y', '2026-08-16')).toEqual({
      from: '2025-08-17',
      to: '2026-08-16',
    });
  });

  it('직접 선택 날짜가 역순이면 올바른 범위로 정렬한다', () => {
    expect(getStatisticsPeriodRange('CUSTOM', '2026-08-16', { from: '2026-08-16', to: '2026-08-01' })).toEqual({
      from: '2026-08-01',
      to: '2026-08-16',
    });
  });

  it('직접 선택 기간이 1년을 넘으면 종료일 기준 최근 365일로 제한한다', () => {
    expect(getStatisticsPeriodRange('CUSTOM', '2026-08-16', { from: '2024-01-01', to: '2026-08-16' })).toEqual({
      from: '2025-08-17',
      to: '2026-08-16',
    });
  });

  it('기간 길이에 따라 일별·주별·월별 단위를 선택한다', () => {
    expect(getStatisticsGranularity({ from: '2026-08-01', to: '2026-08-16' })).toBe('DAILY');
    expect(getStatisticsGranularity({ from: '2026-05-01', to: '2026-08-16' })).toBe('WEEKLY');
    expect(getStatisticsGranularity({ from: '2025-01-01', to: '2026-08-16' })).toBe('MONTHLY');
  });

  it('주별 추이에서도 기간 마지막 값을 보존한다', () => {
    const points = Array.from({ length: 40 }, (_, index) => ({
      date: new Date(Date.UTC(2026, 6, index + 1)).toISOString().slice(0, 10),
      criticalStockQty: index,
    }));
    const result = selectStatisticsTrend(points, { from: '2026-07-01', to: '2026-08-09' });

    expect(result.at(-1)).toEqual(points.at(-1));
  });

  it('위치 유형을 분리하고 위험재고 비율순으로 정렬한다', () => {
    const locations = [
      { id: 'A', scopeType: 'WAREHOUSE', criticalStockRatio: 3, criticalStockQty: 20, name: '가' },
      { id: 'B', scopeType: 'OFFLINE_STORE', criticalStockRatio: 12, criticalStockQty: 30, name: '나' },
      { id: 'C', scopeType: 'WAREHOUSE', criticalStockRatio: 8, criticalStockQty: 10, name: '다' },
    ];

    expect(getScopeLocations(locations, 'WAREHOUSE').map(({ id }) => id)).toEqual(['A', 'C']);
    expect(sortLocationsByRisk(locations, 'WAREHOUSE').map(({ id }) => id)).toEqual(['C', 'A']);
  });

  it('선택한 기간과 통계 범위를 API 조회 조건으로 변환한다', () => {
    expect(
      buildStatisticsQueryParams({
        range: { from: '2026-08-01', to: '2026-08-17' },
        scopeType: 'WAREHOUSE',
        locationId: 'SEONGNAM',
      }),
    ).toEqual({
      fromDate: '2026-08-01',
      toDate: '2026-08-17',
      scopeType: 'WAREHOUSE',
      scopeCode: 'SEONGNAM',
    });

    expect(
      buildStatisticsQueryParams({
        range: { from: '2026-08-01', to: '2026-08-17' },
        scopeType: 'UNASSIGNED',
      }).scopeCode,
    ).toBe('UNASSIGNED');
  });
});
