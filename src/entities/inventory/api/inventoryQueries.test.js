import { describe, expect, it } from 'vitest';
import {
  dashboardKeys,
  dashboardQueryOptions,
  inventoryDetailQueryOptions,
  inventoryKeys,
  inventoryListQueryOptions,
} from './inventoryQueries.js';

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

  it('keeps the dashboard snapshot in a separate cache namespace', () => {
    const options = dashboardQueryOptions();

    expect(dashboardKeys.snapshot()).toEqual(['dashboard', 'snapshot']);
    expect(options.queryKey).toEqual(['dashboard', 'snapshot']);
    expect(options.staleTime).toBe(60_000);
    expect(typeof options.queryFn).toBe('function');
    expect(typeof options.select).toBe('function');
  });
});
