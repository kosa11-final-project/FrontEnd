import { queryOptions } from '@tanstack/react-query';
import { getInventorySync, getInventorySyncLatest } from '../api/inventorySyncApi.js';

export const inventorySyncKeys = Object.freeze({
  all: ['inventory-sync'],
  latest: () => ['inventory-sync', 'latest'],
  run: (syncRunId) => ['inventory-sync', 'run', syncRunId],
});

const ACTIVE_STATUSES = new Set(['QUEUED', 'RUNNING', 'INTERRUPTED']);
const POLLABLE_STATUSES = new Set(['QUEUED', 'RUNNING']);
const SNAPSHOT_REFRESH_FAST_POLL_INTERVAL_MS = 3000;
const SNAPSHOT_REFRESH_NORMAL_POLL_INTERVAL_MS = 10_000;
const SNAPSHOT_REFRESH_FAST_WINDOW_MS = 60_000;
const SNAPSHOT_REFRESH_MAX_WAIT_MS = 5 * 60_000;
const POLL_INTERVAL_BY_STATUS_MS = Object.freeze({
  // 등록 직후에는 다른 세션이 실행 사실을 빨리 관찰할 수 있도록 짧게 확인합니다.
  QUEUED: 3000,
  // 실행 중에는 상태가 자주 바뀌지 않으므로 요청 빈도를 낮춥니다.
  RUNNING: 10_000,
});

export function inventorySyncPollInterval(query, now = Date.now()) {
  if (query?.state?.status === 'error') return false;
  const run = query?.state?.data;
  if (POLLABLE_STATUSES.has(run?.status)) return POLL_INTERVAL_BY_STATUS_MS[run.status];
  return snapshotRefreshPollInterval(run, now);
}

function requiresSnapshotRefresh(run) {
  const refresh = run?.snapshotRefresh;
  return Boolean(
    run?.status === 'SUCCEEDED' &&
    refresh?.required &&
    (refresh.dashboardReady !== true || refresh.inventoryStatisticsReady !== true),
  );
}

export function isSnapshotRefreshFailed(run) {
  const refresh = run?.snapshotRefresh;
  return Boolean(
    run?.status === 'SUCCEEDED' &&
    refresh?.required &&
    (refresh.dashboardStatus === 'FAILED' || refresh.inventoryStatisticsStatus === 'FAILED'),
  );
}

export function isSnapshotRefreshDelayed(run, now = Date.now()) {
  if (!requiresSnapshotRefresh(run) || isSnapshotRefreshFailed(run)) return false;
  const completedAt = Date.parse(run?.completedAt);
  return Number.isFinite(completedAt) && Math.max(0, now - completedAt) >= SNAPSHOT_REFRESH_MAX_WAIT_MS;
}

export function isSnapshotRefreshPending(run, now = Date.now()) {
  return requiresSnapshotRefresh(run) && !isSnapshotRefreshFailed(run) && !isSnapshotRefreshDelayed(run, now);
}

export function snapshotRefreshPollInterval(run, now = Date.now()) {
  if (!isSnapshotRefreshPending(run, now)) return false;
  const completedAt = Date.parse(run?.completedAt);
  if (!Number.isFinite(completedAt)) return SNAPSHOT_REFRESH_NORMAL_POLL_INTERVAL_MS;

  const elapsed = Math.max(0, now - completedAt);
  if (elapsed < SNAPSHOT_REFRESH_FAST_WINDOW_MS) return SNAPSHOT_REFRESH_FAST_POLL_INTERVAL_MS;
  return SNAPSHOT_REFRESH_NORMAL_POLL_INTERVAL_MS;
}

export function inventorySyncLatestQueryOptions() {
  return queryOptions({
    queryKey: inventorySyncKeys.latest(),
    queryFn: ({ signal }) => getInventorySyncLatest(signal),
    staleTime: 10_000,
    retry: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    // 다른 세션의 실행은 포커스·재연결 때 latest로 발견하고, 발견한 뒤의
    // 반복 추적은 run 상세 쿼리 하나만 담당해 중복 polling을 막습니다.
    refetchInterval: false,
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
    // focus/reconnect에서는 latest 응답이 이 run cache를 함께 최신화합니다.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: inventorySyncPollInterval,
    refetchIntervalInBackground: false,
  });
}

export {
  ACTIVE_STATUSES,
  POLLABLE_STATUSES,
  POLL_INTERVAL_BY_STATUS_MS,
  SNAPSHOT_REFRESH_FAST_POLL_INTERVAL_MS,
  SNAPSHOT_REFRESH_FAST_WINDOW_MS,
  SNAPSHOT_REFRESH_NORMAL_POLL_INTERVAL_MS,
  SNAPSHOT_REFRESH_MAX_WAIT_MS,
};
