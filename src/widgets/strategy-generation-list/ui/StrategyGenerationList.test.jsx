import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Toaster, TooltipProvider } from '@/shared/ui';

const strategyApiMock = vi.hoisted(() => ({
  getAiStrategyCase: vi.fn(),
  getAiStrategyCases: vi.fn(),
}));

const inventoryApiMock = vi.hoisted(() => ({
  getInventoryFilterOptions: vi.fn(),
}));

vi.mock('@/entities/strategy/api/strategyApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getAiStrategyCase: strategyApiMock.getAiStrategyCase,
  getAiStrategyCases: strategyApiMock.getAiStrategyCases,
}));

vi.mock('@/entities/inventory/api/inventoryApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getInventoryFilterOptions: inventoryApiMock.getInventoryFilterOptions,
}));

import { StrategyGenerationList } from './StrategyGenerationList.jsx';

function renderList(path = '/ai-strategy') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[path]}>
          <StrategyGenerationList />
          <Toaster />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('StrategyGenerationList retry result selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    strategyApiMock.getAiStrategyCases.mockResolvedValue({
      content: [],
      statusCounts: { all: 20, generating: 1, generated: 18, generationFailed: 1 },
      page: 0,
      size: 10,
      totalElements: 20,
      totalPages: 2,
      first: true,
      last: false,
    });

    inventoryApiMock.getInventoryFilterOptions.mockResolvedValue({
      channels: [
        { code: 'GREETING', name: '그리팅' },
        { code: 'ECOMMERCE', name: '모두의맛집' },
        { code: 'HYUNDAI_DEPT', name: '현대백화점' },
        { code: 'HMART', name: '직영점' },
      ],
      warehouses: [
        { code: 'GYEONGIN_1', name: '경인 1센터' },
        { code: 'SEONGNAM_SMART', name: '성남 스마트푸드센터' },
        { code: 'ICHEON_DC', name: '이천 통합센터' },
        { code: 'BUSAN_DC', name: '부산센터' },
      ],
    });
  });

  function strategyDetail({ caseStatus = 'GENERATION_FAILED', failureCode = 'AI_STRATEGY_GENERATION_ERROR' } = {}) {
    return {
      strategyCaseId: 101,
      caseCode: '#101',
      caseName: '실패 화면 테스트 전략',
      caseStatus,
      generationStage: 'FORECASTING',
      recommendationOutcome: caseStatus === 'GENERATED' ? 'OPTIONS_GENERATED' : null,
      sku: {
        skuId: 7,
        skuCode: 'SKU-7',
        skuName: '테스트 상품',
        imageUrl: null,
      },
      requestedAt: '2026-08-27T14:30:00+09:00',
      completedAt: caseStatus === 'GENERATING' ? null : '2026-08-27T14:31:00+09:00',
      resultExpiresAt: null,
      failure:
        caseStatus === 'GENERATION_FAILED'
          ? {
              code: failureCode,
              summary: '사용자에게 공개 가능한 실패 메시지입니다.',
              failedAt: '2026-08-27T14:31:00+09:00',
            }
          : null,
      requestConditions: null,
      options: [],
    };
  }

  it('shows IT guidance, Case ID, optional failure code, copy action, and retry only for a failed case', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    strategyApiMock.getAiStrategyCase.mockResolvedValue(strategyDetail());

    renderList('/ai-strategy?drawer=101');

    await screen.findByText('IT 담당자에게 보고 완료되었습니다.');
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('IT 담당자에게 보고 완료되었습니다.');
    expect(dialog).toHaveTextContent('Case ID');
    expect(dialog).toHaveTextContent('101');
    expect(dialog).toHaveTextContent('AI_STRATEGY_GENERATION_ERROR');
    expect(dialog).toHaveTextContent('사용자에게 공개 가능한 실패 메시지입니다.');
    expect(screen.getByRole('button', { name: '전략 생성 재시도' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Case ID 복사' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('101'));
    expect(await screen.findByText('Case ID를 복사했습니다.')).toBeInTheDocument();
  });

  it('keeps the failed-case UI intact when failureCode is absent', async () => {
    strategyApiMock.getAiStrategyCase.mockResolvedValue(strategyDetail({ failureCode: null }));

    renderList('/ai-strategy?drawer=101');

    await screen.findByText('사용자에게 공개 가능한 실패 메시지입니다.');
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Case ID');
    expect(dialog).toHaveTextContent('사용자에게 공개 가능한 실패 메시지입니다.');
    expect(dialog).not.toHaveTextContent('실패 코드');
    expect(screen.getByRole('button', { name: '전략 생성 재시도' })).toBeInTheDocument();
  });

  it.each(['GENERATING', 'GENERATED'])('does not show IT failure guidance for %s', async (caseStatus) => {
    strategyApiMock.getAiStrategyCase.mockResolvedValue(strategyDetail({ caseStatus }));

    renderList('/ai-strategy?drawer=101');

    if (caseStatus === 'GENERATING') {
      await screen.findByText('현재 진행 상태만 제공하며 예상 완료 시간은 표시하지 않습니다.');
    } else {
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    }
    expect(screen.queryByText('IT 담당자에게 보고 완료되었습니다.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Case ID 복사' })).not.toBeInTheDocument();
  });

  it('loads a drawer Case by ID when it is outside the current list page', async () => {
    strategyApiMock.getAiStrategyCase.mockResolvedValue({
      strategyCaseId: 101,
      caseCode: '#101',
      caseName: '재사용된 재시도 전략',
      caseStatus: 'GENERATING',
      generationStage: 'FORECASTING',
      recommendationOutcome: null,
      sku: {
        skuId: 7,
        skuCode: 'SKU-7',
        skuName: '재사용 재시도 상품',
        imageUrl: null,
      },
      requestedAt: '2026-08-27T14:30:00+09:00',
      completedAt: null,
      resultExpiresAt: null,
      failure: null,
      requestConditions: null,
      options: [],
    });

    renderList('/ai-strategy?drawer=101');

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('재사용 재시도 상품'));
    expect(screen.getByRole('dialog')).toHaveTextContent('#101');
    expect(strategyApiMock.getAiStrategyCase).toHaveBeenCalledWith(101, expect.any(AbortSignal));
  });

  it('shows the proposed list filters and resets their UI values together', async () => {
    renderList();

    const channelSelect = await screen.findByLabelText('판매 채널');
    const centerSelect = screen.getByLabelText('센터');
    const startDateInput = screen.getByLabelText('시작일');
    const resetButton = screen.getByRole('button', { name: '입력값 초기화' });
    expect(screen.queryByLabelText('판매처')).not.toBeInTheDocument();
    expect(resetButton).toBeDisabled();

    fireEvent.change(channelSelect, { target: { value: 'GREETING' } });
    fireEvent.change(centerSelect, { target: { value: 'SEONGNAM_SMART' } });
    fireEvent.change(startDateInput, { target: { value: '2026-08-27' } });

    expect(resetButton).toBeEnabled();
    await waitFor(() =>
      expect(strategyApiMock.getAiStrategyCases).toHaveBeenLastCalledWith(
        expect.objectContaining({
          channelType: 'GREETING',
          warehouseCode: 'SEONGNAM_SMART',
          strategyFrom: '2026-08-27',
        }),
        expect.any(AbortSignal),
      ),
    );
    fireEvent.click(resetButton);

    expect(screen.getByLabelText('판매 채널')).toHaveValue('');
    expect(screen.getByLabelText('센터')).toHaveValue('');
    expect(screen.getByLabelText('시작일')).toHaveValue('');
    expect(resetButton).toBeDisabled();
  });
});
