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
    expect(filters.filterOperator).toBe('AND');
    expect(filters.page).toBe(1);
    expect(filters.size).toBe(20);
    expect(filters.channelType).toEqual([]);
    expect(filters.detailTab).toBe('OVERVIEW');
  });

  it('correctly parses valid search params and repeated multi-value keys', () => {
    const raw =
      '?q=만두&channelType=GREETING&channelType=HMART&storageType=FROZEN&riskGrade=CAUTION&shortageYn=Y&filterOperator=OR&page=2&size=50&sort=availableQuantity,asc&detailSkuCode=SKU-1&detailSalesPointCode=SP-1&detailTab=FORECAST';
    const filters = parseInventoryFilters(raw);

    expect(filters.q).toBe('만두');
    expect(filters.channelType).toEqual(['GREETING', 'HMART']);
    expect(filters.storageType).toEqual(['FROZEN']);
    expect(filters.riskGrade).toEqual(['CAUTION']);
    expect(filters.shortageYn).toBe('Y');
    expect(filters.filterOperator).toBe('OR');
    expect(filters.page).toBe(2);
    expect(filters.size).toBe(50);
    expect(filters.sort).toBe('availableQuantity,asc');
    expect(filters.detailSkuCode).toBe('SKU-1');
    expect(filters.detailSalesPointCode).toBe('SP-1');
    expect(filters.detailTab).toBe('FORECAST');
  });

  it('parses repeated category ids while keeping the legacy first category id', () => {
    const filters = parseInventoryFilters('?categoryId=301&categoryId=302');

    expect(filters.categoryIds).toEqual(['301', '302']);
    expect(filters.categoryId).toBe('301');
  });

  it('correctly parses FORECAST detailTab', () => {
    const filters = parseInventoryFilters('?detailSkuCode=SKU-1&detailTab=FORECAST');
    expect(filters.detailTab).toBe('FORECAST');
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
    const raw =
      '?channelType=INVALID_CHANNEL&riskGrade=SUPER_RISK&storageType=WARM&filterOperator=XOR&page=-5&detailTab=INVALID_TAB';
    const filters = parseInventoryFilters(raw);

    expect(filters.channelType).toEqual([]);
    expect(filters.riskGrade).toEqual([]);
    expect(filters.storageType).toEqual([]);
    expect(filters.filterOperator).toBe('AND');
    expect(filters.page).toBe(1);
    expect(filters.detailTab).toBe('OVERVIEW');
  });

  it('drops assessment statuses that the inventory API cannot produce', () => {
    const filters = parseInventoryFilters('?assessmentStatus=STALE&assessmentStatus=ASSESSED');

    expect(filters.assessmentStatus).toEqual(['ASSESSED']);
  });

  it('falls back to OVERVIEW when legacy detailTab=LOTS is passed in URL', () => {
    const filters = parseInventoryFilters('?detailSkuCode=SKU-1&detailTab=LOTS');
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
      detailTab: 'FORECAST',
    });

    expect(params).toEqual({ q: '만두', page: 2, size: 50, sort: 'updatedAt,desc' });
  });

  it('does not send removed legacy filter groups to inventory queries', () => {
    const params = toInventoryQueryParams({
      q: '만두',
      filterOperator: 'OR',
      regionCode: ['GYEONGGI'],
      assessmentStatus: ['ASSESSED'],
      storageType: ['FROZEN'],
    });

    expect(params).toEqual({
      q: '만두',
      filterOperator: 'OR',
      storageType: ['FROZEN'],
      page: 1,
      size: 20,
      sort: 'updatedAt,desc',
    });
    expect(params).not.toHaveProperty('regionCode');
    expect(params).not.toHaveProperty('assessmentStatus');

    const serialized = serializeInventoryFilters({
      filterOperator: 'OR',
      regionCode: ['GYEONGGI'],
      assessmentStatus: ['ASSESSED'],
    });
    expect(serialized.toString()).toBe('filterOperator=OR');
  });

  it('serializes and parses round-trip preserving multi-value filter state', () => {
    const initial = {
      q: '비비고',
      channelType: ['GREETING', 'HYUNDAI_DEPT'],
      salesPointCode: ['STORE_1', 'STORE_2'],
      warehouseCode: ['GYEONGIN_1'],
      storageType: ['COLD', 'FROZEN'],
      riskGrade: ['DANGER'],
      shortageYn: 'Y',
      filterOperator: 'OR',
      page: 3,
      size: 30,
      sort: 'currentQuantity,desc',
      detailSkuCode: 'SKU-MANDU',
      detailSalesPointCode: 'STORE_1',
      detailTab: 'FORECAST',
    };

    const serialized = serializeInventoryFilters(initial);
    const parsed = parseInventoryFilters(serialized);

    expect(parsed).toEqual(expect.objectContaining(initial));
  });

  it('forwards only the safety-stock shortage flag to inventory APIs', () => {
    const params = toInventoryQueryParams({ shortageYn: 'Y' });

    expect(params).toEqual({ shortageYn: 'Y', page: 1, size: 20, sort: 'updatedAt,desc' });
    expect(serializeInventoryFilters({ shortageYn: 'Y' }).get('shortageYn')).toBe('Y');
    expect(parseInventoryFilters('?shortageYn=N').shortageYn).toBe('');
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

  it('resets page to 1 when the sort order changes', () => {
    const changed = applyFilterChanges({ ...DEFAULT_INVENTORY_FILTERS, page: 4 }, { sort: 'riskGrade,asc' });

    expect(changed.sort).toBe('riskGrade,asc');
    expect(changed.page).toBe(1);
  });

  it('accepts safety-stock shortage as a server-backed sort field', () => {
    const filters = parseInventoryFilters('?sort=shortageYn,asc');

    expect(filters.sort).toBe('shortageYn,asc');
  });
});
