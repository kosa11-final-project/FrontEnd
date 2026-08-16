import { describe, expect, it } from 'vitest';
import {
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

    expect(inventoryKeys.summary(listParams)).toEqual(['inventory', 'summary', listParams]);

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

  it('does not keep another seller detail or LOT response as placeholder data', () => {
    expect(inventoryDetailQueryOptions('SKU_01', 'STORE_01')).not.toHaveProperty('placeholderData');
    expect(inventoryLotsQueryOptions('SKU_01', 'STORE_01')).not.toHaveProperty('placeholderData');
  });
});
