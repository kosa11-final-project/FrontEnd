import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getExamples } from './exampleApi.js';

export const exampleKeys = Object.freeze({
  all: ['examples'],
  lists: () => [...exampleKeys.all, 'list'],
  list: (params = {}) => [...exampleKeys.lists(), params],
});

export function exampleListQueryOptions(params = {}) {
  return queryOptions({
    queryKey: exampleKeys.list(params),
    queryFn: ({ signal }) => getExamples(params, signal),
    placeholderData: keepPreviousData,
  });
}
