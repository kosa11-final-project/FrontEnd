export const INVENTORY_CHANNEL_TYPES = ['GREETING', 'ECOMMERCE', 'HYUNDAI_DEPT', 'HMART'];
export const INVENTORY_STORAGE_TYPES = ['FROZEN', 'COLD', 'ROOM_TEMP'];
export const INVENTORY_RISK_GRADES = ['SAFE', 'NORMAL', 'CAUTION', 'DANGER'];
export const INVENTORY_ASSESSMENT_STATUSES = ['ASSESSED', 'UNASSESSED', 'STALE', 'FAILED', 'REASSESSING'];
export const INVENTORY_DETAIL_TABS = ['OVERVIEW', 'LOTS'];
export const INVENTORY_SORT_FIELDS = [
  'updatedAt',
  'productName',
  'skuCode',
  'currentQuantity',
  'availableQuantity',
  'reservedQuantity',
  'riskGrade',
  'nearestExpiryDays',
];
export const INVENTORY_SORT_DIRECTIONS = ['asc', 'desc'];

export const DEFAULT_INVENTORY_FILTERS = Object.freeze({
  q: '',
  channelType: [],
  salesPointCode: [],
  warehouseCode: [],
  regionCode: [],
  categoryId: '',
  storageType: [],
  riskGrade: [],
  assessmentStatus: [],
  page: 1,
  size: 20,
  sort: 'updatedAt,desc',
  detailSkuCode: '',
  detailSalesPointCode: '',
  detailTab: 'OVERVIEW',
});

const INVENTORY_API_FILTER_KEYS = Object.freeze([
  'q',
  'channelType',
  'salesPointCode',
  'warehouseCode',
  'regionCode',
  'categoryId',
  'storageType',
  'riskGrade',
  'assessmentStatus',
  'page',
  'size',
  'sort',
]);

function normalizeArrayParam(raw, allowed = null) {
  if (!raw) return [];
  let values = [];
  if (Array.isArray(raw)) {
    values = allowed
      ? raw.flatMap((value) => (typeof value === 'string' && value.includes(',') ? value.split(',') : [value]))
      : raw;
  } else if (typeof raw === 'string') {
    values = allowed && raw.includes(',') ? raw.split(',') : [raw];
  }
  const filtered = values
    .map((v) => (typeof v === 'string' ? v.trim() : String(v).trim()))
    .filter((v) => v.length > 0 && (!allowed || allowed.includes(v)));
  return [...new Set(filtered)].sort();
}

function normalizeCategoryId(raw) {
  const value = typeof raw === 'string' ? raw.trim() : raw == null ? '' : String(raw).trim();
  return /^[1-9]\d*$/.test(value) ? value : '';
}

function normalizeSort(raw) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  const parts = value.split(',').map((part) => part.trim());
  if (parts.length > 2) return DEFAULT_INVENTORY_FILTERS.sort;
  const [field, direction = 'desc'] = parts;
  if (!INVENTORY_SORT_FIELDS.includes(field) || !INVENTORY_SORT_DIRECTIONS.includes(direction.toLowerCase())) {
    return DEFAULT_INVENTORY_FILTERS.sort;
  }
  return `${field},${direction.toLowerCase()}`;
}

/**
 * URLSearchParams 객체, 쿼리 문자열 또는 객체에서 필터 상태를 추출하고 정규화합니다.
 * @param {URLSearchParams|string|Record<string, any>} rawParams
 * @returns {typeof DEFAULT_INVENTORY_FILTERS}
 */
