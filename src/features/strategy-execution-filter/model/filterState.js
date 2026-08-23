import { SUPPORTED_ACTION_TYPES } from '@/entities/strategy';

export const defaultStrategyExecutionFilters = Object.freeze({
  strategyStatus: 'ALL',
  actionType: 'ALL',
  query: '',
});

export const STRATEGY_EXECUTION_PAGE_SIZE = 10;
export const STRATEGY_EXECUTION_FILTER_STATUSES = Object.freeze(['READY', 'EXECUTING', 'COMPLETED']);

export function parseStrategyExecutionPage(searchParams) {
  const rawPage = searchParams instanceof URLSearchParams ? searchParams.get('page') : searchParams?.page;
  const page = Number(rawPage);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function toStrategyExecutionQueryParams(filters = defaultStrategyExecutionFilters, page = 1) {
  const params = {
    page: Math.max(page - 1, 0),
    size: STRATEGY_EXECUTION_PAGE_SIZE,
  };
  const query = typeof filters.query === 'string' ? filters.query.trim().slice(0, 100) : '';
  if (query) params.query = query;
  if (STRATEGY_EXECUTION_FILTER_STATUSES.includes(filters.strategyStatus)) params.status = filters.strategyStatus;
  if (SUPPORTED_ACTION_TYPES.includes(filters.actionType)) params.actionType = filters.actionType;
  return params;
}
