const DEFAULT_TIME_ZONE = 'Asia/Seoul';
const formatterCache = new Map();

function toValidDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const dateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00+09:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateFormatter(timeZone, includeTime) {
  const key = `${timeZone}:${includeTime}`;
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.DateTimeFormat('ko-KR', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...(includeTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : {}),
      }),
    );
  }
  return formatterCache.get(key);
}

function getDateParts(value, timeZone, includeTime) {
  const date = toValidDate(value);
  if (!date) return null;

  return Object.fromEntries(
    getDateFormatter(timeZone, includeTime)
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value: partValue }) => [type, partValue]),
  );
}

export function formatDate(value, { fallback = '-', timeZone = DEFAULT_TIME_ZONE } = {}) {
  const parts = getDateParts(value, timeZone, false);
  return parts ? `${parts.year}.${parts.month}.${parts.day}` : fallback;
}

export function formatDateTime(value, { fallback = '-', timeZone = DEFAULT_TIME_ZONE } = {}) {
  const parts = getDateParts(value, timeZone, true);
  return parts ? `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}` : fallback;
}

export function formatDaysRemaining(value, { fallback = '-' } = {}) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return fallback;
  const days = Number(value);
  if (!Number.isFinite(days)) return fallback;

  const wholeDays = Math.trunc(days);
  if (wholeDays === 0) return 'D-Day';
  return wholeDays > 0 ? `D-${wholeDays}` : `D+${Math.abs(wholeDays)}`;
}
