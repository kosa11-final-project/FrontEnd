import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Refresh } from 'reicon-react';
import { Button } from '@/shared/ui';
import { formatDateTime, formatNumber } from '@/shared/lib/format';
import { dashboardKeys, inventoryKeys } from '@/entities/inventory';
import { riskQueryKeys } from '@/entities/risk';
import { statisticsKeys } from '@/entities/statistics';
import { getInventorySync, retryAfterSeconds, startInventorySync } from '../api/inventorySyncApi.js';
import {
  ACTIVE_STATUSES,
  inventorySyncLatestQueryOptions,
  inventorySyncRunQueryOptions,
} from '../model/inventorySyncQueries.js';
import {
  getSyncPhaseLabel,
  getSyncSourceTypeLabel,
  getSyncStatusLabel,
  getSyncTriggerTypeLabel,
} from '../model/inventorySyncStatus.js';

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
const INVENTORY_REFRESH_JITTER_MS = 3000;
const ERROR_CODE_MAX_LENGTH = 80;
const ERROR_MESSAGE_MAX_LENGTH = 240;
const ERROR_UI_STATES = new Set([
  SYNC_UI_STATES.START_UNCERTAIN,
  SYNC_UI_STATES.TRACKING_ERROR,
  SYNC_UI_STATES.STATUS_UNAVAILABLE,
  SYNC_UI_STATES.FAILED,
]);
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

function newestSyncRunId(...runIds) {
  return runIds.reduce((newestId, candidateId) => {
    if (candidateId === null || candidateId === undefined) return newestId;
    if (newestId === null || newestId === undefined) return candidateId;
    return Number(candidateId) > Number(newestId) ? candidateId : newestId;
  }, null);
}

