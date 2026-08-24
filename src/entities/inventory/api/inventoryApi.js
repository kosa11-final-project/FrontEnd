import { requestJson } from '@/shared/api';
import {
  mapInventoryFilterOptionsResponse,
  mapInventoryItem,
  mapInventoryListResponse,
  mapInventoryLotsResponse,
  mapInventorySummaryResponse,
} from '../model/inventoryMapper.js';

function extractInventoryQueryParams(filters = {}, { includePagination = true } = {}) {
  const params = {};
  if (filters.q) params.q = filters.q;
  if (filters.filterOperator) params.filterOperator = filters.filterOperator;
  if (filters.channelType?.length) params.channelType = filters.channelType;
  if (filters.salesPointCode?.length) params.salesPointCode = filters.salesPointCode;
  if (filters.warehouseCode?.length) params.warehouseCode = filters.warehouseCode;
  if (filters.regionCode?.length) params.regionCode = filters.regionCode;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.storageType?.length) params.storageType = filters.storageType;
  if (filters.riskGrade?.length) params.riskGrade = filters.riskGrade;
  if (filters.assessmentStatus?.length) params.assessmentStatus = filters.assessmentStatus;
  if (includePagination) {
    if (filters.page) params.page = filters.page;
    if (filters.size) params.size = filters.size;
    if (filters.sort) params.sort = filters.sort;
  }
  return params;
}

/**
 * 통합 재고 목록 조회
 * @param {Record<string, any>} params
 * @param {AbortSignal} [signal]
 */
export async function getInventories(params = {}, signal) {
  const response = await requestJson({
    path: 'v1/inventories',
    method: 'get',
    // 목록만 페이지네이션을 사용합니다.
    params: extractInventoryQueryParams(params),
    signal,
  });

  return mapInventoryListResponse(response);
}

/**
 * 통합 재고 상단 KPI 요약 통계 조회
 * @param {Record<string, any>} params
 * @param {AbortSignal} [signal]
 */
export async function getInventorySummary(params, signal) {
  const response = await requestJson({
    path: 'v1/inventories/summary',
    method: 'get',
    // 요약 KPI는 동일한 필터의 전체 집계이므로 목록 페이지 파라미터를 전달하지 않습니다.
    params: extractInventoryQueryParams(params, { includePagination: false }),
    signal,
  });

  return mapInventorySummaryResponse(response);
}

/** 통합 재고 필터 기준정보 조회 */
export async function getInventoryFilterOptions(signal) {
  const response = await requestJson({
    path: 'v1/inventories/filter-options',
    method: 'get',
    signal,
  });

  return mapInventoryFilterOptionsResponse(response);
}

/**
 * 재고 상세 조회 (SKU × 판매처 식별자)
 * @param {string} skuCode
 * @param {string} salesPointCode
 * @param {AbortSignal} [signal]
 */
export async function getInventoryDetail(skuCode, salesPointCode, signal) {
  const response = await requestJson({
    path: `v1/inventories/${encodeURIComponent(skuCode)}/sales-points/${encodeURIComponent(salesPointCode)}`,
    method: 'get',
    signal,
  });

  return mapInventoryItem(response);
}

/** 선택 SKU × 판매처의 FEFO LOT 조회 */
export async function getInventoryLots(skuCode, salesPointCode, signal) {
  const response = await requestJson({
    path: `v1/inventories/${encodeURIComponent(skuCode)}/sales-points/${encodeURIComponent(salesPointCode)}/lots`,
    method: 'get',
    signal,
  });

  return mapInventoryLotsResponse(response);
}

export async function getDashboard(signal) {
  const response = await requestJson({
    path: 'v1/dashboard',
    method: 'get',
    signal,
  });

  return response?.data;
}
