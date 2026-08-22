import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const apiMock = vi.hoisted(() => ({
  getInventorySync: vi.fn(),
  getInventorySyncLatest: vi.fn(),
  startInventorySync: vi.fn(),
}));
vi.mock('../api/inventorySyncApi.js', () => apiMock);

import { InventorySyncControl } from './InventorySyncControl.jsx';

function renderControl() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <InventorySyncControl />
    </QueryClientProvider>,
  );
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
      await screen.findByText('동기화 완료 · 원천 33,358건 · 동기화 대상 0건 · 반영 0건 · 오류 0건 · 2026.08.21 22:48'),
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

  it('keeps the start button disabled while an active run detail is unavailable', async () => {
    apiMock.getInventorySyncLatest.mockResolvedValue({ syncRunId: 42, status: 'RUNNING' });
    apiMock.getInventorySync.mockRejectedValue({ status: 503, message: '상태 조회 실패' });
    const { container } = renderControl();

    const button = await screen.findByRole('button', { name: '재고 동기화 중입니다' });
    await waitFor(() => expect(button).toBeDisabled());
    expect(container.querySelector('svg')).toHaveClass('animate-spin');
    expect(apiMock.startInventorySync).not.toHaveBeenCalled();
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
