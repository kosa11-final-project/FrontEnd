import { requestJson } from '@/shared/api';

function extractInventoryStatisticsParams(params = {}) {
  return ['fromDate', 'toDate', 'scopeType', 'scopeCode'].reduce((result, key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') result[key] = value;
    return result;
  }, {});
}

/** 재고 통계 스냅샷 조회 */
export async function getInventoryStatistics(params = {}, signal) {
  const response = await requestJson({
    path: 'v1/statistics/inventory',
    method: 'get',
    params: extractInventoryStatisticsParams(params),
    signal,
  });

  return response?.data;
}
