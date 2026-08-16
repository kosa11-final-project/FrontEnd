import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestJson } = vi.hoisted(() => ({ requestJson: vi.fn() }));

vi.mock('@/shared/api', () => ({ requestJson }));

import {
  getInventories,
  getInventoryDetail,
  getInventoryFilterOptions,
  getInventoryLots,
  getInventorySummary,
} from './inventoryApi.js';

describe('inventoryApi', () => {
  beforeEach(() => requestJson.mockReset());

  it('maps the backend inventory list envelope and forwards query params and abort signal', async () => {
    const signal = new AbortController().signal;
    requestJson.mockResolvedValueOnce({
      data: {
        items: [{ skuCode: 'SKU-1', salesPointCode: 'STORE-1', currentQuantity: 12 }],
        totalCount: 1,
        page: 1,
        size: 20,
        totalPages: 1,
        isFilterEmpty: false,
      },
    });

    await expect(getInventories({ q: '만두', page: 1, size: 20 }, signal)).resolves.toMatchObject({
      totalCount: 1,
      items: [expect.objectContaining({ skuCode: 'SKU-1', currentQuantity: 12 })],
    });
    expect(requestJson).toHaveBeenCalledWith({
      path: 'v1/inventories',
      method: 'get',
      params: { q: '만두', page: 1, size: 20 },
      signal,
    });
  });

  it('calls summary and filter option endpoints separately', async () => {
    requestJson
      .mockResolvedValueOnce({ data: { totalCurrentQuantity: 10, totalAvailableQuantity: 8 } })
      .mockResolvedValueOnce({ data: { channels: [{ code: 'GREETING', name: '그리팅' }] } });

    await expect(getInventorySummary({ q: '만두' })).resolves.toMatchObject({ totalCurrentQuantity: 10 });
    await expect(getInventoryFilterOptions()).resolves.toMatchObject({
      channels: [{ code: 'GREETING', name: '그리팅' }],
    });

    expect(requestJson).toHaveBeenNthCalledWith(1, {
      path: 'v1/inventories/summary',
      method: 'get',
      params: { q: '만두' },
      signal: undefined,
    });
    expect(requestJson).toHaveBeenNthCalledWith(2, {
      path: 'v1/inventories/filter-options',
      method: 'get',
      signal: undefined,
    });
  });

  it('does not send list pagination to the summary endpoint', async () => {
    requestJson.mockResolvedValueOnce({ data: { totalCurrentQuantity: 10 } });

    await getInventorySummary({ q: '만두', page: 4, size: 50, sort: 'availableQuantity,desc' });

    expect(requestJson).toHaveBeenCalledWith({
      path: 'v1/inventories/summary',
      method: 'get',
      params: { q: '만두' },
      signal: undefined,
    });
  });

  it('encodes detail identifiers and maps detail and LOT responses', async () => {
    requestJson
      .mockResolvedValueOnce({
        data: {
          skuCode: 'SKU/1',
          salesPointCode: 'STORE 1',
          risk: { grade: 'SAFE', assessmentStatus: 'ASSESSED', reason: '정상' },
          lots: [{ id: 101, lotNumber: 'LOT-1', quantity: 4, expiryDays: 12 }],
        },
      })
      .mockResolvedValueOnce({ data: { items: [{ id: 101, lotNumber: 'LOT-1', quantity: 4 }], totalCount: 1 } });

    await expect(getInventoryDetail('SKU/1', 'STORE 1')).resolves.toMatchObject({
      skuCode: 'SKU/1',
      salesPointCode: 'STORE 1',
      lots: [expect.objectContaining({ lotNumber: 'LOT-1' })],
    });
    await expect(getInventoryLots('SKU/1', 'STORE 1')).resolves.toMatchObject({
      totalCount: 1,
      items: [expect.objectContaining({ lotNumber: 'LOT-1', quantity: 4 })],
    });

    expect(requestJson).toHaveBeenNthCalledWith(1, {
      path: 'v1/inventories/SKU%2F1/sales-points/STORE%201',
      method: 'get',
      signal: undefined,
    });
    expect(requestJson).toHaveBeenNthCalledWith(2, {
      path: 'v1/inventories/SKU%2F1/sales-points/STORE%201/lots',
      method: 'get',
      signal: undefined,
    });
  });
});
