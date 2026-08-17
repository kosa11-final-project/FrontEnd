import { requestJson } from '@/shared/api';
import { mapDemandForecastResponse } from '../model/forecastMapper.js';

/**
 * SKU × 판매처 미래 수요예측 및 예상 잔고 조회
 * @param {string} skuCode
 * @param {string} salesPointCode
 * @param {AbortSignal} [signal]
 */
export async function getDemandForecast(skuCode, salesPointCode, signal) {
  if (!skuCode || !salesPointCode) {
    return null;
  }

  const response = await requestJson({
    path: `v1/inventories/${encodeURIComponent(skuCode)}/sales-points/${encodeURIComponent(salesPointCode)}/forecast`,
    method: 'get',
    signal,
  });

  return mapDemandForecastResponse(response);
}

/**
 * SKU 전체 합계 수요예측 조회
 * @param {string} skuCode
 * @param {AbortSignal} [signal]
 */
export async function getSkuAggregateForecast(skuCode, signal) {
  if (!skuCode) {
    return null;
  }

  const response = await requestJson({
    path: `v1/inventories/${encodeURIComponent(skuCode)}/forecast`,
    method: 'get',
    params: { scope: 'SKU_AGGREGATE' },
    signal,
  });

  return mapDemandForecastResponse(response);
}
