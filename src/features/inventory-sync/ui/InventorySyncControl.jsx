import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Refresh } from 'reicon-react';
import { Button } from '@/shared/ui';
import { formatDateTime, formatNumber } from '@/shared/lib/format';
import { inventoryKeys } from '@/entities/inventory';
import { riskQueryKeys } from '@/entities/risk';
import { getInventorySync, retryAfterSeconds, startInventorySync } from '../api/inventorySyncApi.js';
import {
  ACTIVE_STATUSES,
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
  STATUS_UNAVAILABLE: 'STATUS_UNAVAILABLE',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
});

const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'FAILED', 'SOURCE_CHANGED', 'LAUNCH_FAILED']);
const START_BLOCKED_STATES = new Set([
  SYNC_UI_STATES.INITIAL_LOADING,
  SYNC_UI_STATES.STARTING,
  SYNC_UI_STATES.TRACKING,
  SYNC_UI_STATES.TRACKING_ERROR,
  SYNC_UI_STATES.RECOVERY_WAITING,
  SYNC_UI_STATES.STATUS_UNAVAILABLE,
  SYNC_UI_STATES.START_RATE_LIMITED,
]);

function createClientRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `sync-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isTransportError(error) {
  return !error?.response && !error?.status;
}

function formatCompletionNotice(run) {
  const details = [];
  if (Array.isArray(run?.sourceStates) && run.sourceStates.length > 0) {
    const sourceCurrentCount = run.sourceStates.reduce((sum, state) => {
      const count = Number(state?.currentRecordCount);
      return sum + (Number.isFinite(count) ? count : 0);
    }, 0);
    details.push(`원천 ${formatNumber(sourceCurrentCount)}건`);
  }
  if (run?.readCount !== null && run?.readCount !== undefined) {
    details.push(`동기화 대상 ${formatNumber(run.readCount)}건`);
  }
  if (run?.changedCount !== null && run?.changedCount !== undefined) {
    details.push(`반영 ${formatNumber(run.changedCount)}건`);
  }
  if (run?.errorCount !== null && run?.errorCount !== undefined) {
    details.push(`오류 ${formatNumber(run.errorCount)}건`);
  }
  if (run?.completedAt) details.push(formatDateTime(run.completedAt));
  return ['동기화 완료', ...details].join(' · ');
}

export function InventorySyncControl() {
  const queryClient = useQueryClient();
  const [clientRequestId, setClientRequestId] = useState(createClientRequestId);
  const [syncRunId, setSyncRunId] = useState(null);
  const [uiState, setUiState] = useState(SYNC_UI_STATES.INITIAL_LOADING);
  const [runSnapshot, setRunSnapshot] = useState(null);
  const [notice, setNotice] = useState('');
  const invalidatedRunRef = useRef(null);
  const latestQuery = useQuery(inventorySyncLatestQueryOptions());
  const globalActiveRun = latestQuery.data && ACTIVE_STATUSES.has(latestQuery.data.status) ? latestQuery.data : null;
  const observedRunId = globalActiveRun?.syncRunId || syncRunId || latestQuery.data?.syncRunId || null;
  const runQuery = useQuery(inventorySyncRunQueryOptions(observedRunId));

  const observedRun = globalActiveRun || runQuery.data || runSnapshot || latestQuery.data || null;
  const derivedUiState = latestQuery.isLoading
    ? SYNC_UI_STATES.INITIAL_LOADING
    : [SYNC_UI_STATES.STARTING, SYNC_UI_STATES.START_UNCERTAIN, SYNC_UI_STATES.START_RATE_LIMITED].includes(uiState)
      ? uiState
      : latestQuery.isError && !syncRunId
        ? SYNC_UI_STATES.STATUS_UNAVAILABLE
        : observedRun?.status === 'INTERRUPTED'
          ? SYNC_UI_STATES.RECOVERY_WAITING
          : observedRun?.status === 'QUEUED' || observedRun?.status === 'RUNNING'
            ? SYNC_UI_STATES.TRACKING
            : runQuery.isError
              ? SYNC_UI_STATES.TRACKING_ERROR
              : observedRun?.status && TERMINAL_STATUSES.has(observedRun.status)
                ? observedRun.status === 'SUCCEEDED'
                  ? SYNC_UI_STATES.SUCCEEDED
                  : SYNC_UI_STATES.FAILED
                : uiState === SYNC_UI_STATES.INITIAL_LOADING
                  ? SYNC_UI_STATES.READY
                  : uiState;

  useEffect(() => {
    if (runQuery.data?.status === 'SUCCEEDED' && invalidatedRunRef.current !== runQuery.data.syncRunId) {
      invalidatedRunRef.current = runQuery.data.syncRunId;
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summaries() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.details() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lots() });
      queryClient.invalidateQueries({ queryKey: riskQueryKeys.all });
    }
  }, [queryClient, runQuery.data]);

  const handleStart = useCallback(async () => {
    if (START_BLOCKED_STATES.has(derivedUiState)) return;
    // A terminal run is immutable for its idempotency key. Generate a fresh
    // key for a deliberate new attempt, while START_UNCERTAIN keeps the old
    // key so a transport retry can still resolve the original commit.
    const nextClientRequestId = [SYNC_UI_STATES.SUCCEEDED, SYNC_UI_STATES.FAILED].includes(derivedUiState)
      ? createClientRequestId()
      : clientRequestId;
    if (nextClientRequestId !== clientRequestId) {
      setClientRequestId(nextClientRequestId);
      setSyncRunId(null);
      setRunSnapshot(null);
    }
    setUiState(SYNC_UI_STATES.STARTING);
    setNotice('동기화 실행을 등록하는 중입니다.');
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await startInventorySync(nextClientRequestId);
        if (response?.syncRunId) {
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
          setNotice(`${seconds}초 후 다시 실행할 수 있습니다.`);
          window.setTimeout(() => setUiState(SYNC_UI_STATES.READY), seconds * 1000);
          return;
        }
        const conflictRunId = error?.details?.activeRunId ?? error?.details?.data?.syncRunId;
        if (error?.status === 409 && conflictRunId) {
          try {
            const activeRun = await getInventorySync(conflictRunId);
            if (activeRun?.syncRunId) {
              setSyncRunId(activeRun.syncRunId);
              setRunSnapshot(activeRun);
              setUiState(SYNC_UI_STATES.TRACKING);
              return;
            }
          } catch (lookupError) {
            lastError = lookupError;
          }
        }
        if (!isTransportError(error)) break;
      }
    }
    setUiState(SYNC_UI_STATES.START_UNCERTAIN);
    setNotice(lastError?.message || '실행 등록 결과가 불확실합니다. 같은 요청으로 다시 확인해 주세요.');
  }, [clientRequestId, derivedUiState]);

  const handleRetry = useCallback(() => {
    if (derivedUiState === SYNC_UI_STATES.START_UNCERTAIN) {
      handleStart();
      return;
    }
    if (syncRunId) runQuery.refetch();
    else latestQuery.refetch();
  }, [derivedUiState, handleStart, latestQuery, runQuery, syncRunId]);

  const buttonDisabled = START_BLOCKED_STATES.has(derivedUiState);
  const label =
    derivedUiState === SYNC_UI_STATES.STARTING
      ? '동기화 등록 중'
      : derivedUiState === SYNC_UI_STATES.TRACKING
        ? '재고 동기화 중입니다'
        : derivedUiState === SYNC_UI_STATES.RECOVERY_WAITING
          ? '복구 대기 중'
          : derivedUiState === SYNC_UI_STATES.INITIAL_LOADING || derivedUiState === SYNC_UI_STATES.STATUS_UNAVAILABLE
            ? '재고 동기화 준비 중'
            : '재고 동기화';
  const displayNotice =
    (latestQuery.isError && !syncRunId) || (latestQuery.isLoading && !observedRun)
      ? '원천 데이터 연결과 Flyway 반영 후 활성화됩니다.'
      : derivedUiState === SYNC_UI_STATES.TRACKING
        ? '재고 동기화 중입니다. 완료될 때까지 모든 사용자의 실행 버튼이 잠깁니다.'
        : derivedUiState === SYNC_UI_STATES.SUCCEEDED
          ? formatCompletionNotice(observedRun)
          : derivedUiState === SYNC_UI_STATES.FAILED
            ? observedRun?.errorMessage || '재고 동기화에 실패했습니다.'
            : runQuery.isError
              ? '동기화 상태 조회에 실패했습니다. 마지막 정상 상태를 유지합니다.'
              : derivedUiState === SYNC_UI_STATES.RECOVERY_WAITING
                ? '동기화가 중단되어 운영자 복구를 기다리는 중입니다.'
                : notice || (observedRun ? `상태: ${observedRun.status}` : '원천 4종을 정제해 통합재고에 반영합니다.');

  return (
    <div className="flex shrink-0 flex-col items-stretch sm:items-end">
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={handleStart}
        disabled={buttonDisabled}
        aria-describedby="inventory-sync-status"
        aria-busy={derivedUiState === SYNC_UI_STATES.STARTING || derivedUiState === SYNC_UI_STATES.TRACKING}
      >
        <Refresh
          size={15}
          className={
            [SYNC_UI_STATES.STARTING, SYNC_UI_STATES.TRACKING].includes(derivedUiState) ? 'animate-spin' : undefined
          }
          aria-hidden="true"
        />
        {label}
      </Button>
      <p id="inventory-sync-status" className="mt-1 max-w-72 text-right text-[11px] text-gray-500" aria-live="polite">
        {displayNotice}
      </p>
      {[SYNC_UI_STATES.START_UNCERTAIN, SYNC_UI_STATES.TRACKING_ERROR].includes(derivedUiState) && (
        <button
          type="button"
          className="mt-1 text-right text-[11px] font-semibold text-blue-700 underline"
          onClick={handleRetry}
        >
          상태 다시 확인
        </button>
      )}
    </div>
  );
}
