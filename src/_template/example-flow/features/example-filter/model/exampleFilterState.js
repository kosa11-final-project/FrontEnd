export const defaultExampleFilters = Object.freeze({
  query: '',
  status: 'all',
  page: 0,
  size: 20,
});

export function readExampleFilters(searchParams) {
  const page = Number(searchParams.get('page'));
  const size = Number(searchParams.get('size'));

  return {
    query: searchParams.get('query') ?? defaultExampleFilters.query,
    status: searchParams.get('status') ?? defaultExampleFilters.status,
    page: Number.isInteger(page) && page >= 0 ? page : defaultExampleFilters.page,
    size: Number.isInteger(size) && size > 0 ? size : defaultExampleFilters.size,
  };
}

export function writeExampleFilters(filters) {
  const params = new URLSearchParams();
  if (filters.query) params.set('query', filters.query);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.page > 0) params.set('page', String(filters.page));
  if (filters.size !== defaultExampleFilters.size) params.set('size', String(filters.size));
  return params;
}
