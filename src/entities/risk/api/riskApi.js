import { requestJson } from '@/shared/api';
import { mapRiskAssessmentResponse } from '../model/riskMapper.js';

/**
 * SKU × 판매처 서버 위험도 평가 상세 조회
 * @param {string} skuCode
 * @param {string} salesPointCode
 * @param {AbortSignal} [signal]
 */
export async function getInventoryRisk(skuCode, salesPointCode, signal) {
  if (!skuCode || !salesPointCode) {
    return null;
  }

  const response = await requestJson({
    path: `v1/inventories/${encodeURIComponent(skuCode)}/sales-points/${encodeURIComponent(salesPointCode)}/risk`,
    method: 'get',
    signal,
  });

  return mapRiskAssessmentResponse(response);
}