export function parseInventoryFilters(rawParams) {
  let searchParams = null;
  let rawObj = {};

  if (rawParams instanceof URLSearchParams) {
    searchParams = rawParams;
  } else if (typeof rawParams === 'string') {
    searchParams = new URLSearchParams(rawParams);
  } else if (rawParams && typeof rawParams === 'object') {
    rawObj = { ...rawParams };
  }

  const getArray = (key, allowed = null) => {
    if (searchParams) {
      const allValues = searchParams.getAll(key);
      if (allValues.length > 0) {
        return normalizeArrayParam(allValues, allowed);
      }
      return [];
    }
    return normalizeArrayParam(rawObj[key], allowed);
  };

  const getString = (key, fallback = '') => {
    if (searchParams) {
      return (searchParams.get(key) || '').trim();
    }
    return rawObj[key] != null ? String(rawObj[key]).trim() : fallback;
  };

  const getNumber = (key, fallback = 1, min = 1, max = Infinity) => {
    const rawVal = searchParams ? searchParams.get(key) : rawObj[key];
    const num = Number(rawVal);
    if (!Number.isInteger(num) || num < min) return fallback;
    if (num > max) return max;
    return num;
  };

  const q = getString('q', '').slice(0, 100);
  const channelType = getArray('channelType', INVENTORY_CHANNEL_TYPES);
  const salesPointCode = getArray('salesPointCode');
  const warehouseCode = getArray('warehouseCode');
  const regionCode = getArray('regionCode');
  const categoryId = normalizeCategoryId(getString('categoryId', ''));
  const storageType = getArray('storageType', INVENTORY_STORAGE_TYPES);
  const riskGrade = getArray('riskGrade', INVENTORY_RISK_GRADES);
  const assessmentStatus = getArray('assessmentStatus', INVENTORY_ASSESSMENT_STATUSES);

  const page = getNumber('page', 1, 1);
  const size = getNumber('size', 20, 1, 100);
  const sort = normalizeSort(getString('sort', DEFAULT_INVENTORY_FILTERS.sort));

  const detailSkuCode = getString('detailSkuCode', '');
  const detailSalesPointCode = getString('detailSalesPointCode', '');
  const rawDetailTab = getString('detailTab', 'OVERVIEW').toUpperCase();
  const detailTab = INVENTORY_DETAIL_TABS.includes(rawDetailTab) ? rawDetailTab : 'OVERVIEW';

  return {
    q,
    channelType,
    salesPointCode,
    warehouseCode,
    regionCode,
    categoryId,
    storageType,
    riskGrade,
    assessmentStatus,
    page,
    size,
    sort,
    detailSkuCode,
    detailSalesPointCode,
    detailTab,
  };
}

/**
 * URL 상태 중 목록/요약 API가 이해하는 필드만 추출합니다.
 * Drawer의 detail* 상태를 Query key와 HTTP query에서 분리해 불필요한 재조회와
 * 서버에 알 수 없는 파라미터가 전달되는 일을 막습니다.
 */
export function toInventoryQueryParams(filters = {}) {
  const normalized = parseInventoryFilters(filters);
  return INVENTORY_API_FILTER_KEYS.reduce((params, key) => {
    const value = normalized[key];
    if (Array.isArray(value)) {
      if (value.length > 0) params[key] = value;
    } else if (value !== '' && value != null) {
      params[key] = value;
    }
    return params;
  }, {});
}

/**
 * 필터 상태 객체를 URLSearchParams로 직렬화합니다.
 * 다중 값 필터는 반복 파라미터로 추가하며, 기본값과 동일한 단일 필드는 생략합니다.
 * @param {Partial<typeof DEFAULT_INVENTORY_FILTERS>} filters
 * @returns {URLSearchParams}
 */
export function serializeInventoryFilters(filters) {
  const normalized = parseInventoryFilters(filters);
  const params = new URLSearchParams();

  if (normalized.q) params.set('q', normalized.q);

  const arrayKeys = [
    'channelType',
    'salesPointCode',
    'warehouseCode',
    'regionCode',
    'storageType',
    'riskGrade',
    'assessmentStatus',
  ];

  arrayKeys.forEach((key) => {
    const arr = normalized[key] || [];
    arr.forEach((val) => {
      params.append(key, val);
    });
  });

  if (normalized.categoryId) params.set('categoryId', normalized.categoryId);

  if (normalized.page > 1) params.set('page', String(normalized.page));
  if (normalized.size !== DEFAULT_INVENTORY_FILTERS.size) params.set('size', String(normalized.size));
  if (normalized.sort !== DEFAULT_INVENTORY_FILTERS.sort) params.set('sort', normalized.sort);

  if (normalized.detailSkuCode) params.set('detailSkuCode', normalized.detailSkuCode);
  if (normalized.detailSalesPointCode) params.set('detailSalesPointCode', normalized.detailSalesPointCode);
  if (normalized.detailTab && normalized.detailTab !== 'OVERVIEW') params.set('detailTab', normalized.detailTab);

  return params;
}

/**
 * 필터 변경 시 페이지를 1로 리셋한 새 필터 상태를 만듭니다.
 * (단, page 자체를 변경하거나 drawer 상세 문맥만 변경하는 경우는 제외)
 * @param {Partial<typeof DEFAULT_INVENTORY_FILTERS>} currentFilters
 * @param {Partial<typeof DEFAULT_INVENTORY_FILTERS>} changes
 * @returns {typeof DEFAULT_INVENTORY_FILTERS}
 */
export function applyFilterChanges(currentFilters, changes) {
  const nonResetKeys = ['page', 'sort', 'detailSkuCode', 'detailSalesPointCode', 'detailTab'];
  const isNonResetChangeOnly = Object.keys(changes).every((key) => nonResetKeys.includes(key));
  const resetPage = !isNonResetChangeOnly;

  return parseInventoryFilters({
    ...currentFilters,
    ...changes,
    ...(resetPage ? { page: 1 } : {}),
  });
}
