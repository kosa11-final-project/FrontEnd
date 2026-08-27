import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';
import { Toaster } from '@/shared/ui';

const strategyApiMock = vi.hoisted(() => ({
  retryAiStrategyGeneration: vi.fn(),
}));

vi.mock('@/entities/strategy/api/strategyApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  retryAiStrategyGeneration: strategyApiMock.retryAiStrategyGeneration,
}));

import { StrategyGenerationRetry } from './StrategyGenerationRetry.jsx';

const successResult = {
  originalStrategyCaseId: 100,
  strategyCaseId: 101,
  retryParentStrategyCaseId: 100,
  caseName: '테스트 전략',
  caseStatus: 'GENERATING',
  generationStage: null,
  createdAt: '2026-08-27T14:30:00+09:00',
  reusedExistingRetry: false,
  dateAdjustment: {
    applied: false,
    originalPreferredStartDate: null,
    originalPreferredEndDate: null,
    adjustedPreferredStartDate: null,
    adjustedPreferredEndDate: null,
  },
};

function deferred() {
  let resolve;
  const promise = new Promise((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function renderRetry(props = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
  const setQueryData = vi.spyOn(queryClient, 'setQueryData');
  const result = render(
    <QueryClientProvider client={queryClient}>
      <StrategyGenerationRetry strategyCaseId={100} caseStatus="GENERATION_FAILED" {...props} />
      <Toaster />
    </QueryClientProvider>,
  );
  return { ...result, invalidateQueries, setQueryData };
}

describe('StrategyGenerationRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['GENERATING', 'GENERATED', 'READY_TO_EXECUTE', 'EXPIRED'])('hides the retry action for %s', (caseStatus) => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <StrategyGenerationRetry strategyCaseId={100} caseStatus={caseStatus} />
      </QueryClientProvider>,
    );

    expect(screen.queryByRole('button', { name: '전략 생성 재시도' })).not.toBeInTheDocument();
  });

  it('sends REJECT once, invalidates shared queries, and uses the returned case ID', async () => {
    const pending = deferred();
    strategyApiMock.retryAiStrategyGeneration.mockReturnValue(pending.promise);
    const onSucceeded = vi.fn();
    const { invalidateQueries, setQueryData } = renderRetry({ onSucceeded });
    const retryButton = screen.getByRole('button', { name: '전략 생성 재시도' });

    fireEvent.click(retryButton);
    fireEvent.click(retryButton);

    await waitFor(() => expect(strategyApiMock.retryAiStrategyGeneration).toHaveBeenCalledOnce());
    expect(strategyApiMock.retryAiStrategyGeneration).toHaveBeenCalledWith({
      strategyCaseId: 100,
      dateAdjustmentPolicy: 'REJECT',
    });
    expect(screen.getByRole('button', { name: '재시도 요청 중' })).toBeDisabled();

    pending.resolve(successResult);

    await waitFor(() => expect(onSucceeded).toHaveBeenCalledWith(expect.objectContaining({ strategyCaseId: 101 })));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['ai-strategies', 'list'] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['ai-strategies', 'detail', '100'],
      exact: true,
    });
    expect(setQueryData).not.toHaveBeenCalled();
    expect(await screen.findByText('AI 전략 생성을 다시 요청했습니다.')).toBeInTheDocument();
  });

  it('shows server-provided date adjustment values and does not request again when cancelled', async () => {
    strategyApiMock.retryAiStrategyGeneration.mockRejectedValue(
      new ApiError('기존 전략의 판매 시작일이 지났습니다.', {
        status: 409,
        code: 'AI_STRATEGY_RETRY_DATE_ADJUSTMENT_REQUIRED',
        details: {
          code: 'AI_STRATEGY_RETRY_DATE_ADJUSTMENT_REQUIRED',
          details: {
            originalPreferredStartDate: '2026-08-24',
            adjustedPreferredStartDate: '2026-08-27',
          },
        },
      }),
    );
    renderRetry();

    fireEvent.click(screen.getByRole('button', { name: '전략 생성 재시도' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('2026.08.24');
    expect(dialog).toHaveTextContent('2026.08.27');
    expect(screen.queryByText('AI 전략을 재시도할 수 없습니다.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(strategyApiMock.retryAiStrategyGeneration).toHaveBeenCalledOnce();
  });

  it('sends ADJUST_TO_TODAY after confirmation without sending client-calculated dates', async () => {
    const adjustmentError = new ApiError('날짜 보정 필요', {
      status: 409,
      code: 'AI_STRATEGY_RETRY_DATE_ADJUSTMENT_REQUIRED',
      details: {
        details: {
          originalPreferredStartDate: '2026-08-24',
          adjustedPreferredStartDate: '2026-08-27',
        },
      },
    });
    const secondRequest = deferred();
    strategyApiMock.retryAiStrategyGeneration
      .mockRejectedValueOnce(adjustmentError)
      .mockReturnValueOnce(secondRequest.promise);
    renderRetry();

    fireEvent.click(screen.getByRole('button', { name: '전략 생성 재시도' }));
    fireEvent.click(await screen.findByRole('button', { name: '확인' }));

    await waitFor(() => expect(strategyApiMock.retryAiStrategyGeneration).toHaveBeenCalledTimes(2));
    expect(strategyApiMock.retryAiStrategyGeneration).toHaveBeenLastCalledWith({
      strategyCaseId: 100,
      dateAdjustmentPolicy: 'ADJUST_TO_TODAY',
    });
    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
    secondRequest.resolve({
      ...successResult,
      dateAdjustment: { ...successResult.dateAdjustment, applied: true },
    });
    expect(await screen.findByText(/판매 시작일을 오늘 날짜로 변경하여/)).toBeInTheDocument();
  });

  it('does not retry an expired period and sends the user to new strategy creation', async () => {
    strategyApiMock.retryAiStrategyGeneration.mockRejectedValue(
      new ApiError('판매 기간 만료', { status: 409, code: 'AI_STRATEGY_RETRY_PERIOD_EXPIRED' }),
    );
    const onNavigateInventory = vi.fn();
    renderRetry({ onNavigateInventory });

    fireEvent.click(screen.getByRole('button', { name: '전략 생성 재시도' }));
    fireEvent.click(await screen.findByRole('button', { name: '조건 수정 후 새로 생성' }));

    expect(strategyApiMock.retryAiStrategyGeneration).toHaveBeenCalledOnce();
    expect(onNavigateInventory).toHaveBeenCalledOnce();
  });

  it('uses an existing retry case returned by a duplicate request', async () => {
    strategyApiMock.retryAiStrategyGeneration.mockResolvedValue({
      ...successResult,
      reusedExistingRetry: true,
      generationStage: 'FORECASTING',
    });
    const onSucceeded = vi.fn();
    renderRetry({ onSucceeded });

    fireEvent.click(screen.getByRole('button', { name: '전략 생성 재시도' }));

    await waitFor(() => expect(onSucceeded).toHaveBeenCalledWith(expect.objectContaining({ strategyCaseId: 101 })));
    expect(await screen.findByText(/이미 재시도된 AI 전략이 있습니다/)).toBeInTheDocument();
  });

  it.each([
    ['AI_STRATEGY_RETRY_NOT_ALLOWED', '현재 상태에서는 AI 전략 생성을 재시도할 수 없습니다.'],
    ['AI_STRATEGY_RETRY_FORBIDDEN', '이 AI 전략을 재시도할 권한이 없습니다.'],
    ['AI_STRATEGY_CASE_NOT_FOUND', 'AI 전략 정보를 찾을 수 없습니다.'],
    ['AI_STRATEGY_RETRY_PAYLOAD_INVALID', '기존 요청 정보를 복원할 수 없어 재시도할 수 없습니다.'],
  ])('shows a safe message and releases loading for %s', async (code, expectedMessage) => {
    strategyApiMock.retryAiStrategyGeneration.mockRejectedValue(new ApiError('서버 원문', { status: 409, code }));
    renderRetry();

    fireEvent.click(screen.getByRole('button', { name: '전략 생성 재시도' }));

    expect(await screen.findByText((text) => text.includes(expectedMessage))).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: '전략 생성 재시도' })).toBeEnabled());
  });

  it.each(['AI_STRATEGY_RETRY_CONDITIONS_STALE', 'AI_STRATEGY_RETRY_REFERENCE_CHANGED'])(
    'opens the latest inventory action without an automatic retry for %s',
    async (code) => {
      strategyApiMock.retryAiStrategyGeneration.mockRejectedValue(new ApiError('조건 변경', { status: 409, code }));
      const onNavigateInventory = vi.fn();
      renderRetry({ onNavigateInventory });

      fireEvent.click(screen.getByRole('button', { name: '전략 생성 재시도' }));
      fireEvent.click(await screen.findByRole('button', { name: '최신 재고 확인' }));

      expect(strategyApiMock.retryAiStrategyGeneration).toHaveBeenCalledOnce();
      expect(onNavigateInventory).toHaveBeenCalledOnce();
    },
  );

  it('does not expose an internal server exception for an unknown 5xx error', async () => {
    strategyApiMock.retryAiStrategyGeneration.mockRejectedValue(
      new ApiError('SQLException: secret table name', { status: 500, code: 'COMMON-500' }),
    );
    renderRetry();

    fireEvent.click(screen.getByRole('button', { name: '전략 생성 재시도' }));

    expect(
      await screen.findByText('AI 전략 생성 재시도를 요청하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/SQLException/)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: '전략 생성 재시도' })).toBeEnabled());
  });
});
