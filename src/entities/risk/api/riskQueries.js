import { getInventoryRisk } from './riskApi.js';

export const riskQueryKeys = Object.freeze({
  all: ['inventory-risk'],
  detail: (skuCode, salesPointCode) => [...riskQueryKeys.all, 'detail', skuCode, salesPointCode],
});

/**
 * SKU × 판매처 위험 평가 쿼리 옵션
 * @param {string} skuCode
 * @param {string} salesPointCode
 */
export function inventoryRiskQueryOptions(skuCode, salesPointCode) {
  return {
    queryKey: riskQueryKeys.detail(skuCode, salesPointCode),
    queryFn: ({ signal }) => getInventoryRisk(skuCode, salesPointCode, signal),
    enabled: Boolean(skuCode && salesPointCode),
    staleTime: 60 * 1000,
  };
}
