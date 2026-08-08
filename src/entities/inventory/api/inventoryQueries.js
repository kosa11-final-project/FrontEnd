import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getInventories, getInventoryDetail } from './inventoryApi.js';

/** Cache key and query option factory for the inventory domain. */
export const inventoryKeys = Object.freeze({
  all: ['inventory'],
  lists: () => [...inventoryKeys.all, 'list'],
  list: (params = {}) => [...inventoryKeys.lists(), params],
  details: () => [...inventoryKeys.all, 'detail'],
  detail: (inventoryId) => [...inventoryKeys.details(), inventoryId],
});

export function inventoryListQueryOptions(params = {}) {
  return queryOptions({
    queryKey: inventoryKeys.list(params),
    queryFn: ({ signal }) => getInventories(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function inventoryDetailQueryOptions(inventoryId) {
  return queryOptions({
    queryKey: inventoryKeys.detail(inventoryId),
    queryFn: ({ signal }) => getInventoryDetail(inventoryId, signal),
    enabled: Boolean(inventoryId),
  });
}
