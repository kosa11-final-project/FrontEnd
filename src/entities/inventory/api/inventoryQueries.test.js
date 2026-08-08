import { describe, expect, it } from 'vitest';
import { inventoryDetailQueryOptions, inventoryKeys, inventoryListQueryOptions } from './inventoryQueries.js';

describe('inventory query conventions', () => {
  it('keeps list and detail caches in one domain namespace', () => {
    expect(inventoryKeys.list({ page: 0, size: 20 })).toEqual(['inventory', 'list', { page: 0, size: 20 }]);
    expect(inventoryKeys.detail('inventory-1')).toEqual(['inventory', 'detail', 'inventory-1']);
  });

  it('passes the query abort signal to domain API functions', () => {
    const listOptions = inventoryListQueryOptions({ page: 0 });
    const detailOptions = inventoryDetailQueryOptions('inventory-1');

    expect(listOptions.queryKey).toEqual(['inventory', 'list', { page: 0 }]);
    expect(detailOptions.queryKey).toEqual(['inventory', 'detail', 'inventory-1']);
    expect(detailOptions.enabled).toBe(true);
    expect(typeof listOptions.queryFn).toBe('function');
    expect(typeof detailOptions.queryFn).toBe('function');
  });
});
