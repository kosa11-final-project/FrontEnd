import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INVENTORY_FILTERS,
  applyFilterChanges,
  parseInventoryFilters,
  serializeInventoryFilters,
  toInventoryQueryParams,
} from './filterState.js';

describe('Inventory Filter State (URL SearchParams)', () => {
  it('returns default values when params are empty', () => {
    const filters = parseInventoryFilters('');
    expect(filters).toEqual(DEFAULT_INVENTORY_FILTERS);
    expect(filters.page).toBe(1);
    expect(filters.size).toBe(20);
    expect(filters.channelType).toEqual([]);
    expect(filters.detailTab).toBe('OVERVIEW');
  });

  it('correctly parses valid search params and repeated multi-value keys', () => {
    const raw =
      '?q=만두&channelType=GREETING&channelType=HMART&storageType=FROZEN&riskGrade=CAUTION&page=2&size=50&sort=availableQuantity,asc&detailSkuCode=SKU-1&detailSalesPointCode=SP-1&detailTab=LOTS';
    const filters = parseInventoryFilters(raw);

    expect(filters.q).toBe('만두');
    expect(filters.channelType).toEqual(['GREETING', 'HMART']);
    expect(filters.storageType).toEqual(['FROZEN']);
    expect(filters.riskGrade).toEqual(['CAUTION']);
    expect(filters.page).toBe(2);
    expect(filters.size).toBe(50);
    expect(filters.sort).toBe('availableQuantity,asc');
    expect(filters.detailSkuCode).toBe('SKU-1');
    expect(filters.detailSalesPointCode).toBe('SP-1');
    expect(filters.detailTab).toBe('LOTS');
  });

  it('preserves comma-containing unvalidated codes as one value', () => {
    expect(parseInventoryFilters('?salesPointCode=STORE_1,STORE_2&salesPointCode=STORE_3').salesPointCode).toEqual([
      'STORE_1,STORE_2',
      'STORE_3',
    ]);
  });

  it('splits comma-separated values only for validated enum filters', () => {
    expect(parseInventoryFilters('?channelType=GREETING,HMART').channelType).toEqual(['GREETING', 'HMART']);
  });

  it('rejects invalid enum values and falls back safely', () => {
    const raw = '?channelType=INVALID_CHANNEL&riskGrade=SUPER_RISK&storageType=WARM&page=-5&detailTab=INVALID_TAB';
    const filters = parseInventoryFilters(raw);

    expect(filters.channelType).toEqual([]);
    expect(filters.riskGrade).toEqual([]);
    expect(filters.storageType).toEqual([]);
    expect(filters.page).toBe(1);
    expect(filters.detailTab).toBe('OVERVIEW');
  });

  it('clamps page size to the API maximum of 100', () => {
    expect(parseInventoryFilters('?size=101').size).toBe(100);
    expect(parseInventoryFilters('?size=200').size).toBe(100);
  });

  it('normalizes invalid category and sort URL values before sending them to the API', () => {
    const filters = parseInventoryFilters('?categoryId=not-a-number&sort=unsupported,sideways');

    expect(filters.categoryId).toBe('');
    expect(filters.sort).toBe('updatedAt,desc');
  });

  it('keeps drawer state out of list and summary API parameters', () => {
    const params = toInventoryQueryParams({
      q: '만두',
      page: 2,
      size: 50,
      detailSkuCode: 'SKU-1',
      detailSalesPointCode: 'STORE-1',
      detailTab: 'LOTS',
    });

    expect(params).toEqual({ q: '만두', page: 2, size: 50, sort: 'updatedAt,desc' });
  });

  it('serializes and parses round-trip preserving multi-value filter state', () => {
    const initial = {
      q: '비비고',
      channelType: ['GREETING', 'HYUNDAI_DEPT'],
      salesPointCode: ['STORE_1', 'STORE_2'],
      warehouseCode: ['GYEONGIN_1'],
      storageType: ['COLD', 'FROZEN'],
      riskGrade: ['DANGER'],
      page: 3,
      size: 30,
      sort: 'currentQuantity,desc',
      detailSkuCode: 'SKU-MANDU',
      detailSalesPointCode: 'STORE_1',
      detailTab: 'LOTS',
    };

    const serialized = serializeInventoryFilters(initial);
    const parsed = parseInventoryFilters(serialized);

    expect(parsed).toEqual(expect.objectContaining(initial));
  });

  it('resets page to 1 when search filters change, but retains page during pagination or detail context changes', () => {
    const current = {
      q: '만두',
      channelType: ['GREETING'],
      page: 4,
    };

    // 필터 변경 시
    const filterChanged = applyFilterChanges(current, { channelType: ['ECOMMERCE'] });
    expect(filterChanged.channelType).toEqual(['ECOMMERCE']);
    expect(filterChanged.page).toBe(1);

    // 페이지 변경 시
    const pageChanged = applyFilterChanges(current, { page: 5 });
    expect(pageChanged.page).toBe(5);
    expect(pageChanged.channelType).toEqual(['GREETING']);

    // 상세 드로어 문맥 변경 시 페이지 유지
    const detailChanged = applyFilterChanges(current, { detailSkuCode: 'SKU-1', detailSalesPointCode: 'SP-1' });
    expect(detailChanged.page).toBe(4);
    expect(detailChanged.detailSkuCode).toBe('SKU-1');
  });
});
