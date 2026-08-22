import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestJson } = vi.hoisted(() => ({ requestJson: vi.fn() }));

vi.mock('@/shared/api', () => ({ requestJson }));

import { getInventoryStatistics, getStrategyStatistics } from './statisticsApi.js';

describe('statisticsApi', () => {
  beforeEach(() => requestJson.mockReset());

  it('재고 통계 조회 조건과 중단 신호를 전달하고 API envelope를 해제한다', async () => {
    const signal = new AbortController().signal;
    const data = { asOfDate: '2026-08-17', scopeSummaries: { NATIONAL: {} } };
    requestJson.mockResolvedValueOnce({ data });

    await expect(
      getInventoryStatistics(
        {
          fromDate: '2026-07-19',
          toDate: '2026-08-17',
          scopeType: 'WAREHOUSE',
          scopeCode: 'SEONGNAM',
          ignored: 'value',
        },
        signal,
      ),
    ).resolves.toBe(data);

    expect(requestJson).toHaveBeenCalledWith({
      path: 'v1/statistics/inventory',
      method: 'get',
      params: {
        fromDate: '2026-07-19',
        toDate: '2026-08-17',
        scopeType: 'WAREHOUSE',
        scopeCode: 'SEONGNAM',
      },
      signal,
    });
  });

  it('초기 조회에서는 빈 query parameter만 전달한다', async () => {
    requestJson.mockResolvedValueOnce({ data: {} });

    await getInventoryStatistics({ scopeCode: '' });

    expect(requestJson).toHaveBeenCalledWith({
      path: 'v1/statistics/inventory',
      method: 'get',
      params: {},
      signal: undefined,
    });
  });

  it('AI 전략 통계 조회 조건을 별도 API에 전달한다', async () => {
    const signal = new AbortController().signal;
    const data = { summary: { completedCount: 12 } };
    requestJson.mockResolvedValueOnce({ data });

    await expect(
      getStrategyStatistics(
        {
          fromDate: '2026-02-23',
          toDate: '2026-08-23',
          scopeType: 'ONLINE_STORE',
          scopeCode: 'ONLINE_MALL',
          ignored: 'value',
        },
        signal,
      ),
    ).resolves.toBe(data);

    expect(requestJson).toHaveBeenCalledWith({
      path: 'v1/statistics/strategies',
      method: 'get',
      params: {
        fromDate: '2026-02-23',
        toDate: '2026-08-23',
        scopeType: 'ONLINE_STORE',
        scopeCode: 'ONLINE_MALL',
      },
      signal,
    });
  });
});
