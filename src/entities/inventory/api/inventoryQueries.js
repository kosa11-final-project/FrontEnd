import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { mapDashboardResponse } from '../model/dashboardMapper.js';
import {
  getDashboard,
  getInventories,
  getInventoryDetail,
  getInventoryFilterOptions,
  getInventoryLots,
  getInventorySummary,
} from './inventoryApi.js';

const SUMMARY_FILTER_KEYS = Object.freeze([
  'q',
  'channelType',
  'salesPointCode',
  'warehouseCode',
  'regionCode',
  'categoryId',
  'storageType',
  'riskGrade',
  'assessmentStatus',
]);

function pickSummaryParams(params = {}) {
  return SUMMARY_FILTER_KEYS.reduce((result, key) => {
    const value = params?.[key];
    if (Array.isArray(value)) {
      if (value.length > 0) result[key] = [...value];
    } else if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
    return result;
  }, {});
}

/** 통합 재고 Query Key Factory */
export const inventoryKeys = Object.freeze({
  all: ['inventory'],
  lists: () => [...inventoryKeys.all, 'list'],
  list: (params = {}) => [...inventoryKeys.lists(), params],
  summaries: () => [...inventoryKeys.all, 'summary'],
  summary: (params = {}) => [...inventoryKeys.summaries(), pickSummaryParams(params)],
  details: () => [...inventoryKeys.all, 'detail'],
  // 식별자를 하나의 문자열로 합치지 않아 업무 코드 안의 구분자도 안전하게 보존합니다.
  detail: (skuCode, salesPointCode) => [...inventoryKeys.details(), skuCode, salesPointCode],
  lots: () => [...inventoryKeys.all, 'lots'],
  lot: (skuCode, salesPointCode) => [...inventoryKeys.lots(), skuCode, salesPointCode],
  filterOptions: () => [...inventoryKeys.all, 'filter-options'],
});

export const dashboardKeys = Object.freeze({
  all: ['dashboard'],
  snapshot: () => [...dashboardKeys.all, 'snapshot'],
});

const retryServerErrorOnly = (failureCount, error) => error?.status >= 500 && failureCount < 1;

/** 재고 목록 Query Options */
export function inventoryListQueryOptions(params = {}) {
  return queryOptions({
    queryKey: inventoryKeys.list(params),
    queryFn: ({ signal }) => getInventories(params, signal),
    placeholderData: keepPreviousData,
    retry: retryServerErrorOnly,
  });
}

/** 재고 상단 KPI 요약 Query Options */
export function inventorySummaryQueryOptions(params = {}) {
  const summaryParams = pickSummaryParams(params);

  return queryOptions({
    queryKey: inventoryKeys.summary(summaryParams),
    queryFn: ({ signal }) => getInventorySummary(summaryParams, signal),
    placeholderData: keepPreviousData,
    retry: retryServerErrorOnly,
  });
}

/** 재고 필터 기준정보 Query Options */
export function inventoryFilterOptionsQueryOptions() {
  return queryOptions({
    queryKey: inventoryKeys.filterOptions(),
    queryFn: ({ signal }) => getInventoryFilterOptions(signal),
    staleTime: 5 * 60 * 1000,
    retry: retryServerErrorOnly,
  });
}

/** 재고 상세 Query Options (SKU × 판매처 식별자) */
export function inventoryDetailQueryOptions(skuCode, salesPointCode) {
  return queryOptions({
    queryKey: inventoryKeys.detail(skuCode, salesPointCode),
    queryFn: ({ signal }) => getInventoryDetail(skuCode, salesPointCode, signal),
    enabled: Boolean(skuCode && salesPointCode),
    staleTime: 60 * 1000,
    retry: retryServerErrorOnly,
  });
}

/** 선택 SKU × 판매처 LOT Query Options */
export function inventoryLotsQueryOptions(skuCode, salesPointCode) {
  return queryOptions({
    queryKey: inventoryKeys.lot(skuCode, salesPointCode),
    queryFn: ({ signal }) => getInventoryLots(skuCode, salesPointCode, signal),
    enabled: Boolean(skuCode && salesPointCode),
    staleTime: 60 * 1000,
    retry: retryServerErrorOnly,
  });
}

export function dashboardQueryOptions() {
  return queryOptions({
    queryKey: dashboardKeys.snapshot(),
    queryFn: ({ signal }) => getDashboard(signal),
    select: mapDashboardResponse,
    staleTime: 60_000,
  });
}
