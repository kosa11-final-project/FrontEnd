import { describe, expect, it } from 'vitest';
import {
  dashboardKeys,
  dashboardQueryOptions,
  inventoryDetailQueryOptions,
  inventoryFilterOptionsQueryOptions,
  inventoryKeys,
  inventoryListQueryOptions,
  inventoryLotsQueryOptions,
  inventorySummaryQueryOptions,
} from './inventoryQueries.js';

describe('inventoryQueries', () => {
  it('builds canonical query keys with list params and detail identifiers', () => {
    const listParams = { channelType: 'GREETING', page: 1, size: 20 };
    expect(inventoryKeys.list(listParams)).toEqual(['inventory', 'list', listParams]);

    expect(inventoryKeys.summary(listParams)).toEqual(['inventory', 'summary', { channelType: 'GREETING' }]);

    expect(inventoryKeys.detail('SKU_01', 'STORE_01')).toEqual(['inventory', 'detail', 'SKU_01', 'STORE_01']);
    expect(inventoryKeys.lot('SKU_01', 'STORE_01')).toEqual(['inventory', 'lots', 'SKU_01', 'STORE_01']);
    expect(inventoryKeys.filterOptions()).toEqual(['inventory', 'filter-options']);
  });

  it('provides query options with correct query keys and enablement rules', () => {
    const listOptions = inventoryListQueryOptions({ q: '만두' });
    expect(listOptions.queryKey).toEqual(['inventory', 'list', { q: '만두' }]);

    const summaryOptions = inventorySummaryQueryOptions({});
    expect(summaryOptions.queryKey).toEqual(['inventory', 'summary', {}]);

    const detailEnabled = inventoryDetailQueryOptions('SKU_01', 'STORE_01');
    expect(detailEnabled.enabled).toBe(true);

    const detailDisabled = inventoryDetailQueryOptions('', '');
    expect(detailDisabled.enabled).toBe(false);

    expect(inventoryFilterOptionsQueryOptions().queryKey).toEqual(['inventory', 'filter-options']);
    expect(inventoryLotsQueryOptions('SKU_01', 'STORE_01').enabled).toBe(true);
    expect(inventoryLotsQueryOptions('', '').enabled).toBe(false);
  });

  it('reuses the summary key when only pagination or sorting changes', () => {
    const first = inventoryKeys.summary({
      q: '만두',
      channelType: ['GREETING'],
      page: 1,
      size: 20,
      sort: 'updatedAt,desc',
    });
    const second = inventoryKeys.summary({
      q: '만두',
      channelType: ['GREETING'],
      page: 4,
      size: 100,
      sort: 'skuCode,asc',
    });

    expect(second).toEqual(first);
  });

  it('keeps the AND/OR operator in the summary request and cache key', () => {
    const options = inventorySummaryQueryOptions({
      filterOperator: 'OR',
      riskGrade: ['DANGER'],
      page: 3,
    });

    expect(options.queryKey).toEqual(['inventory', 'summary', { filterOperator: 'OR', riskGrade: ['DANGER'] }]);
  });

  it('does not keep another seller detail or LOT response as placeholder data', () => {
    expect(inventoryDetailQueryOptions('SKU_01', 'STORE_01')).not.toHaveProperty('placeholderData');
    expect(inventoryLotsQueryOptions('SKU_01', 'STORE_01')).not.toHaveProperty('placeholderData');
  });

  it('keeps the dashboard snapshot in a separate cache namespace', () => {
    const options = dashboardQueryOptions();

    expect(dashboardKeys.snapshot()).toEqual(['dashboard', 'snapshot']);
    expect(options.queryKey).toEqual(['dashboard', 'snapshot']);
    expect(options.staleTime).toBe(60_000);
    expect(typeof options.queryFn).toBe('function');
    expect(typeof options.select).toBe('function');
  });
});
