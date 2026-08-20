const SEOUL_TIME_ZONE = 'Asia/Seoul';
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SEOUL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toSeoulDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = Object.fromEntries(
    dateFormatter
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value: partValue }) => [type, partValue]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function normalizeSearchText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('ko-KR');
}

export function filterStrategies(items, { query = '', from = '', to = '', status = 'ALL' } = {}) {
  const normalizedQuery = normalizeSearchText(query);

  return items
    .filter((item) => {
      const searchableText = normalizeSearchText(
        `${item.strategyNumber} ${item.strategyName} ${item.product?.name ?? ''}`,
      );
      if (normalizedQuery && !searchableText.includes(normalizedQuery)) return false;

      const createdDate = toSeoulDateKey(item.createdAt);
      if (from && createdDate < from) return false;
      if (to && createdDate > to) return false;
      if (status !== 'ALL' && item.generationStatus !== status) return false;
      return true;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function getStrategyStatusCounts(items, filters = {}) {
  const itemsBeforeStatus = filterStrategies(items, { ...filters, status: 'ALL' });
  return itemsBeforeStatus.reduce(
    (counts, item) => ({
      ...counts,
      ALL: counts.ALL + 1,
      [item.generationStatus]: (counts[item.generationStatus] ?? 0) + 1,
    }),
    { ALL: 0, GENERATED: 0, GENERATING: 0, GENERATION_FAILED: 0 },
  );
}

export function paginateStrategies(items, page = 1, pageSize = 10) {
  const totalPages = Math.max(Math.ceil(items.length / pageSize), 1);
  const safePage = Math.min(Math.max(Number.parseInt(page, 10) || 1, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalItems: items.length,
    totalPages,
  };
}
