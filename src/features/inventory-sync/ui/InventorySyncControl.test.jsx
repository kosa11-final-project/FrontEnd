import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const apiMock = vi.hoisted(() => ({
  getInventorySync: vi.fn(),
  getInventorySyncLatest: vi.fn(),
  retryAfterSeconds: vi.fn((error) => Number(error?.headers?.['retry-after']) || 10),
  startInventorySync: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('../api/inventorySyncApi.js', () => apiMock);
vi.mock('@/shared/ui/use-toast.js', () => ({ toast: toastMock.toast }));

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

  it('shows the date and time of the latest successful sync', async () => {
    const succeededRun = {
      syncRunId: 42,
      status: 'SUCCEEDED',
      completedAt: '2026-08-21T22:48:05+09:00',
      sourceStates: [],
    };
    apiMock.getInventorySyncLatest.mockResolvedValue(succeededRun);
    apiMock.getInventorySync.mockResolvedValue(succeededRun);

    renderControl();

    await waitFor(() => {
      expect(screen.getByTestId('inventory-last-sync')).toHaveTextContent('최근 동기화 2026.08.21 22:48');
    });
    expect(screen.getByTestId('inventory-last-sync').parentElement).toContainElement(
      screen.getByRole('button', { name: '재고 동기화' }),
    );
  });

  it('keeps only the inventory sync button and reports a completed run with a toast', async () => {
    apiMock.startInventorySync.mockResolvedValue({ syncRunId: 42, status: 'QUEUED' });
    apiMock.getInventorySync.mockResolvedValue({ syncRunId: 42, status: 'SUCCEEDED' });

    renderControl();
    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    await waitFor(() => {
      expect(toastMock.toast).toHaveBeenCalledWith(expect.objectContaining({ title: '재고 동기화가 완료되었습니다.' }));
    });
    expect(screen.getByRole('button', { name: '재고 동기화' })).toBeInTheDocument();
    expect(screen.queryByText('동기화 상세 정보')).not.toBeInTheDocument();
    expect(screen.queryByText(/동기화 완료/)).not.toBeInTheDocument();
  });

  it('reports a failed run with an error toast', async () => {
    apiMock.startInventorySync.mockResolvedValue({ syncRunId: 42, status: 'QUEUED' });
    apiMock.getInventorySync.mockResolvedValue({ syncRunId: 42, status: 'FAILED' });

    renderControl();
    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    await waitFor(() => {
      expect(toastMock.toast).toHaveBeenCalledWith(expect.objectContaining({ title: '재고 동기화가 실패했습니다.' }));
    });
    expect(screen.queryByText('동기화 상세 정보')).not.toBeInTheDocument();
  });

  it('reports a confirmed registration failure with an error toast', async () => {
    apiMock.startInventorySync.mockRejectedValue({ status: 500, message: '동기화 실행을 시작할 수 없습니다.' });

    renderControl();
    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    await waitFor(() => {
      expect(toastMock.toast).toHaveBeenCalledWith(expect.objectContaining({ title: '재고 동기화가 실패했습니다.' }));
    });
    expect(screen.getAllByRole('button')).toHaveLength(1);
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

  it('keeps only the button when a fast run has already completed', async () => {
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

    await waitFor(() =>
      expect(toastMock.toast).toHaveBeenCalledWith(expect.objectContaining({ title: '재고 동기화가 완료되었습니다.' })),
    );
    expect(screen.getByRole('button', { name: '재고 동기화' })).toBeEnabled();
    expect(screen.getAllByRole('button')).toHaveLength(1);
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
    vi.useFakeTimers();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['inventory-sync', 'latest'], null);
    apiMock.startInventorySync.mockRejectedValue({ status: 429, headers: { 'retry-after': '1' } });

    try {
      const { unmount } = renderControl(queryClient);
      fireEvent.click(screen.getByRole('button', { name: '재고 동기화' }));
      await act(async () => {});

      expect(screen.getByRole('button', { name: '잠시 후 다시 실행' })).toBeDisabled();
      expect(screen.getAllByRole('button')).toHaveLength(1);

      await act(() => vi.advanceTimersByTimeAsync(999));
      expect(screen.getByRole('button', { name: '잠시 후 다시 실행' })).toBeDisabled();
      await act(() => vi.advanceTimersByTimeAsync(1));
      expect(screen.getByRole('button', { name: '재고 동기화' })).toBeEnabled();

      apiMock.startInventorySync.mockRejectedValue({ status: 429, headers: { 'retry-after': '60' } });
      fireEvent.click(screen.getByRole('button', { name: '재고 동기화' }));
      await act(async () => {});
      expect(screen.getByRole('button', { name: '잠시 후 다시 실행' })).toBeDisabled();

      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the only button disabled when an active run detail is unavailable', async () => {
    apiMock.getInventorySyncLatest.mockResolvedValue({ syncRunId: 42, status: 'RUNNING' });
    apiMock.getInventorySync.mockRejectedValue({ status: 503, message: '상태 조회 실패' });
    const { container } = renderControl();

    const button = await screen.findByRole('button', { name: '상태 확인 필요' });
    expect(button).toBeDisabled();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(container.querySelector('svg')).not.toHaveClass('animate-spin');
    expect(apiMock.startInventorySync).not.toHaveBeenCalled();
  });

  it('keeps only the button after a background latest failure', async () => {
    const succeededRun = { syncRunId: 42, status: 'SUCCEEDED', completedAt: '2026-08-21T22:48:05+09:00' };
    apiMock.getInventorySyncLatest.mockResolvedValueOnce(succeededRun).mockRejectedValueOnce({ status: 503 });
    apiMock.getInventorySync.mockResolvedValue(succeededRun);
    const { queryClient } = renderControl();

    expect(await screen.findByRole('button', { name: '재고 동기화' })).toBeEnabled();
    await queryClient.refetchQueries({ queryKey: ['inventory-sync', 'latest'] });
    expect(await screen.findByRole('button', { name: '상태 확인 필요' })).toBeDisabled();
    expect(screen.getAllByRole('button')).toHaveLength(1);
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
    expect(screen.getAllByRole('button')).toHaveLength(1);

    act(() => {
      queryClient.setQueryData(['inventory-sync', 'latest'], globalRunningRun);
      queryClient.setQueryData(['inventory-sync', 'run', 43], globalRunningRun);
    });
    expect(await screen.findByRole('button', { name: '재고 동기화 중입니다' })).toBeDisabled();
    expect(screen.getAllByRole('button')).toHaveLength(1);

    act(() => {
      queryClient.setQueryData(['inventory-sync', 'latest'], globalSucceededRun);
      queryClient.setQueryData(['inventory-sync', 'run', 43], globalSucceededRun);
    });

    expect(await screen.findByRole('button', { name: '재고 동기화' })).toBeEnabled();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('keeps an interrupted run locked while showing recovery waiting guidance', async () => {
    const interruptedRun = { syncRunId: 42, status: 'INTERRUPTED', phase: 'CANONICAL', mainAttemptNo: 1 };
    apiMock.getInventorySyncLatest.mockResolvedValue(interruptedRun);
    apiMock.getInventorySync.mockResolvedValue(interruptedRun);

    renderControl();

    expect(await screen.findByRole('button', { name: '복구 대기 중' })).toBeDisabled();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('reports a failed run without rendering its detailed response', async () => {
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
    apiMock.startInventorySync.mockResolvedValue({ syncRunId: 42, status: 'QUEUED' });

    renderControl();
    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByText('동기화 상세 정보')).not.toBeInTheDocument();
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
      snapshotRefresh: { required: true, dashboardReady: true, inventoryStatisticsReady: true },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    renderControl(queryClient);

    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(7));
    expect(invalidateSpy.mock.calls.map(([options]) => options.queryKey)).toEqual([
      ['dashboard', 'snapshot'],
      ['statistics'],
      ['inventory', 'list'],
      ['inventory', 'summary'],
      ['inventory', 'detail'],
      ['inventory', 'lots'],
      ['inventory-risk'],
    ]);
    randomSpy.mockRestore();
  });

  it('refreshes inventory reads after a successful sync even when changedCount is zero', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    apiMock.startInventorySync.mockResolvedValue({ syncRunId: 42, status: 'QUEUED' });
    apiMock.getInventorySync.mockResolvedValue({
      syncRunId: 42,
      status: 'SUCCEEDED',
      readCount: 1,
      changedCount: 0,
      errorCount: 0,
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    renderControl(queryClient);

    fireEvent.click(await screen.findByRole('button', { name: '재고 동기화' }));

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(5));
    expect(invalidateSpy.mock.calls.map(([options]) => options.queryKey)).toEqual([
      ['inventory', 'list'],
      ['inventory', 'summary'],
      ['inventory', 'detail'],
      ['inventory', 'lots'],
      ['inventory-risk'],
    ]);
    randomSpy.mockRestore();
  });

  it('does not refresh the same successful sync again after remounting with the same query client', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const succeededRun = {
      syncRunId: 42,
      status: 'SUCCEEDED',
      readCount: 1,
      changedCount: 0,
      errorCount: 0,
    };
    apiMock.getInventorySyncLatest.mockResolvedValue(succeededRun);
    apiMock.getInventorySync.mockResolvedValue(succeededRun);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const firstRender = renderControl(queryClient);
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(5));
    firstRender.unmount();

    renderControl(queryClient);
    await waitFor(() => expect(screen.getByRole('button', { name: '재고 동기화' })).toBeEnabled());
    expect(invalidateSpy).toHaveBeenCalledTimes(5);

    randomSpy.mockRestore();
  });

  it('waits for persisted snapshots before refreshing dashboard and inventory statistics', async () => {
    vi.useFakeTimers();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const pendingRun = {
      syncRunId: 42,
      status: 'SUCCEEDED',
      changedCount: 1,
      snapshotRefresh: { required: true, dashboardReady: false, inventoryStatisticsReady: false },
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['inventory-sync', 'latest'], pendingRun);
    queryClient.setQueryData(['inventory-sync', 'run', 42], pendingRun);
    apiMock.getInventorySyncLatest.mockResolvedValue(pendingRun);
    apiMock.getInventorySync.mockResolvedValue(pendingRun);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    try {
      renderControl(queryClient);
      await act(async () => {});
      await act(() => vi.advanceTimersByTimeAsync(0));

      expect(screen.getByRole('button', { name: '집계 최신화 중' })).toBeDisabled();
      expect(invalidateSpy).toHaveBeenCalledTimes(5);
      expect(invalidateSpy.mock.calls.map(([options]) => options.queryKey)).not.toContainEqual([
        'dashboard',
        'snapshot',
      ]);

      act(() => {
        queryClient.setQueryData(['inventory-sync', 'run', 42], {
          ...pendingRun,
          snapshotRefresh: { required: true, dashboardReady: true, inventoryStatisticsReady: false },
        });
      });
      await act(() => vi.advanceTimersByTimeAsync(0));

      expect(invalidateSpy).toHaveBeenCalledTimes(6);
      expect(invalidateSpy.mock.calls.map(([options]) => options.queryKey)).toContainEqual(['dashboard', 'snapshot']);
      expect(invalidateSpy.mock.calls.map(([options]) => options.queryKey)).not.toContainEqual(['statistics']);
      expect(screen.getByRole('button', { name: '집계 최신화 중' })).toBeDisabled();

      act(() => {
        queryClient.setQueryData(['inventory-sync', 'run', 42], {
          ...pendingRun,
          snapshotRefresh: { required: true, dashboardReady: true, inventoryStatisticsReady: true },
        });
      });
      await act(() => vi.advanceTimersByTimeAsync(0));

      expect(invalidateSpy).toHaveBeenCalledTimes(7);
      expect(invalidateSpy.mock.calls.map(([options]) => options.queryKey)).toContainEqual(['statistics']);
      expect(screen.getByRole('button', { name: '재고 동기화' })).toBeEnabled();
    } finally {
      randomSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('stops waiting and unlocks a new sync when snapshot readiness is delayed for five minutes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-24T00:05:00.000Z'));
    const delayedRun = {
      syncRunId: 42,
      status: 'SUCCEEDED',
      changedCount: 1,
      completedAt: '2026-08-24T00:00:00.000Z',
      snapshotRefresh: { required: true, dashboardReady: true, inventoryStatisticsReady: false },
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['inventory-sync', 'latest'], delayedRun);
    queryClient.setQueryData(['inventory-sync', 'run', 42], delayedRun);
    apiMock.getInventorySyncLatest.mockResolvedValue(delayedRun);
    apiMock.getInventorySync.mockResolvedValue(delayedRun);

    try {
      renderControl(queryClient);
      await act(async () => {});

      expect(screen.getByRole('button', { name: '집계 확인 지연' })).toBeEnabled();
      expect(screen.getAllByRole('button')).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops polling and unlocks a fresh sync when a durable snapshot task fails', async () => {
    const failedSnapshotRun = {
      syncRunId: 42,
      status: 'SUCCEEDED',
      changedCount: 1,
      completedAt: '2026-08-24T00:00:00.000Z',
      snapshotRefresh: {
        required: true,
        dashboardReady: true,
        inventoryStatisticsReady: false,
        dashboardStatus: 'SUCCEEDED',
        inventoryStatisticsStatus: 'FAILED',
      },
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['inventory-sync', 'latest'], failedSnapshotRun);
    queryClient.setQueryData(['inventory-sync', 'run', 42], failedSnapshotRun);
    apiMock.getInventorySyncLatest.mockResolvedValue(failedSnapshotRun);
    apiMock.getInventorySync.mockResolvedValue(failedSnapshotRun);

    renderControl(queryClient);

    const button = await screen.findByRole('button', { name: '집계 최신화 실패' });
    expect(button).toBeEnabled();
    expect(screen.getAllByRole('button')).toHaveLength(1);

    apiMock.startInventorySync.mockResolvedValue({ syncRunId: 43, status: 'QUEUED' });
    fireEvent.click(button);
    await waitFor(() => expect(apiMock.startInventorySync).toHaveBeenCalledOnce());
    expect(apiMock.startInventorySync.mock.calls[0][0]).not.toBe('');
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
      expect(invalidateSpy).toHaveBeenCalledTimes(2);

      await act(() => vi.advanceTimersByTimeAsync(INVENTORY_REFRESH_JITTER_MS - 1));
      expect(invalidateSpy).toHaveBeenCalledTimes(2);

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
    const run42 = { syncRunId: 42, status: 'SUCCEEDED', changedCount: 1 };
    const run43 = { syncRunId: 43, status: 'SUCCEEDED', changedCount: 1 };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['inventory-sync', 'latest'], run42);
    queryClient.setQueryData(['inventory-sync', 'run', 42], run42);
    apiMock.getInventorySyncLatest.mockResolvedValue(run42);
    apiMock.getInventorySync.mockImplementation((syncRunId) => Promise.resolve(syncRunId === 43 ? run43 : run42));
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    try {
      renderControl(queryClient);
      await act(async () => {});
      expect(invalidateSpy).toHaveBeenCalledTimes(2);

      act(() => {
        queryClient.setQueryData(['inventory-sync', 'latest'], { ...run43, status: 'RUNNING' });
        queryClient.setQueryData(['inventory-sync', 'run', 43], run43);
      });
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(invalidateSpy).toHaveBeenCalledTimes(4);

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
    expect(screen.getAllByRole('button')).toHaveLength(1);
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
