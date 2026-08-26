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

    await expect(getInventories({ q: '만두', filterOperator: 'OR', page: 1, size: 20 }, signal)).resolves.toMatchObject(
      {
        totalCount: 1,
        items: [expect.objectContaining({ skuCode: 'SKU-1', currentQuantity: 12 })],
      },
    );
    expect(requestJson).toHaveBeenCalledWith({
      path: 'v1/inventories',
      method: 'get',
      params: { q: '만두', filterOperator: 'OR', page: 1, size: 20 },
      signal,
      timeout: 30_000,
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
      timeout: 30_000,
    });
    expect(requestJson).toHaveBeenNthCalledWith(2, {
      path: 'v1/inventories/filter-options',
      method: 'get',
      signal: undefined,
    });
  });

  it('forwards multiple category ids together with the selected operator', async () => {
    requestJson.mockResolvedValueOnce({ data: { items: [] } });

    await getInventories({ categoryIds: ['301', '302'], filterOperator: 'AND', page: 1, size: 20 });

    expect(requestJson).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { categoryIds: ['301', '302'], filterOperator: 'AND', page: 1, size: 20 },
      }),
    );
  });

  it('does not send list pagination to the summary endpoint', async () => {
    requestJson.mockResolvedValueOnce({ data: { totalCurrentQuantity: 10 } });

    await getInventorySummary({ q: '만두', page: 4, size: 50, sort: 'availableQuantity,desc' });

    expect(requestJson).toHaveBeenCalledWith({
      path: 'v1/inventories/summary',
      method: 'get',
      params: { q: '만두' },
      signal: undefined,
      timeout: 30_000,
    });
  });

  it('forwards every visible inventory filter group to both list and summary requests', async () => {
    const filters = {
      q: '만두',
      filterOperator: 'OR',
      channelType: ['GREETING'],
      salesPointCode: ['GREETING'],
      warehouseCode: ['GYEONGIN_1'],
      regionCode: ['GYEONGGI'],
      categoryId: '301',
      storageType: ['FROZEN'],
      riskGrade: ['NORMAL'],
      shortageYn: 'Y',
      assessmentStatus: ['ASSESSED'],
      page: 2,
      size: 50,
      sort: 'riskGrade,asc',
    };
    requestJson.mockResolvedValueOnce({ data: { items: [] } }).mockResolvedValueOnce({ data: {} });

    await getInventories(filters);
    await getInventorySummary(filters);

    expect(requestJson).toHaveBeenNthCalledWith(1, {
      path: 'v1/inventories',
      method: 'get',
      params: {
        q: '만두',
        filterOperator: 'OR',
        channelType: ['GREETING'],
        salesPointCode: ['GREETING'],
        warehouseCode: ['GYEONGIN_1'],
        categoryId: '301',
        storageType: ['FROZEN'],
        riskGrade: ['NORMAL'],
        shortageYn: 'Y',
        page: 2,
        size: 50,
        sort: 'riskGrade,asc',
      },
      signal: undefined,
      timeout: 30_000,
    });
    expect(requestJson).toHaveBeenNthCalledWith(2, {
      path: 'v1/inventories/summary',
      method: 'get',
      params: expect.objectContaining({
        q: '만두',
        filterOperator: 'OR',
        channelType: ['GREETING'],
        salesPointCode: ['GREETING'],
        warehouseCode: ['GYEONGIN_1'],
        categoryId: '301',
        storageType: ['FROZEN'],
        riskGrade: ['NORMAL'],
        shortageYn: 'Y',
      }),
      signal: undefined,
      timeout: 30_000,
    });
    expect(requestJson.mock.calls[0][0].params).not.toHaveProperty('regionCode');
    expect(requestJson.mock.calls[0][0].params).not.toHaveProperty('assessmentStatus');
    expect(requestJson.mock.calls[1][0].params).not.toHaveProperty('regionCode');
    expect(requestJson.mock.calls[1][0].params).not.toHaveProperty('assessmentStatus');
    expect(requestJson.mock.calls[1][0].params).not.toHaveProperty('page');
    expect(requestJson.mock.calls[1][0].params).not.toHaveProperty('size');
    expect(requestJson.mock.calls[1][0].params).not.toHaveProperty('sort');
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
