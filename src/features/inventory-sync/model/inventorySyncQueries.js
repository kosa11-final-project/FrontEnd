import { queryOptions } from '@tanstack/react-query';
import { getInventorySync, getInventorySyncLatest } from '../api/inventorySyncApi.js';

export const inventorySyncKeys = Object.freeze({
  all: ['inventory-sync'],
  latest: () => ['inventory-sync', 'latest'],
  run: (syncRunId) => ['inventory-sync', 'run', syncRunId],
});

const ACTIVE_STATUSES = new Set(['QUEUED', 'RUNNING', 'INTERRUPTED']);
const POLLABLE_STATUSES = new Set(['QUEUED', 'RUNNING']);
const POLL_INTERVAL_BY_STATUS_MS = Object.freeze({
  // 등록 직후에는 다른 세션이 실행 사실을 빨리 관찰할 수 있도록 짧게 확인합니다.
  QUEUED: 3000,
  // 실행 중에는 상태가 자주 바뀌지 않으므로 요청 빈도를 낮춥니다.
  RUNNING: 10_000,
});

// 기존 import와의 호환을 위해 대표 active interval을 유지합니다.
const ACTIVE_POLL_INTERVAL_MS = POLL_INTERVAL_BY_STATUS_MS.RUNNING;

export function inventorySyncPollInterval(query) {
  if (query?.state?.status === 'error') return false;
  return POLLABLE_STATUSES.has(query?.state?.data?.status)
    ? POLL_INTERVAL_BY_STATUS_MS[query.state.data.status]
    : false;
}

export function inventorySyncLatestQueryOptions() {
  return queryOptions({
    queryKey: inventorySyncKeys.latest(),
    queryFn: ({ signal }) => getInventorySyncLatest(signal),
    staleTime: 10_000,
    retry: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    // idle/terminal 상태에서는 반복 요청하지 않습니다. 실행 중인 응답을
    // 받은 뒤에만 상태별 간격으로 확인하고, 포커스·재연결 시 1회 재조정합니다.
    refetchInterval: inventorySyncPollInterval,
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
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    refetchInterval: inventorySyncPollInterval,
    refetchIntervalInBackground: false,
  });
}

export { ACTIVE_POLL_INTERVAL_MS, ACTIVE_STATUSES, POLLABLE_STATUSES, POLL_INTERVAL_BY_STATUS_MS };
