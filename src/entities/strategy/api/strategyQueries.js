import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  getAiStrategyCase,
  getAiStrategyCases,
  getAiStrategyReviewers,
  serializeAiStrategyListParams,
} from './strategyApi.js';

const POLLING_INTERVAL_MS = 4_000;

export const aiStrategyKeys = Object.freeze({
  all: ['ai-strategies'],
  lists: () => [...aiStrategyKeys.all, 'list'],
  list: (params = {}) => [...aiStrategyKeys.lists(), serializeAiStrategyListParams(params)],
  details: () => [...aiStrategyKeys.all, 'detail'],
  detail: (strategyCaseId) => [...aiStrategyKeys.details(), String(strategyCaseId)],
  reviewers: () => [...aiStrategyKeys.all, 'reviewers'],
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

export function aiStrategyDetailQueryOptions(strategyCaseId) {
  return queryOptions({
    queryKey: aiStrategyKeys.detail(strategyCaseId),
    queryFn: ({ signal }) => getAiStrategyCase(strategyCaseId, signal),
    enabled: Boolean(strategyCaseId),
    staleTime: 30_000,
    retry: (failureCount, error) => ![404, 410].includes(error?.status) && error?.status >= 500 && failureCount < 1,
  });
}

export function aiStrategyReviewerQueryOptions({ enabled = true } = {}) {
  return queryOptions({
    queryKey: aiStrategyKeys.reviewers(),
    queryFn: ({ signal }) => getAiStrategyReviewers(signal),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: (failureCount, error) => error?.status >= 500 && failureCount < 1,
  });
}

export { POLLING_INTERVAL_MS };
