import { describe, expect, it } from 'vitest';
import {
  mockEmptyInventoryListResponse,
  mockFilterEmptyInventoryListResponse,
  mockInventoryListResponse,
  mockInventorySummaryResponse,
} from './fixtures.js';
import { mapInventoryListResponse, mapInventorySummaryResponse } from '../model/inventoryMapper.js';
import { RESULT_STATE } from '../model/inventory.js';

describe('Inventory Fixtures Contract Verification', () => {
  it('maps mockInventoryListResponse and preserves all items and canonical rowId', () => {
    const mapped = mapInventoryListResponse(mockInventoryListResponse);
    expect(mapped.items.length).toBe(5);
    expect(mapped.totalCount).toBe(5);
    expect(mapped.resultState).toBe(RESULT_STATE.HAS_DATA);

    // 식별자 검증: skuCode:salesPointCode 중복 없음
    const rowIds = mapped.items.map((i) => i.rowId);
    expect(new Set(rowIds).size).toBe(rowIds.length);
  });

  it('correctly maps mockEmptyInventoryListResponse to NO_DATA result state', () => {
    const mapped = mapInventoryListResponse(mockEmptyInventoryListResponse);
    expect(mapped.items).toEqual([]);
    expect(mapped.totalCount).toBe(0);
    expect(mapped.resultState).toBe(RESULT_STATE.NO_DATA);
  });

  it('correctly maps mockFilterEmptyInventoryListResponse to FILTER_EMPTY result state', () => {
    const mapped = mapInventoryListResponse(mockFilterEmptyInventoryListResponse);
    expect(mapped.items).toEqual([]);
    expect(mapped.totalCount).toBe(0);
    expect(mapped.resultState).toBe(RESULT_STATE.FILTER_EMPTY);
  });

  it('maps mockInventorySummaryResponse with valid aggregate KPIs', () => {
    const mapped = mapInventorySummaryResponse(mockInventorySummaryResponse);
    expect(mapped.totalCurrentQuantity).toBe(2190);
    expect(mapped.totalAvailableQuantity).toBe(2000);
    expect(mapped.underSafetyCount).toBe(2);
    expect(mapped.dangerRiskCount).toBe(1);
  });
});
