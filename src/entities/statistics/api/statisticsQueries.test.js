import { describe, expect, it } from 'vitest';
import { inventoryStatisticsQueryOptions, statisticsKeys } from './statisticsQueries.js';

describe('statisticsQueries', () => {
  it('조회 조건별 재고 통계 캐시 키를 만든다', () => {
    const params = {
      fromDate: '2026-07-19',
      toDate: '2026-08-17',
      scopeType: 'NATIONAL',
      scopeCode: 'ALL',
    };

    const options = inventoryStatisticsQueryOptions(params);

    expect(statisticsKeys.inventory(params)).toEqual(['statistics', 'inventory', params]);
    expect(options.queryKey).toEqual(['statistics', 'inventory', params]);
    expect(options.staleTime).toBe(60_000);
    expect(typeof options.queryFn).toBe('function');
    expect(typeof options.select).toBe('function');
  });
});
