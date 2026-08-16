import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  getInventories,
  getInventoryDetail,
  getInventoryFilterOptions,
  getInventoryLots,
  getInventorySummary,
} from './inventoryApi.js';

/** 통합 재고 Query Key Factory */
export const inventoryKeys = Object.freeze({
  all: ['inventory'],
  lists: () => [...inventoryKeys.all, 'list'],
  list: (params = {}) => [...inventoryKeys.lists(), params],
  summaries: () => [...inventoryKeys.all, 'summary'],
  summary: (params = {}) => [...inventoryKeys.summaries(), params],
  details: () => [...inventoryKeys.all, 'detail'],
  // 식별자를 하나의 문자열로 합치지 않아 업무 코드 안의 구분자도 안전하게 보존합니다.
  detail: (skuCode, salesPointCode) => [...inventoryKeys.details(), skuCode, salesPointCode],
  lots: () => [...inventoryKeys.all, 'lots'],
  lot: (skuCode, salesPointCode) => [...inventoryKeys.lots(), skuCode, salesPointCode],
  filterOptions: () => [...inventoryKeys.all, 'filter-options'],
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
  return queryOptions({
    queryKey: inventoryKeys.summary(params),
    queryFn: ({ signal }) => getInventorySummary(params, signal),
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
