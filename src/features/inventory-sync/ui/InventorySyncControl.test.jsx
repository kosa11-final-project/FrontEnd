import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const apiMock = vi.hoisted(() => ({
  getInventorySync: vi.fn(),
  getInventorySyncLatest: vi.fn(),
  retryAfterSeconds: vi.fn((error) => Number(error?.headers?.['retry-after']) || 10),
  startInventorySync: vi.fn(),
}));
vi.mock('../api/inventorySyncApi.js', () => apiMock);

import {
  INVENTORY_REFRESH_JITTER_MS,
  InventorySyncControl,
  inventoryRefreshDelay,
  summarizeSyncError,
} from './InventorySyncControl.jsx';

function renderControl(queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <InventorySyncControl />
    </QueryClientProvider>,
  );
  return { ...rendered, queryClient };
}

describe('InventorySyncControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.getInventorySyncLatest.mockResolvedValue(null);
    apiMock.getInventorySync.mockResolvedValue({ syncRunId: 42, status: 'RUNNING' });
  });

  it('starts one durable run and tracks it without duplicate clicks', async () => {
    apiMock.startInventorySync.mockResolvedValue({ syncRunId: 42, status: 'RUNNING' });
    renderControl();
    const button = await screen.findByRole('button', { name: '재고 동기화' });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(apiMock.startInventorySync).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: '재고 동기화 중입니다' })).toBeDisabled();
  });

  it('replaces the registration notice when a fast run has already completed', async () => {
    apiMock.startInventorySync.mockResolvedValue({ syncRunId: 42, status: 'QUEUED' });
    apiMock.getInventorySync.mockResolvedValue({
      syncRunId: 42,
      status: 'SUCCEEDED',
      readCount: 0,
      changedCount: 0,
      errorCount: 0,
      completedAt: '2026-08-21T22:48:05+09:00',
      sourceStates: [
        { sourceType: 'OFFLINE', currentRecordCount: 23392 },
        { sourceType: 'ECOMMERCE', currentRecordCount: 325 },
        { sourceType: 'GREETING', currentRecordCount: 1416 },
        { sourceType: 'WAREHOUSE', currentRecordCount: 8225 },
      ],
    });
    renderControl();

    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    expect(
      await screen.findByText(/동기화 완료 · 원천 33,358건 · 동기화 대상 0건 · 반영 0건 · 오류 0건 · 2026.08.21 22:48/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '재고 동기화' })).toBeEnabled();
    expect(screen.queryByText('동기화 실행을 등록하는 중입니다.')).not.toBeInTheDocument();
  });

  it('attaches to the active run returned by a concurrent-session conflict', async () => {
    apiMock.startInventorySync.mockRejectedValue({
      status: 409,
      details: { data: { syncRunId: 77 } },
      message: '이미 실행 중입니다.',
    });
    apiMock.getInventorySync.mockResolvedValue({ syncRunId: 77, status: 'RUNNING' });
    renderControl();

    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    await waitFor(() => expect(screen.getByRole('button', { name: '재고 동기화 중입니다' })).toBeDisabled());
    expect(apiMock.getInventorySync).toHaveBeenCalledWith(77);
  });

  it('reuses one idempotency key for a bounded transport retry', async () => {
    apiMock.startInventorySync
      .mockRejectedValueOnce(new TypeError('network disconnected'))
      .mockResolvedValueOnce({ syncRunId: 42, status: 'RUNNING' });
    renderControl();

    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    await waitFor(() => expect(apiMock.startInventorySync).toHaveBeenCalledTimes(2));
    expect(apiMock.startInventorySync.mock.calls[0][0]).toBe(apiMock.startInventorySync.mock.calls[1][0]);
    expect(await screen.findByRole('button', { name: '재고 동기화 중입니다' })).toBeDisabled();
  });

  it('shows rate-limit guidance, unlocks after Retry-After, and clears a pending timer on unmount', async () => {
    apiMock.startInventorySync.mockRejectedValue({ status: 429, headers: { 'retry-after': '0.05' } });
    const { unmount } = renderControl();

    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    expect(await screen.findByRole('button', { name: '잠시 후 다시 실행' })).toBeDisabled();
    expect(screen.getByText('0.05초 후 다시 실행할 수 있습니다.')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '재고 동기화' })).toBeEnabled();

    apiMock.startInventorySync.mockRejectedValue({ status: 429, headers: { 'retry-after': '60' } });
    fireEvent.click(screen.getByRole('button', { name: '재고 동기화' }));
    expect(await screen.findByRole('button', { name: '잠시 후 다시 실행' })).toBeDisabled();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('keeps the start button disabled and exposes retry when an active run detail is unavailable', async () => {
    apiMock.getInventorySyncLatest.mockResolvedValue({ syncRunId: 42, status: 'RUNNING' });
    apiMock.getInventorySync.mockRejectedValue({ status: 503, message: '상태 조회 실패' });
    const { container } = renderControl();

    const button = await screen.findByRole('button', { name: '상태 확인 필요' });
    expect(button).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('동기화 상태 조회에 실패했습니다.');
    expect(screen.getByRole('button', { name: '상태 다시 확인' })).toBeEnabled();
    expect(container.querySelector('svg')).not.toHaveClass('animate-spin');
    expect(apiMock.startInventorySync).not.toHaveBeenCalled();

    apiMock.getInventorySync.mockResolvedValue({ syncRunId: 42, status: 'RUNNING' });
    fireEvent.click(screen.getByRole('button', { name: '상태 다시 확인' }));
    expect(await screen.findByRole('button', { name: '재고 동기화 중입니다' })).toBeDisabled();
  });

  it('retries latest, not a cached terminal run, after a background latest failure', async () => {
    const succeededRun = { syncRunId: 42, status: 'SUCCEEDED', completedAt: '2026-08-21T22:48:05+09:00' };
    apiMock.getInventorySyncLatest.mockResolvedValueOnce(succeededRun).mockRejectedValueOnce({ status: 503 });
    apiMock.getInventorySync.mockResolvedValue(succeededRun);
    const { queryClient } = renderControl();

    expect(await screen.findByRole('button', { name: '재고 동기화' })).toBeEnabled();
    await queryClient.refetchQueries({ queryKey: ['inventory-sync', 'latest'] });
    expect(await screen.findByRole('button', { name: '상태 확인 필요' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('최근 동기화 상태를 불러오지 못했습니다.');

    apiMock.getInventorySyncLatest.mockResolvedValue(null);
    fireEvent.click(screen.getByRole('button', { name: '상태 다시 확인' }));

    await waitFor(() => expect(apiMock.getInventorySyncLatest).toHaveBeenCalledTimes(3));
    expect(await screen.findByRole('button', { name: '재고 동기화' })).toBeEnabled();
  });

  it('keeps tracking a globally discovered run after latest changes it to terminal', async () => {
    const localRun = { syncRunId: 42, status: 'SUCCEEDED' };
    const globalRunningRun = { syncRunId: 43, status: 'RUNNING', phase: 'CANONICAL' };
    const globalSucceededRun = { syncRunId: 43, status: 'SUCCEEDED', phase: 'DONE' };
    apiMock.startInventorySync.mockResolvedValue(localRun);
    apiMock.getInventorySync.mockImplementation((syncRunId) =>
      Promise.resolve(syncRunId === 43 ? globalRunningRun : localRun),
    );
    const { queryClient } = renderControl();

    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));
    expect(await screen.findByText('실행 #42')).toBeInTheDocument();

    act(() => {
      queryClient.setQueryData(['inventory-sync', 'latest'], globalRunningRun);
      queryClient.setQueryData(['inventory-sync', 'run', 43], globalRunningRun);
    });
    expect(await screen.findByRole('button', { name: '재고 동기화 중입니다' })).toBeDisabled();
    expect(screen.getByText('실행 #43')).toBeInTheDocument();

    act(() => {
      queryClient.setQueryData(['inventory-sync', 'latest'], globalSucceededRun);
      queryClient.setQueryData(['inventory-sync', 'run', 43], globalSucceededRun);
    });

    expect(await screen.findByRole('button', { name: '재고 동기화' })).toBeEnabled();
    expect(screen.getByText('실행 #43')).toBeInTheDocument();
    expect(screen.queryByText('실행 #42')).not.toBeInTheDocument();
  });

  it('keeps an interrupted run locked while showing recovery waiting guidance', async () => {
    const interruptedRun = { syncRunId: 42, status: 'INTERRUPTED', phase: 'CANONICAL', mainAttemptNo: 1 };
    apiMock.getInventorySyncLatest.mockResolvedValue(interruptedRun);
    apiMock.getInventorySync.mockResolvedValue(interruptedRun);

    renderControl();

    expect(await screen.findByRole('button', { name: '복구 대기 중' })).toBeDisabled();
    expect(screen.getByText('동기화가 중단되어 운영자 복구를 기다리는 중입니다.')).toBeInTheDocument();
    expect(screen.getByText('재고 동기화가 중단되어 복구를 기다립니다.')).toHaveClass('sr-only');
  });

  it('discloses phase, attempt, source progress, and failure detail from the run response', async () => {
    const failedRun = {
      syncRunId: 42,
      status: 'FAILED',
      phase: 'CANONICAL',
      mainAttemptNo: 2,
      readCount: 120,
      mappedCount: 118,
      changedCount: 17,
      errorCount: 2,
      errorCode: 'SYNC_FAILED',
      errorMessage: '위험 판정 저장 중 오류가 발생했습니다.',
      sourceRuns: [
        { sourceType: 'OFFLINE', status: 'SUCCEEDED', readCount: 100, mappedCount: 100, changedCount: 12 },
        { sourceType: 'WAREHOUSE', status: 'FAILED', readCount: 20, mappedCount: 18, changedCount: 5, errorCount: 2 },
      ],
    };
    apiMock.getInventorySyncLatest.mockResolvedValue(failedRun);
    apiMock.getInventorySync.mockResolvedValue(failedRun);

    renderControl();

    expect(await screen.findByRole('alert')).toHaveTextContent('위험 판정 저장 중 오류가 발생했습니다.');
    expect(screen.getByText('동기화 상세 정보')).toBeInTheDocument();
    expect(screen.getByText('단계 통합재고 반영 · 시도 2회')).toBeInTheDocument();
    expect(screen.getByText('오류 코드 SYNC_FAILED')).toBeInTheDocument();
    expect(screen.getByText('오프라인')).toBeInTheDocument();
    expect(screen.getByText('물류센터')).toBeInTheDocument();
  });

  it('invalidates every integrated-inventory read scope once after success', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    apiMock.startInventorySync.mockResolvedValue({ syncRunId: 42, status: 'QUEUED' });
    apiMock.getInventorySync.mockResolvedValue({
      syncRunId: 42,
      status: 'SUCCEEDED',
      readCount: 1,
      changedCount: 1,
      errorCount: 0,
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    renderControl(queryClient);

    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(7));
    expect(invalidateSpy.mock.calls.map(([options]) => options.queryKey)).toEqual([
      ['inventory', 'list'],
      ['inventory', 'summary'],
      ['inventory', 'detail'],
      ['inventory', 'lots'],
      ['inventory-risk'],
      ['dashboard', 'snapshot'],
      ['statistics'],
    ]);
    expect(screen.getByText(/목록·요약·상세·LOT·위험 판정·대시보드·통계 갱신을 요청했습니다/)).toBeInTheDocument();
    randomSpy.mockRestore();
  });

  it('delays a successful inventory refresh by zero to three seconds', () => {
    expect(inventoryRefreshDelay(() => 0)).toBe(0);
    expect(inventoryRefreshDelay(() => 0.999999)).toBe(INVENTORY_REFRESH_JITTER_MS);
  });

  it('runs the delayed inventory refresh once for one successful run id', async () => {
    vi.useFakeTimers();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const succeededRun = { syncRunId: 42, status: 'SUCCEEDED', readCount: 1, changedCount: 1, errorCount: 0 };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['inventory-sync', 'latest'], succeededRun);
    queryClient.setQueryData(['inventory-sync', 'run', 42], succeededRun);
    apiMock.getInventorySyncLatest.mockResolvedValue(succeededRun);
    apiMock.getInventorySync.mockResolvedValue(succeededRun);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    try {
      renderControl(queryClient);
      await act(async () => {});
      expect(invalidateSpy).not.toHaveBeenCalled();

      await act(() => vi.advanceTimersByTimeAsync(INVENTORY_REFRESH_JITTER_MS - 1));
      expect(invalidateSpy).not.toHaveBeenCalled();

      await act(() => vi.advanceTimersByTimeAsync(1));
      expect(invalidateSpy).toHaveBeenCalledTimes(7);

      queryClient.setQueryData(['inventory-sync', 'run', 42], { ...succeededRun, completedAt: '2026-08-21' });
      await act(async () => {});
      expect(invalidateSpy).toHaveBeenCalledTimes(7);
    } finally {
      randomSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('does not cancel an earlier successful run refresh when another run becomes observed', async () => {
    vi.useFakeTimers();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const run42 = { syncRunId: 42, status: 'SUCCEEDED' };
    const run43 = { syncRunId: 43, status: 'SUCCEEDED' };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['inventory-sync', 'latest'], run42);
    queryClient.setQueryData(['inventory-sync', 'run', 42], run42);
    apiMock.getInventorySyncLatest.mockResolvedValue(run42);
    apiMock.getInventorySync.mockImplementation((syncRunId) => Promise.resolve(syncRunId === 43 ? run43 : run42));
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    try {
      renderControl(queryClient);
      await act(async () => {});

      act(() => {
        queryClient.setQueryData(['inventory-sync', 'latest'], { ...run43, status: 'RUNNING' });
        queryClient.setQueryData(['inventory-sync', 'run', 43], run43);
      });
      await act(async () => {});
      expect(invalidateSpy).not.toHaveBeenCalled();

      await act(() => vi.advanceTimersByTimeAsync(INVENTORY_REFRESH_JITTER_MS));
      expect(invalidateSpy).toHaveBeenCalledTimes(14);
    } finally {
      randomSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('normalizes and safely truncates backend error details', () => {
    expect(summarizeSyncError('  위험\n판정\t실패  ', 20)).toBe('위험 판정 실패');
    expect(summarizeSyncError('123456', 5)).toBe('1234…');
    expect(summarizeSyncError(null, 5)).toBe('');
  });

  it('distinguishes a recovery attempt and announces its current phase', async () => {
    apiMock.getInventorySyncLatest.mockResolvedValue({
      syncRunId: 42,
      status: 'RUNNING',
      phase: 'RISK_ASSESSMENT',
      mainAttemptNo: 2,
    });
    apiMock.getInventorySync.mockResolvedValue({
      syncRunId: 42,
      status: 'RUNNING',
      phase: 'RISK_ASSESSMENT',
      mainAttemptNo: 2,
    });

    renderControl();

    expect(await screen.findByRole('button', { name: '재고 동기화 복구 중' })).toBeDisabled();
    expect(screen.getByText(/재고 동기화 복구 시도 2회차/)).toBeInTheDocument();
    expect(screen.getByText('복구 시도 2회차, 위험 판정 단계가 실행 중입니다.')).toHaveClass('sr-only');
  });

  it('uses a new idempotency key when deliberately retrying a terminal failure', async () => {
    apiMock.startInventorySync
      .mockResolvedValueOnce({ syncRunId: 42, status: 'FAILED' })
      .mockResolvedValueOnce({ syncRunId: 43, status: 'RUNNING' });
    apiMock.getInventorySync.mockResolvedValue({ syncRunId: 42, status: 'FAILED' });
    renderControl();

    const button = await screen.findByRole('button', { name: '재고 동기화' });
    fireEvent.click(button);
    await waitFor(() => expect(apiMock.startInventorySync).toHaveBeenCalledTimes(1));
    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    await waitFor(() => expect(apiMock.startInventorySync).toHaveBeenCalledTimes(2));
    expect(apiMock.startInventorySync.mock.calls[0][0]).not.toBe(apiMock.startInventorySync.mock.calls[1][0]);
  });
});
