import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/shared/ui';

const strategyApiMock = vi.hoisted(() => ({
  getAiStrategyCase: vi.fn(),
  getAiStrategyCases: vi.fn(),
}));

vi.mock('@/entities/strategy/api/strategyApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getAiStrategyCase: strategyApiMock.getAiStrategyCase,
  getAiStrategyCases: strategyApiMock.getAiStrategyCases,
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
});
