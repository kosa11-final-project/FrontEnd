import { requestJson } from '@/shared/api';

// 재고 API의 진입점 예시입니다. 실제 queryFn은 기능 개발 단계에서 작성합니다.
export function getInventories(params, signal) {
  return requestJson({
    path: 'v1/inventories',
    method: 'get',
    params,
    signal,
  });
}

export function getInventoryDetail(inventoryId, signal) {
  return requestJson({
    path: `v1/inventories/${inventoryId}`,
    method: 'get',
    signal,
  });
}

export async function getDashboard(signal) {
  const response = await requestJson({
    path: 'v1/dashboard',
    method: 'get',
    signal,
  });

  return response?.data;
}
