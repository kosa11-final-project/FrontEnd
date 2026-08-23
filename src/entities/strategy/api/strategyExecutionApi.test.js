import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getJson } = vi.hoisted(() => ({ getJson: vi.fn() }));

vi.mock('@/shared/api', () => ({ getJson }));

import {
  getStrategyExecution,
  getStrategyExecutions,
  mapStrategyExecutionPageResponse,
  mapStrategyExecutionResponse,
} from './strategyExecutionApi.js';

const backendExecution = {
  id: 721,
  number: 'SC-20260820-001',
  status: 'EXECUTING',
  product: { skuId: 1297, name: '테스트 상품', sku: 'SKU-001', imageUrl: null },
  establishedAt: '2026-08-20',
  progress: null,
  goal: null,
  resultSummary: null,
  actions: [
    {
      id: 81,
      type: 'REALLOCATION',
      title: '재고 재할당',
      target: '광주센터 → 그리팅몰',
      relationship: null,
      dependsOn: null,
      status: null,
      progress: null,
      sourceSalesPoint: null,
      targetSalesPoint: { id: 3, code: 'GREETING', name: '그리팅몰', type: 'SALES_POINT' },
      sourceWarehouse: { id: 7, code: 'WH-GJ', name: '광주센터', type: 'WAREHOUSE' },
      destinationWarehouse: null,
      kpis: [{ label: '요청 수량', value: 0, unit: '개', representative: true, emptyLabel: '미수집' }],
    },
    { id: 82, type: 'PRICE_DISCOUNT', kpis: [] },
  ],
  inventoryResults: null,
  inventoryTransfers: [
    {
      fromLocationId: 7,
      fromLocationName: '광주센터',
      toLocationId: 3,
      toLocationName: '그리팅몰',
      quantity: 480,
    },
  ],
  channelResults: [],
  salesDaily: [],
  salesPointComparison: [],
  performance: null,
  lastSyncedAt: null,
};

describe('strategy execution API', () => {
  beforeEach(() => getJson.mockReset());

  it('maps the paged execution list and sends only the provided query parameters', async () => {
    getJson.mockResolvedValue({
      data: {
        content: [backendExecution],
        page: 1,
        size: 10,
        totalElements: 21,
        totalPages: 3,
        first: false,
        last: false,
      },
      timestamp: '2026-08-20T00:00:00Z',
    });

    const params = { page: 1, size: 10, query: '왕교자', status: 'EXECUTING' };
    const signal = new AbortController().signal;
    const result = await getStrategyExecutions(params, signal);

    expect(getJson).toHaveBeenCalledWith({ path: 'v1/strategy-executions', params, signal });
    expect(result).toMatchObject({ page: 2, size: 10, totalElements: 21, totalPages: 3 });
    expect(result.items[0].id).toBe(721);
    expect(result.items[0].actions).toHaveLength(2);
    expect(result.items[0].actions[0].kpis[0].value).toBe(0);
    expect(result.items[0].actions[1].type).toBe('PRICE_DISCOUNT');
  });

  it('keeps the list mapper compatible with an empty or legacy array response', () => {
    expect(mapStrategyExecutionPageResponse({ data: [] })).toEqual({
      items: [],
      page: 1,
      size: 10,
      totalElements: 0,
      totalPages: 1,
      first: true,
      last: true,
    });
  });

  it('uses strategyCaseId for detail and preserves nullable fields', async () => {
    const signal = new AbortController().signal;
    getJson.mockResolvedValue({ data: backendExecution });

    const result = await getStrategyExecution(721, signal);

    expect(getJson).toHaveBeenCalledWith({ path: 'v1/strategy-executions/721', signal });
    expect(result.progress).toBeNull();
    expect(result.inventoryResults).toEqual([]);
    expect(result.inventoryTransfers).toEqual([
      {
        fromLocationId: 7,
        fromLocationName: '광주센터',
        toLocationId: 3,
        toLocationName: '그리팅몰',
        quantity: 480,
      },
    ]);
    expect(result.actions[0].dependsOn).toEqual([]);
    expect(result).not.toHaveProperty('sync');
    expect(result).not.toHaveProperty('warnings');
    expect(result).not.toHaveProperty('recommendations');
  });

  it('normalizes empty backend collections without inventing performance data', () => {
    expect(mapStrategyExecutionResponse({ id: 1, product: null })).toMatchObject({
      id: 1,
      actions: [],
      inventoryResults: [],
      inventoryTransfers: [],
      channelResults: [],
      salesDaily: [],
      salesPointComparison: [],
      performance: null,
      lastSyncedAt: null,
    });
  });
});
