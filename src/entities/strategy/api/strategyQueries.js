import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getAiStrategyCases, serializeAiStrategyListParams } from './strategyApi.js';

const POLLING_INTERVAL_MS = 4_000;

export const aiStrategyKeys = Object.freeze({
  all: ['ai-strategies'],
  lists: () => [...aiStrategyKeys.all, 'list'],
  list: (params = {}) => [...aiStrategyKeys.lists(), serializeAiStrategyListParams(params)],
});

export function aiStrategyListQueryOptions(params = {}) {
  const serializedParams = serializeAiStrategyListParams(params);

  return queryOptions({
    queryKey: aiStrategyKeys.list(serializedParams),
    queryFn: ({ signal }) => getAiStrategyCases(serializedParams, signal),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (query.state.data?.statusCounts?.generating > 0 ? POLLING_INTERVAL_MS : false),
    retry: (failureCount, error) => error?.status >= 500 && failureCount < 1,
  });
}

export { POLLING_INTERVAL_MS };
