import { describe, expect, it } from 'vitest';
import {
  getScopeLocations,
  getStatisticsGranularity,
  getStatisticsPeriodRange,
  selectStatisticsTrend,
  sortLocationsByRisk,
} from './statisticsModel.js';

describe('statisticsModel', () => {
  it('최근 30일을 기준일 포함 범위로 계산한다', () => {
    expect(getStatisticsPeriodRange('30D', '2026-08-16')).toEqual({
      from: '2026-07-18',
      to: '2026-08-16',
    });
  });

  it('직접 선택 날짜가 역순이면 올바른 범위로 정렬한다', () => {
    expect(getStatisticsPeriodRange('CUSTOM', '2026-08-16', { from: '2026-08-16', to: '2026-08-01' })).toEqual({
      from: '2026-08-01',
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
});
