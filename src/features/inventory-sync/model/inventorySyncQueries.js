import { queryOptions } from '@tanstack/react-query';
import { getInventorySync, getInventorySyncLatest } from '../api/inventorySyncApi.js';

export const inventorySyncKeys = Object.freeze({
  all: ['inventory-sync'],
  latest: () => ['inventory-sync', 'latest'],
  run: (syncRunId) => ['inventory-sync', 'run', syncRunId],
});

const ACTIVE_STATUSES = new Set(['QUEUED', 'RUNNING', 'INTERRUPTED']);
const POLLABLE_STATUSES = new Set(['QUEUED', 'RUNNING']);
const ACTIVE_POLL_INTERVAL_MS = 5000;

export function inventorySyncLatestQueryOptions() {
  return queryOptions({
    queryKey: inventorySyncKeys.latest(),
    queryFn: ({ signal }) => getInventorySyncLatest(signal),
    staleTime: 10_000,
    retry: false,
    refetchOnWindowFocus: false,
    // 전역 실행 상태 한 행만 조회합니다. 다른 세션이 동기화를 시작하거나
    // 종료하면 열린 모든 재고 화면이 최대 5초 안에 같은 버튼 상태를 봅니다.
    refetchInterval: ACTIVE_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function inventorySyncRunQueryOptions(syncRunId) {
  return queryOptions({
    queryKey: inventorySyncKeys.run(syncRunId),
    queryFn: ({ signal }) => getInventorySync(syncRunId, signal),
    enabled: Boolean(syncRunId),
    retry: false,
    // 상태 요약만 읽습니다. source/canonical row를 polling하지 않고,
    // 백그라운드 탭에서는 refetchInBackground=false로 중지합니다.
    refetchInterval: (query) => (POLLABLE_STATUSES.has(query.state.data?.status) ? ACTIVE_POLL_INTERVAL_MS : false),
    refetchIntervalInBackground: false,
  });
}

export { ACTIVE_POLL_INTERVAL_MS, ACTIVE_STATUSES, POLLABLE_STATUSES };
