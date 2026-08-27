import { queryOptions } from '@tanstack/react-query';
import { mapDashboardResponse } from '../model/dashboardMapper.js';
import { getDashboard } from './inventoryApi.js';

export const dashboardKeys = Object.freeze({
  all: ['dashboard'],
  snapshot: () => [...dashboardKeys.all, 'snapshot'],
});

export function dashboardQueryOptions() {
  return queryOptions({
    queryKey: dashboardKeys.snapshot(),
    queryFn: ({ signal }) => getDashboard(signal),
    select: mapDashboardResponse,
    staleTime: 60_000,
  });
}
