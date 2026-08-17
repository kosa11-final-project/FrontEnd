import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { mapInventoryStatisticsResponse } from '../model/statisticsMapper.js';
import { getInventoryStatistics } from './statisticsApi.js';

export const statisticsKeys = Object.freeze({
  all: ['statistics'],
  inventory: (params = {}) => [...statisticsKeys.all, 'inventory', params],
});

const retryServerErrorOnly = (failureCount, error) => error?.status >= 500 && failureCount < 1;

export function inventoryStatisticsQueryOptions(params = {}) {
  return queryOptions({
    queryKey: statisticsKeys.inventory(params),
    queryFn: ({ signal }) => getInventoryStatistics(params, signal),
    select: mapInventoryStatisticsResponse,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: retryServerErrorOnly,
  });
}
