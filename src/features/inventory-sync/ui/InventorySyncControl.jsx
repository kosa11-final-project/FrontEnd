import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Refresh } from 'reicon-react';
import { Button, toast } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/format';
import { dashboardKeys, inventoryKeys } from '@/entities/inventory';
import { riskQueryKeys } from '@/entities/risk';
import { statisticsKeys } from '@/entities/statistics';
import { getInventorySync, retryAfterSeconds, startInventorySync } from '../api/inventorySyncApi.js';
import {
  ACTIVE_STATUSES,
  isSnapshotRefreshDelayed,
  isSnapshotRefreshFailed,
  isSnapshotRefreshPending,
  inventorySyncKeys,
  inventorySyncLatestQueryOptions,
  inventorySyncRunQueryOptions,
} from '../model/inventorySyncQueries.js';

export const SYNC_UI_STATES = Object.freeze({
  INITIAL_LOADING: 'INITIAL_LOADING',
  READY: 'READY',
  STARTING: 'STARTING',
  START_UNCERTAIN: 'START_UNCERTAIN',
  START_RATE_LIMITED: 'START_RATE_LIMITED',
  TRACKING: 'TRACKING',
  TRACKING_ERROR: 'TRACKING_ERROR',
  RECOVERY_WAITING: 'RECOVERY_WAITING',
  SNAPSHOT_REFRESHING: 'SNAPSHOT_REFRESHING',
  SNAPSHOT_REFRESH_FAILED: 'SNAPSHOT_REFRESH_FAILED',
  SNAPSHOT_REFRESH_DELAYED: 'SNAPSHOT_REFRESH_DELAYED',
  STATUS_UNAVAILABLE: 'STATUS_UNAVAILABLE',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
});

const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'FAILED', 'SOURCE_CHANGED', 'LAUNCH_FAILED']);
const INVENTORY_REFRESH_JITTER_MS = 3000;
const ERROR_MESSAGE_MAX_LENGTH = 240;
const START_BLOCKED_STATES = new Set([
  SYNC_UI_STATES.INITIAL_LOADING,
  SYNC_UI_STATES.STARTING,
  SYNC_UI_STATES.TRACKING,
  SYNC_UI_STATES.TRACKING_ERROR,
  SYNC_UI_STATES.RECOVERY_WAITING,
  SYNC_UI_STATES.SNAPSHOT_REFRESHING,
  SYNC_UI_STATES.STATUS_UNAVAILABLE,
  SYNC_UI_STATES.START_RATE_LIMITED,
]);
const SYNC_BUSY_STATES = new Set([
  SYNC_UI_STATES.STARTING,
  SYNC_UI_STATES.TRACKING,
  SYNC_UI_STATES.SNAPSHOT_REFRESHING,
]);
const NEW_REQUEST_UI_STATES = new Set([
  SYNC_UI_STATES.SUCCEEDED,
  SYNC_UI_STATES.FAILED,
  SYNC_UI_STATES.SNAPSHOT_REFRESH_FAILED,
  SYNC_UI_STATES.SNAPSHOT_REFRESH_DELAYED,
]);

function hasRefreshedScope(refreshedRunIds, scope, runId) {
  const previousRunId = refreshedRunIds[scope];
  return previousRunId != null && Number(previousRunId) >= Number(runId);
}

function markRefreshedScope(refreshedRunIds, scope, runId) {
  if (!hasRefreshedScope(refreshedRunIds, scope, runId)) refreshedRunIds[scope] = runId;
}

function createClientRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `sync-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isTransportError(error) {
  return !error?.response && !error?.status;
}

function newestSyncRunId(...runIds) {
  return runIds.reduce((newestId, candidateId) => {
    if (candidateId === null || candidateId === undefined) return newestId;
    if (newestId === null || newestId === undefined) return candidateId;
    return Number(candidateId) > Number(newestId) ? candidateId : newestId;
  }, null);
}

function latestSuccessfulSyncAt(run) {
  const sourceTimes = (Array.isArray(run?.sourceStates) ? run.sourceStates : [])
    .map((sourceState) => Date.parse(sourceState?.lastSuccessSyncedAt))
    .filter(Number.isFinite);
  const latestSourceTime = sourceTimes.length > 0 ? Math.max(...sourceTimes) : Number.NaN;

  if (run?.status === 'SUCCEEDED') {
    const completedAt = Date.parse(run.completedAt);
    if (Number.isFinite(completedAt)) return run.completedAt;
  }

  if (Number.isFinite(latestSourceTime)) return new Date(latestSourceTime).toISOString();
  return null;
}

export function summarizeSyncError(value, maxLength = ERROR_MESSAGE_MAX_LENGTH) {
  if (typeof value !== 'string') return '';
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function inventoryRefreshDelay(random = Math.random) {
  return Math.floor(random() * (INVENTORY_REFRESH_JITTER_MS + 1));
}

const SYNC_LABELS = Object.freeze({
  [SYNC_UI_STATES.INITIAL_LOADING]: '재고 동기화 준비 중',
  [SYNC_UI_STATES.STARTING]: '동기화 등록 중',
  [SYNC_UI_STATES.START_UNCERTAIN]: '동기화 등록 재확인',
  [SYNC_UI_STATES.START_RATE_LIMITED]: '잠시 후 다시 실행',
  [SYNC_UI_STATES.TRACKING_ERROR]: '상태 확인 필요',
  [SYNC_UI_STATES.RECOVERY_WAITING]: '복구 대기 중',
  [SYNC_UI_STATES.SNAPSHOT_REFRESHING]: '집계 최신화 중',
  [SYNC_UI_STATES.SNAPSHOT_REFRESH_FAILED]: '집계 최신화 실패',
  [SYNC_UI_STATES.SNAPSHOT_REFRESH_DELAYED]: '집계 확인 지연',
  [SYNC_UI_STATES.STATUS_UNAVAILABLE]: '상태 확인 필요',
});

function resolveSyncUiState({ latestQuery, runQuery, localUiState, syncRunId, observedRunId, observedRun }) {
  if (latestQuery.isLoading) return SYNC_UI_STATES.INITIAL_LOADING;
  if (
    [SYNC_UI_STATES.STARTING, SYNC_UI_STATES.START_UNCERTAIN, SYNC_UI_STATES.START_RATE_LIMITED].includes(localUiState)
  ) {
    return localUiState;
  }
  if (latestQuery.isError && !syncRunId) return SYNC_UI_STATES.STATUS_UNAVAILABLE;
  if (observedRunId && runQuery.isError) return SYNC_UI_STATES.TRACKING_ERROR;
  if (observedRun?.status === 'INTERRUPTED') return SYNC_UI_STATES.RECOVERY_WAITING;
  if (observedRun?.status === 'QUEUED' || observedRun?.status === 'RUNNING') return SYNC_UI_STATES.TRACKING;
  if (isSnapshotRefreshFailed(observedRun)) return SYNC_UI_STATES.SNAPSHOT_REFRESH_FAILED;
  if (isSnapshotRefreshDelayed(observedRun)) return SYNC_UI_STATES.SNAPSHOT_REFRESH_DELAYED;
  if (isSnapshotRefreshPending(observedRun)) return SYNC_UI_STATES.SNAPSHOT_REFRESHING;
  if (observedRun?.status && TERMINAL_STATUSES.has(observedRun.status)) {
    return observedRun.status === 'SUCCEEDED' ? SYNC_UI_STATES.SUCCEEDED : SYNC_UI_STATES.FAILED;
  }
  return localUiState === SYNC_UI_STATES.INITIAL_LOADING ? SYNC_UI_STATES.READY : localUiState;
}

export function InventorySyncControl() {
  const queryClient = useQueryClient();
  const [clientRequestId, setClientRequestId] = useState(createClientRequestId);
  const [syncRunId, setSyncRunId] = useState(null);
  const [uiState, setUiState] = useState(SYNC_UI_STATES.INITIAL_LOADING);
  const [runSnapshot, setRunSnapshot] = useState(null);
  const refreshedRunIdsRef = useRef({ inventory: null, dashboard: null, inventoryStatistics: null });
  const refreshTimersRef = useRef(new Map());
  const rateLimitTimerRef = useRef(null);
  const startedRunIdsRef = useRef(new Set());
  const notifiedTerminalRunsRef = useRef(new Set());
  const previousRunStatusesRef = useRef(new Map());
  const latestQuery = useQuery(inventorySyncLatestQueryOptions());
  const globalActiveRun = latestQuery.data && ACTIVE_STATUSES.has(latestQuery.data.status) ? latestQuery.data : null;
  const observedRunId = newestSyncRunId(globalActiveRun?.syncRunId, syncRunId, latestQuery.data?.syncRunId);
  const runQuery = useQuery(inventorySyncRunQueryOptions(observedRunId));

  useEffect(() => {
    const latestRun = latestQuery.data;
    if (!latestRun?.syncRunId) return;
    queryClient.setQueryData(inventorySyncKeys.run(latestRun.syncRunId), latestRun);
  }, [latestQuery.data, queryClient]);

  const observedRun = runQuery.data || globalActiveRun || runSnapshot || latestQuery.data || null;
  const derivedUiState = resolveSyncUiState({
    latestQuery,
    runQuery,
    localUiState: uiState,
    syncRunId,
    observedRunId,
    observedRun,
  });
  const succeededRun = observedRun?.status === 'SUCCEEDED' ? observedRun : null;
  const succeededRunId = succeededRun?.syncRunId ?? null;
  const succeededChangedCount = Number(succeededRun?.changedCount);
  const snapshotRefresh = succeededRun?.snapshotRefresh;
  const lastSuccessfulSyncAt = latestSuccessfulSyncAt(observedRun);

  useEffect(() => {
    const runId = observedRun?.syncRunId;
    const status = observedRun?.status;
    if (runId == null || !status) return;

    const previousStatus = previousRunStatusesRef.current.get(runId);
    const isStartedHere = startedRunIdsRef.current.has(runId);
    const transitionedFromActive = ACTIVE_STATUSES.has(previousStatus);
    const isSuccessState = derivedUiState === SYNC_UI_STATES.SUCCEEDED;
    const isFailureState = [
      SYNC_UI_STATES.FAILED,
      SYNC_UI_STATES.SNAPSHOT_REFRESH_FAILED,
      SYNC_UI_STATES.SNAPSHOT_REFRESH_DELAYED,
    ].includes(derivedUiState);
    const notificationKey = `${runId}:${isSuccessState ? 'success' : 'failure'}`;

    if (
      TERMINAL_STATUSES.has(status) &&
      (isSuccessState || isFailureState) &&
      (isStartedHere || transitionedFromActive) &&
      !notifiedTerminalRunsRef.current.has(notificationKey)
    ) {
      notifiedTerminalRunsRef.current.add(notificationKey);
      toast({
        title: status === 'SUCCEEDED' ? '재고 동기화가 완료되었습니다.' : '재고 동기화가 실패했습니다.',
        variant: status === 'SUCCEEDED' ? 'default' : 'destructive',
      });
    }

    previousRunStatusesRef.current.set(runId, status);
  }, [derivedUiState, observedRun?.status, observedRun?.syncRunId]);

  useEffect(() => {
    const refreshKey = `${succeededRunId}:inventory`;
    if (
      !succeededRunId ||
      !Number.isFinite(succeededChangedCount) ||
      succeededChangedCount <= 0 ||
      hasRefreshedScope(refreshedRunIdsRef.current, 'inventory', succeededRunId) ||
      refreshTimersRef.current.has(refreshKey)
    ) {
      return;
    }

    const refreshTimer = window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summaries(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.details(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lots(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: riskQueryKeys.all, refetchType: 'active' });
      refreshTimersRef.current.delete(refreshKey);
      markRefreshedScope(refreshedRunIdsRef.current, 'inventory', succeededRunId);
    }, inventoryRefreshDelay());
    refreshTimersRef.current.set(refreshKey, refreshTimer);
  }, [queryClient, succeededChangedCount, succeededRunId]);

  useEffect(() => {
    if (
      !succeededRunId ||
      !Number.isFinite(succeededChangedCount) ||
      succeededChangedCount <= 0 ||
      snapshotRefresh?.required === false
    ) {
      return;
    }

    const legacyContract = snapshotRefresh == null;
    if (
      (legacyContract || snapshotRefresh.dashboardReady === true) &&
      !hasRefreshedScope(refreshedRunIdsRef.current, 'dashboard', succeededRunId)
    ) {
      markRefreshedScope(refreshedRunIdsRef.current, 'dashboard', succeededRunId);
      queryClient.invalidateQueries({ queryKey: dashboardKeys.snapshot(), refetchType: 'all' });
    }

    if (
      (legacyContract || snapshotRefresh.inventoryStatisticsReady === true) &&
      !hasRefreshedScope(refreshedRunIdsRef.current, 'inventoryStatistics', succeededRunId)
    ) {
      markRefreshedScope(refreshedRunIdsRef.current, 'inventoryStatistics', succeededRunId);
      queryClient.invalidateQueries({ queryKey: statisticsKeys.all, refetchType: 'all' });
    }
  }, [queryClient, snapshotRefresh, succeededChangedCount, succeededRunId]);

  useEffect(() => {
    const refreshTimers = refreshTimersRef.current;
    return () => {
      refreshTimers.forEach((timer) => window.clearTimeout(timer));
      refreshTimers.clear();
      if (rateLimitTimerRef.current !== null) window.clearTimeout(rateLimitTimerRef.current);
    };
  }, []);

  const handleStart = useCallback(async () => {
    if (START_BLOCKED_STATES.has(derivedUiState)) return;
    // A terminal run is immutable for its idempotency key. Generate a fresh
    // key for a deliberate new attempt, while START_UNCERTAIN keeps the old
    // key so a transport retry can still resolve the original commit.
    const nextClientRequestId = NEW_REQUEST_UI_STATES.has(derivedUiState) ? createClientRequestId() : clientRequestId;
    if (nextClientRequestId !== clientRequestId) {
      setClientRequestId(nextClientRequestId);
      setSyncRunId(null);
      setRunSnapshot(null);
    }
    setUiState(SYNC_UI_STATES.STARTING);
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await startInventorySync(nextClientRequestId);
        if (response?.syncRunId) {
          startedRunIdsRef.current.add(response.syncRunId);
          setSyncRunId(response.syncRunId);
          setRunSnapshot(response);
          setUiState(ACTIVE_STATUSES.has(response.status) ? SYNC_UI_STATES.TRACKING : SYNC_UI_STATES.READY);
          return;
        }
      } catch (error) {
        lastError = error;
        if (error?.status === 429) {
          const seconds = retryAfterSeconds(error);
          setUiState(SYNC_UI_STATES.START_RATE_LIMITED);
          if (rateLimitTimerRef.current !== null) window.clearTimeout(rateLimitTimerRef.current);
          rateLimitTimerRef.current = window.setTimeout(() => {
            setUiState(SYNC_UI_STATES.READY);
            rateLimitTimerRef.current = null;
          }, seconds * 1000);
          return;
        }
        const conflictRunId = error?.details?.activeRunId ?? error?.details?.data?.syncRunId;
        if (error?.status === 409 && conflictRunId) {
          try {
            const activeRun = await getInventorySync(conflictRunId);
            if (activeRun?.syncRunId) {
              startedRunIdsRef.current.add(activeRun.syncRunId);
              setSyncRunId(activeRun.syncRunId);
              setRunSnapshot(activeRun);
              setUiState(SYNC_UI_STATES.TRACKING);
              return;
            }
          } catch (lookupError) {
            lastError = lookupError;
            // Conflict lookup failure falls through to the bounded registration retry.
          }
        }
        if (!isTransportError(error)) break;
      }
    }
    if (lastError && !isTransportError(lastError)) {
      const description = summarizeSyncError(lastError.message);
      toast({
        title: '재고 동기화가 실패했습니다.',
        ...(description ? { description } : {}),
        variant: 'destructive',
      });
    }
    setUiState(SYNC_UI_STATES.START_UNCERTAIN);
  }, [clientRequestId, derivedUiState]);

  const buttonDisabled = START_BLOCKED_STATES.has(derivedUiState);
  const isSyncBusy = SYNC_BUSY_STATES.has(derivedUiState);
  const isRecoveryAttempt = derivedUiState === SYNC_UI_STATES.TRACKING && Number(observedRun?.mainAttemptNo || 0) > 1;
  const label =
    derivedUiState === SYNC_UI_STATES.TRACKING
      ? isRecoveryAttempt
        ? '재고 동기화 복구 중'
        : '재고 동기화 중입니다'
      : SYNC_LABELS[derivedUiState] || '재고 동기화';

  return (
    <section
      aria-label="재고 동기화"
      className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <strong className="text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
          통합 재고 동기화
        </strong>
        <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          그리팅, 이커머스(모두의 맛집), 백화점, 직영점의 재고가 통합재고로 동기화됩니다.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p
          className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]"
          data-testid="inventory-last-sync"
        >
          최근 동기화{' '}
          <strong className="font-[var(--font-weight-semibold)] text-[color:var(--text-heading)]">
            {formatDateTime(lastSuccessfulSyncAt, { fallback: '없음' })}
          </strong>
        </p>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={handleStart}
          disabled={buttonDisabled}
          aria-busy={isSyncBusy}
        >
          <Refresh size={15} className={isSyncBusy ? 'animate-spin' : undefined} aria-hidden="true" />
          {label}
        </Button>
      </div>
    </section>
  );
}

export { INVENTORY_REFRESH_JITTER_MS };
