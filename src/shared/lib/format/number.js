const koNumberFormatterCache = new Map();

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getNumberFormatter(options) {
  const key = JSON.stringify(options);
  if (!koNumberFormatterCache.has(key)) {
    koNumberFormatterCache.set(key, new Intl.NumberFormat('ko-KR', options));
  }
  return koNumberFormatterCache.get(key);
}

export function formatNumber(value, { fallback = '-', minimumFractionDigits = 0, maximumFractionDigits = 0 } = {}) {
  const number = toFiniteNumber(value);
  if (number === null) return fallback;

  return getNumberFormatter({ minimumFractionDigits, maximumFractionDigits }).format(number);
}

export function formatCurrency(
  value,
  { fallback = '-', currency = 'KRW', minimumFractionDigits = 0, maximumFractionDigits = 0 } = {},
) {
  const number = toFiniteNumber(value);
  if (number === null) return fallback;

  return getNumberFormatter({
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(number);
}

export function formatPercent(value, { fallback = '-', minimumFractionDigits = 0, maximumFractionDigits = 1 } = {}) {
  const number = toFiniteNumber(value);
  if (number === null) return fallback;

  const formatted = formatNumber(number, { minimumFractionDigits, maximumFractionDigits });
  return `${formatted}%`;
}

export function formatQuantity(
  value,
  { fallback = '-', unit = '개', minimumFractionDigits = 0, maximumFractionDigits = 0 } = {},
) {
  const number = toFiniteNumber(value);
  if (number === null) return fallback;

  return `${formatNumber(number, { minimumFractionDigits, maximumFractionDigits })}${unit}`;
}