export function summarizeSyncError(value, maxLength = ERROR_MESSAGE_MAX_LENGTH) {
  if (typeof value !== 'string') return '';
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`;
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
  return [
    ['동기화 완료', ...details].join(' · '),
    '통합재고 목록·요약·상세·LOT·위험 판정·대시보드·통계 갱신을 요청했습니다.',
  ].join(' — ');
}

export function inventoryRefreshDelay(random = Math.random) {
  return Math.floor(random() * (INVENTORY_REFRESH_JITTER_MS + 1));
}

const STATE_ANNOUNCEMENTS = Object.freeze({
  [SYNC_UI_STATES.STARTING]: '재고 동기화 등록을 시작했습니다.',
  [SYNC_UI_STATES.TRACKING]: '재고 동기화가 실행 중입니다.',
  [SYNC_UI_STATES.RECOVERY_WAITING]: '재고 동기화가 중단되어 복구를 기다립니다.',
  [SYNC_UI_STATES.SUCCEEDED]: '재고 동기화가 완료되었습니다.',
  [SYNC_UI_STATES.FAILED]: '재고 동기화에 실패했습니다.',
  [SYNC_UI_STATES.START_UNCERTAIN]: '동기화 실행 등록 결과를 확인할 수 없습니다.',
  [SYNC_UI_STATES.TRACKING_ERROR]: '동기화 상태 조회에 실패했습니다.',
  [SYNC_UI_STATES.STATUS_UNAVAILABLE]: '최근 동기화 상태를 확인할 수 없습니다.',
});

const SYNC_LABELS = Object.freeze({
  [SYNC_UI_STATES.INITIAL_LOADING]: '재고 동기화 준비 중',
  [SYNC_UI_STATES.STARTING]: '동기화 등록 중',
  [SYNC_UI_STATES.START_UNCERTAIN]: '동기화 등록 재확인',
  [SYNC_UI_STATES.START_RATE_LIMITED]: '잠시 후 다시 실행',
  [SYNC_UI_STATES.TRACKING_ERROR]: '상태 확인 필요',
  [SYNC_UI_STATES.RECOVERY_WAITING]: '복구 대기 중',
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
  if (observedRun?.status && TERMINAL_STATUSES.has(observedRun.status)) {
    return observedRun.status === 'SUCCEEDED' ? SYNC_UI_STATES.SUCCEEDED : SYNC_UI_STATES.FAILED;
  }
  return localUiState === SYNC_UI_STATES.INITIAL_LOADING ? SYNC_UI_STATES.READY : localUiState;
}

function resolveDisplayNotice({
  uiState,
  latestLoading,
  latestError,
  runError,
  observedRunId,
  observedRun,
  isRecoveryAttempt,
  notice,
}) {
  if (latestLoading && !observedRun) return '최근 동기화 상태를 확인하는 중입니다.';
  if (uiState === SYNC_UI_STATES.STATUS_UNAVAILABLE || (latestError && !observedRunId)) {
    return '최근 동기화 상태를 불러오지 못했습니다. 상태를 다시 확인해 주세요.';
  }
  if (uiState === SYNC_UI_STATES.TRACKING) {
    if (isRecoveryAttempt) {
      return `재고 동기화 복구 시도 ${formatNumber(observedRun.mainAttemptNo)}회차입니다. 완료될 때까지 새 실행을 막습니다.`;
    }
    return '재고 동기화 중입니다. 이 화면의 실행 버튼을 잠그고 서버에서 중복 실행을 차단합니다.';
  }
  if (uiState === SYNC_UI_STATES.SUCCEEDED) return formatCompletionNotice(observedRun);
  if (uiState === SYNC_UI_STATES.FAILED) {
    return summarizeSyncError(observedRun?.errorMessage) || '재고 동기화에 실패했습니다.';
  }
  if (runError) return '동기화 상태 조회에 실패했습니다. 마지막 정상 상태를 유지합니다.';
  if (uiState === SYNC_UI_STATES.RECOVERY_WAITING) return '동기화가 중단되어 운영자 복구를 기다리는 중입니다.';
  return (
    notice ||
    (observedRun ? `상태: ${getSyncStatusLabel(observedRun.status)}` : '원천 4종을 정제해 통합재고에 반영합니다.')
  );
}

function resolveSyncPresentation({ uiState, latestQuery, runQuery, observedRunId, observedRun, notice }) {
  const isRecoveryAttempt = uiState === SYNC_UI_STATES.TRACKING && Number(observedRun?.mainAttemptNo || 0) > 1;
  const label =
    uiState === SYNC_UI_STATES.TRACKING
      ? isRecoveryAttempt
        ? '재고 동기화 복구 중'
        : '재고 동기화 중입니다'
      : SYNC_LABELS[uiState] || '재고 동기화';
  const displayNotice = resolveDisplayNotice({
    uiState,
    latestLoading: latestQuery.isLoading,
    latestError: latestQuery.isError,
    runError: runQuery.isError,
    observedRunId,
    observedRun,
    isRecoveryAttempt,
    notice,
  });
  const phaseAnnouncement =
    uiState === SYNC_UI_STATES.TRACKING && observedRun?.phase
      ? `${isRecoveryAttempt ? `복구 시도 ${formatNumber(observedRun.mainAttemptNo)}회차, ` : ''}${getSyncPhaseLabel(observedRun.phase)} 단계가 실행 중입니다.`
      : STATE_ANNOUNCEMENTS[uiState] || '';

  return {
    displayNotice,
    isErrorState: ERROR_UI_STATES.has(uiState),
    isRecoveryAttempt,
    label,
    phaseAnnouncement,
  };
}

function RunDetails({ run, defaultOpen = false }) {
  if (!run) return null;

  const sourceRuns = Array.isArray(run.sourceRuns) ? run.sourceRuns : [];
  const sourceStates = Array.isArray(run.sourceStates) ? run.sourceStates : [];
  const errorCode = summarizeSyncError(run.errorCode, ERROR_CODE_MAX_LENGTH);
  const errorMessage = summarizeSyncError(run.errorMessage);
  const attempt = Number(run.mainAttemptNo);
  const runMeta = [
    run.phase ? `단계 ${getSyncPhaseLabel(run.phase)}` : null,
    run.triggerType ? getSyncTriggerTypeLabel(run.triggerType) : null,
    Number.isFinite(attempt) && attempt > 0 ? `시도 ${formatNumber(attempt)}회` : null,
  ].filter(Boolean);
  const counts = [
    ['읽음', run.readCount],
    ['매핑', run.mappedCount],
    ['반영', run.changedCount],
    ['오류', run.errorCount],
  ].filter(([, value]) => value !== null && value !== undefined);

  return (
    <details
      className="mt-1.5 w-full max-w-96 rounded-lg border border-gray-200 bg-white text-left text-[11px] text-gray-600 shadow-2xs sm:w-96"
      open={defaultOpen || undefined}
    >
      <summary className="cursor-pointer select-none px-3 py-2 font-semibold text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">
        동기화 상세 정보
      </summary>
      <div className="space-y-2 border-t border-gray-100 px-3 py-2.5">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {run.syncRunId != null && <span>실행 #{run.syncRunId}</span>}
          {runMeta.length > 0 && <span>{runMeta.join(' · ')}</span>}
          {errorCode && <span className="font-semibold text-rose-700">오류 코드 {errorCode}</span>}
        </div>

        {counts.length > 0 && (
          <dl className="grid grid-cols-4 gap-1">
            {counts.map(([label, value]) => (
              <div key={label} className="rounded bg-gray-50 px-1.5 py-1 text-center">
                <dt className="text-[10px] text-gray-400">{label}</dt>
                <dd className="font-semibold tabular-nums text-gray-700">{formatNumber(value)}건</dd>
              </div>
            ))}
          </dl>
        )}

        {sourceRuns.length > 0 && (
          <div>
            <p className="mb-1 font-semibold text-gray-500">원천별 실행 결과</p>
            <ul className="space-y-1">
              {sourceRuns.map((source) => (
                <li
                  key={source.sourceType}
                  className="flex flex-wrap justify-between gap-1 rounded bg-gray-50 px-2 py-1"
                >
                  <span className="font-semibold text-gray-700">{getSyncSourceTypeLabel(source.sourceType)}</span>
                  <span>
                    {getSyncStatusLabel(source.status)} · 읽음 {formatNumber(source.readCount)} · 매핑{' '}
                    {formatNumber(source.mappedCount)} · 반영 {formatNumber(source.changedCount)} · 오류{' '}
                    {formatNumber(source.errorCount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sourceStates.length > 0 && (
          <p className="text-[10px] leading-4 text-gray-400">
            원천 현재{' '}
            {formatNumber(sourceStates.reduce((sum, source) => sum + Number(source.currentRecordCount || 0), 0))}건 ·
            대기 {formatNumber(sourceStates.reduce((sum, source) => sum + Number(source.pendingRecordCount || 0), 0))}건
          </p>
        )}

        {errorMessage && <p className="rounded bg-rose-50 px-2 py-1.5 text-rose-700">{errorMessage}</p>}
      </div>
    </details>
  );
}

export function InventorySyncControl() {
  const queryClient = useQueryClient();
  const [clientRequestId, setClientRequestId] = useState(createClientRequestId);
  const [syncRunId, setSyncRunId] = useState(null);
  const [uiState, setUiState] = useState(SYNC_UI_STATES.INITIAL_LOADING);
  const [runSnapshot, setRunSnapshot] = useState(null);
  const [notice, setNotice] = useState('');
  const refreshedRunIdsRef = useRef(new Set());
  const refreshTimersRef = useRef(new Map());
  const rateLimitTimerRef = useRef(null);
  const latestQuery = useQuery(inventorySyncLatestQueryOptions());
  const globalActiveRun = latestQuery.data && ACTIVE_STATUSES.has(latestQuery.data.status) ? latestQuery.data : null;
  const observedRunId = newestSyncRunId(globalActiveRun?.syncRunId, syncRunId, latestQuery.data?.syncRunId);
  const runQuery = useQuery(inventorySyncRunQueryOptions(observedRunId));

  const observedRun = runQuery.data || globalActiveRun || runSnapshot || latestQuery.data || null;
  const derivedUiState = resolveSyncUiState({
    latestQuery,
    runQuery,
    localUiState: uiState,
    syncRunId,
    observedRunId,
    observedRun,
  });
  const succeededRunId = runQuery.data?.status === 'SUCCEEDED' ? runQuery.data.syncRunId : null;

  useEffect(() => {
    if (
      !succeededRunId ||
      refreshedRunIdsRef.current.has(succeededRunId) ||
      refreshTimersRef.current.has(succeededRunId)
    ) {
      return;
    }

    const refreshTimer = window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summaries() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.details() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lots() });
      queryClient.invalidateQueries({ queryKey: riskQueryKeys.all });
      // Snapshot creation runs independently after the canonical inventory commit.
      // Mark both read models stale so the next dashboard/statistics view reads the new snapshot.
      queryClient.invalidateQueries({ queryKey: dashboardKeys.snapshot() });
      queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
      refreshTimersRef.current.delete(succeededRunId);
      refreshedRunIdsRef.current.add(succeededRunId);
    }, inventoryRefreshDelay());
    refreshTimersRef.current.set(succeededRunId, refreshTimer);
  }, [queryClient, succeededRunId]);

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
    if (derivedUiState === SYNC_UI_STATES.STATUS_UNAVAILABLE) {
      latestQuery.refetch();
      return;
    }
    if (derivedUiState === SYNC_UI_STATES.TRACKING_ERROR && observedRunId) {
      runQuery.refetch();
      return;
    }
    latestQuery.refetch();
  }, [derivedUiState, handleStart, latestQuery, observedRunId, runQuery]);

  const buttonDisabled = START_BLOCKED_STATES.has(derivedUiState);
  const { displayNotice, isErrorState, label, phaseAnnouncement } = resolveSyncPresentation({
    uiState: derivedUiState,
    latestQuery,
    runQuery,
    observedRunId,
    observedRun,
    notice,
  });

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
      <p
        id="inventory-sync-status"
        className={`mt-1 max-w-96 text-right text-[11px] ${isErrorState ? 'text-rose-700' : 'text-gray-500'}`}
        role={isErrorState ? 'alert' : undefined}
      >
        {displayNotice}
      </p>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {phaseAnnouncement}
      </span>
      {[SYNC_UI_STATES.START_UNCERTAIN, SYNC_UI_STATES.TRACKING_ERROR, SYNC_UI_STATES.STATUS_UNAVAILABLE].includes(
        derivedUiState,
      ) && (
        <button
          type="button"
          className="mt-1 text-right text-[11px] font-semibold text-blue-700 underline"
          onClick={handleRetry}
        >
          상태 다시 확인
        </button>
      )}
      <RunDetails run={observedRun} defaultOpen={isErrorState} />
    </div>
  );
}

export { INVENTORY_REFRESH_JITTER_MS };
