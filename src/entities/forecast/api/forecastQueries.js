import { getDemandForecast, getSkuAggregateForecast } from './forecastApi.js';

export const forecastQueryKeys = {
  all: ['demand-forecast'],
  detail: (skuCode, salesPointCode) => ['demand-forecast', 'detail', skuCode, salesPointCode],
  aggregate: (skuCode) => ['demand-forecast', 'aggregate', skuCode],
};

/**
 * SKU × 판매처 수요예측 쿼리 옵션
 * @param {string} skuCode
 * @param {string} salesPointCode
 */
export function demandForecastQueryOptions(skuCode, salesPointCode) {
  return {
    queryKey: forecastQueryKeys.detail(skuCode, salesPointCode),
    queryFn: ({ signal }) => getDemandForecast(skuCode, salesPointCode, signal),
    enabled: Boolean(skuCode && salesPointCode),
    staleTime: 60 * 1000,
  };
}

/**
 * SKU 전체 합계 수요예측 쿼리 옵션
 * @param {string} skuCode
 */
export function skuAggregateForecastQueryOptions(skuCode) {
  return {
    queryKey: forecastQueryKeys.aggregate(skuCode),
    queryFn: ({ signal }) => getSkuAggregateForecast(skuCode, signal),
    enabled: Boolean(skuCode),
    staleTime: 60 * 1000,
  };
}
