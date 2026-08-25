import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mapInventoryItem, mapInventoryListResponse, mapInventorySummaryResponse } from '@/entities/inventory';
import { mockInventorySummaryResponse, mockRawInventoryItems } from '@/entities/inventory/testing/fixtures.js';
import { TooltipProvider } from '@/shared/ui';

const inventoryApiMock = vi.hoisted(() => ({
  getInventories: vi.fn(),
  getInventorySummary: vi.fn(),
  getInventoryFilterOptions: vi.fn(),
  getInventoryDetail: vi.fn(),
  getInventoryLots: vi.fn(),
}));

const forecastApiMock = vi.hoisted(() => ({
  getDemandForecast: vi.fn(),
  getSkuAggregateForecast: vi.fn(),
}));

const riskApiMock = vi.hoisted(() => ({
  getInventoryRisk: vi.fn(),
}));

const inventorySyncApiMock = vi.hoisted(() => ({
  getInventorySync: vi.fn(),
  getInventorySyncLatest: vi.fn(),
  startInventorySync: vi.fn(),
}));

const strategyApiMock = vi.hoisted(() => ({
  createAiStrategyCase: vi.fn(),
}));

vi.mock('@/entities/inventory/api/inventoryApi.js', () => inventoryApiMock);
vi.mock('@/entities/forecast/api/forecastApi.js', () => forecastApiMock);
vi.mock('@/entities/risk/api/riskApi.js', () => riskApiMock);
vi.mock('@/features/inventory-sync/api/inventorySyncApi.js', () => inventorySyncApiMock);
vi.mock('@/entities/strategy/api/strategyApi.js', () => strategyApiMock);

import InventoryPage from './InventoryPage.jsx';

function renderWithProviders(ui, { initialEntries = ['/inventory'] } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('InventoryPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inventorySyncApiMock.getInventorySyncLatest.mockResolvedValue(null);
    inventorySyncApiMock.getInventorySync.mockResolvedValue(null);
    strategyApiMock.createAiStrategyCase.mockResolvedValue({
      strategyCaseId: 123,
      caseName: '비비고 왕교자 AI 전략',
      caseStatus: 'GENERATING',
      generationStage: null,
      createdAt: '2026-08-24T10:00:00',
    });
    inventoryApiMock.getInventories.mockImplementation(async (params = {}) => {
      let items = [...mockRawInventoryItems];
      const query = String(params.q || '').toLowerCase();

      if (query) {
        items = items.filter((item) =>
          [item.product_name, item.sku_name, item.sales_point_name, item.sku_code].some((value) =>
            value?.toLowerCase().includes(query),
          ),
        );
      }

      return mapInventoryListResponse({
        items,
        totalCount: items.length,
        page: params.page || 1,
        size: params.size || 20,
        isFilterEmpty: items.length === 0 && Boolean(query),
      });
    });
    inventoryApiMock.getInventorySummary.mockResolvedValue(mapInventorySummaryResponse(mockInventorySummaryResponse));
    inventoryApiMock.getInventoryFilterOptions.mockResolvedValue({
      channels: [],
      salesPoints: [],
      warehouses: [],
      regions: [],
      categories: [],
      storageTypes: [],
      riskGrades: [],
      assessmentStatuses: [],
    });
    inventoryApiMock.getInventoryDetail.mockImplementation(async (skuCode, salesPointCode) => {
      const item = mockRawInventoryItems.find(
        (candidate) =>
          candidate.sku_code === skuCode &&
          (candidate.sales_point_code === salesPointCode ||
            candidate.sales_points?.some((sp) => sp.sales_point_code === salesPointCode)),
      );
      if (!item) {
        throw new Error(`Inventory detail not found for sku=${skuCode}, salesPoint=${salesPointCode}`);
      }
      return mapInventoryItem(item);
    });
    inventoryApiMock.getInventoryLots.mockImplementation(async (skuCode, salesPointCode) => {
      const item = mockRawInventoryItems.find(
        (candidate) =>
          candidate.sku_code === skuCode &&
          (candidate.sales_point_code === salesPointCode ||
            candidate.sales_points?.some((sp) => sp.sales_point_code === salesPointCode)),
      );
      if (!item) {
        throw new Error(`Inventory lots not found for sku=${skuCode}, salesPoint=${salesPointCode}`);
      }
      const mapped = mapInventoryItem(item);
      return { items: mapped.lots, totalCount: mapped.lots.length };
    });
    forecastApiMock.getDemandForecast.mockResolvedValue({
      status: 'AVAILABLE',
      skuCode: 'SKU_MANDU_001_105',
      salesPointCode: 'STORE_THE_HYUNDAI_SEOUL',
      baseDate: '2026-08-16',
      modelVersion: 'v1.0.0',
      confidenceLevel: 'LOW',
      cumulativeForecast: {
        predictedQtyD7: 70,
        predictedQtyD14: 140,
        predictedQtyD30: 300,
        predictedQtyD60: 600,
        predictedQtyD90: 900,
      },
      projectedInventories: {
        projectedD7: 130,
        projectedD14: 60,
        projectedD30: 0,
        projectedD60: 0,
        projectedD90: 0,
        stockoutPeriod: 'D+15~D+30',
      },
      availableQty: 200,
      safetyStockQty: 50,
      freshness: { forecastAsOf: '2026-08-16' },
    });
    riskApiMock.getInventoryRisk.mockResolvedValue({
      assessmentStatus: 'ASSESSED',
      riskGrade: 'CAUTION',
      reasonMessage: 'D+30 예측수요가 현재 가용재고보다 많습니다.',
      ruleVersion: 'STOCK_EXPIRY_V1_SALES_FORECAST',
      baseDate: '2026-08-16',
      shortageQty30: 10,
      stockCoverageDays: 20,
      shortageYn: 'Y',
      safetyGapQty: 5,
      reasons: [],
    });
  });

  it('renders page header, summary KPI cards, filter bar and inventory table', async () => {
    renderWithProviders(<InventoryPage />);

    expect(screen.getByText('통합 재고 관제')).toBeInTheDocument();
    expect(await screen.findByText('현재 DB 기준')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '재고 동기화' })).toBeEnabled();
    expect(screen.getByText('원천 4종을 정제해 통합재고에 반영합니다.')).toBeInTheDocument();

    // 상단 KPI 카드 비동기 렌더링 확인
    expect(await screen.findByText(/총 현재고/)).toBeInTheDocument();
    expect(await screen.findByText(/총 가용수량/)).toBeInTheDocument();
    expect(await screen.findByText(/안전재고 미달/)).toBeInTheDocument();

    // 필터바 컨트롤 확인
    expect(screen.getByPlaceholderText(/상품명, SKU 코드, 판매처명/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /검색/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /초기화/i })).toBeInTheDocument();

    // 목록의 주 식별자는 상품명이 아니라 SKU 규격입니다.
    expect((await screen.findAllByText(/1\.05kg 단품팩/)).length).toBeGreaterThanOrEqual(1);
  });

  it('does not claim current DB data when the inventory request failed', async () => {
    inventoryApiMock.getInventories.mockRejectedValueOnce(new Error('database unavailable'));

    renderWithProviders(<InventoryPage />);

    expect(await screen.findByText('DB 연결 확인 필요')).toBeInTheDocument();
    expect(screen.queryByText('현재 DB 기준')).not.toBeInTheDocument();
  });

  it('does not request LOT data while the forecast tab is active', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: [
        '/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=STORE_THE_HYUNDAI_SEOUL&detailTab=FORECAST',
      ],
    });

    await vi.waitFor(() => expect(forecastApiMock.getDemandForecast).toHaveBeenCalled());
    expect(inventoryApiMock.getInventoryLots).not.toHaveBeenCalled();
  });

  it('renders filtered items according to query parameters', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?q=비비고'],
    });

    expect((await screen.findAllByText(/1\.05kg 단품팩/)).length).toBeGreaterThanOrEqual(1);
  });

  it('forwards the OR operator and overall risk filter to both list and summary requests', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?filterOperator=OR&storageType=FROZEN&riskGrade=DANGER'],
    });

    await vi.waitFor(() => {
      expect(inventoryApiMock.getInventories).toHaveBeenCalledWith(
        expect.objectContaining({
          filterOperator: 'OR',
          storageType: ['FROZEN'],
          riskGrade: ['DANGER'],
        }),
        expect.anything(),
      );
      expect(inventoryApiMock.getInventorySummary).toHaveBeenCalledWith(
        expect.objectContaining({
          filterOperator: 'OR',
          storageType: ['FROZEN'],
          riskGrade: ['DANGER'],
        }),
        expect.anything(),
      );
    });
  });

  it('opens the AI strategy request popup for selected products', async () => {
    renderWithProviders(<InventoryPage />);

    const productCheckboxes = await screen.findAllByRole('checkbox', { name: /1\.05kg 단품팩 선택/ });
    fireEvent.click(productCheckboxes[0]);

    const generateButton = screen.getByRole('button', { name: 'AI 전략 생성' });
    expect(generateButton).toBeEnabled();
    fireEvent.click(generateButton);

    expect(screen.getByRole('dialog', { name: 'AI 전략 생성' })).toBeInTheDocument();
    expect(screen.queryByText(/선택한 1개 SKU는 각각 별도의 전략 Case로 생성됩니다/)).not.toBeInTheDocument();
    expect(screen.queryByText(/상품 탭마다 출발 판매처를 선택해 주세요/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^전략명/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^현재·출발 판매처/)).toBeInTheDocument();
    expect(screen.getByText('희망 전략 타입')).toBeInTheDocument();
    const startDateInput = screen.getByLabelText(/^시작일/);
    const endDateInput = screen.getByLabelText(/^종료일/);
    expect(startDateInput).toBeInTheDocument();
    expect(endDateInput).toBeInTheDocument();
    expect(startDateInput).toHaveAttribute('max');
    expect(endDateInput).toHaveAttribute('max', startDateInput.getAttribute('max'));
    expect(screen.getByText('출발 판매처를 먼저 선택해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('요청 조건 입력 0/1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /AI 전략 생성 요청/ }));
    expect(screen.getByText('현재·출발 판매처를 선택해 주세요.')).toBeInTheDocument();
    expect(
      screen.getByText(
        '출발 판매처 외 조건을 하나 이상 입력하거나 나머지 조건 전체를 AI에게 추천받기를 선택해 주세요.',
      ),
    ).toBeInTheDocument();

    const sourceSalesPointSelect = screen.getByLabelText(/^현재·출발 판매처/);
    fireEvent.change(sourceSalesPointSelect, {
      target: { value: 'STORE_THE_HYUNDAI_SEOUL' },
    });
    const lotCheckbox = await screen.findByRole('checkbox', { name: /LOT-GF-20260729-01 LOT 선택/ });
    expect(inventoryApiMock.getInventoryLots).toHaveBeenCalledWith(
      'SKU_MANDU_001_105',
      'STORE_THE_HYUNDAI_SEOUL',
      expect.anything(),
    );
    expect(screen.getByText('요청 조건 입력 0/1')).toBeInTheDocument();

    const candidateCheckbox = screen.getAllByRole('checkbox', { name: /후보 판매처 선택/ })[0];
    const strategyTypeCheckbox = screen.getByRole('checkbox', { name: '재고 재할당' });
    fireEvent.click(lotCheckbox);
    fireEvent.click(candidateCheckbox);
    fireEvent.click(strategyTypeCheckbox);
    fireEvent.change(startDateInput, { target: { value: startDateInput.getAttribute('min') } });
    fireEvent.change(endDateInput, { target: { value: endDateInput.getAttribute('max') } });
    expect(screen.getByText('요청 조건 입력 1/1')).toBeInTheDocument();

    const recommendAllCheckbox = screen.getByRole('checkbox', {
      name: /출발 판매처 외 조건 전체를 AI에게 추천받기/,
    });
    const requestSummary = recommendAllCheckbox.closest('aside');
    expect(requestSummary).toHaveAccessibleName('생성 요청 요약');
    expect(requestSummary).toHaveClass('xl:top-4');
    fireEvent.click(recommendAllCheckbox);
    expect(sourceSalesPointSelect).toHaveValue('STORE_THE_HYUNDAI_SEOUL');
    expect(sourceSalesPointSelect).toBeEnabled();
    expect(lotCheckbox).not.toBeChecked();
    expect(lotCheckbox).toBeDisabled();
    expect(candidateCheckbox).not.toBeChecked();
    expect(candidateCheckbox).toBeDisabled();
    expect(strategyTypeCheckbox).not.toBeChecked();
    expect(strategyTypeCheckbox).toBeDisabled();
    expect(startDateInput).toHaveValue('');
    expect(startDateInput).toBeDisabled();
    expect(endDateInput).toHaveValue('');
    expect(endDateInput).toBeDisabled();
    expect(screen.getByText('요청 조건 입력 1/1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /AI 전략 생성 요청/ }));
    await waitFor(() =>
      expect(strategyApiMock.createAiStrategyCase).toHaveBeenCalledWith({
        caseName: null,
        skuId: 1001,
        sourceSalesPointId: 101,
        lotIds: null,
        candidateSalesPointIds: null,
        strategyTypes: null,
        preferredStartDate: null,
        preferredEndDate: null,
      }),
    );
    expect(screen.queryByRole('dialog', { name: 'AI 전략 생성' })).not.toBeInTheDocument();
  });

  it('shows the server error and keeps the request popup open when strategy creation fails', async () => {
    strategyApiMock.createAiStrategyCase.mockRejectedValue(new Error('전략 생성 서버 오류'));
    renderWithProviders(<InventoryPage />);

    const productCheckboxes = await screen.findAllByRole('checkbox', { name: /1\.05kg 단품팩 선택/ });
    fireEvent.click(productCheckboxes[0]);
    fireEvent.click(screen.getByRole('button', { name: 'AI 전략 생성' }));
    fireEvent.change(screen.getByLabelText(/^현재·출발 판매처/), {
      target: { value: 'STORE_THE_HYUNDAI_SEOUL' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /출발 판매처 외 조건 전체를 AI에게 추천받기/ }));
    fireEvent.click(screen.getByRole('button', { name: /AI 전략 생성 요청/ }));

    expect(await screen.findByText('AI 전략 생성 요청을 전송하지 못했습니다.')).toBeInTheDocument();
    expect(screen.getByText('전략 생성 서버 오류')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'AI 전략 생성' })).toBeInTheDocument();
  });

  it('keeps successful Cases and retries only failed SKU requests', async () => {
    const attemptsBySku = new Map();
    strategyApiMock.createAiStrategyCase.mockImplementation(async (payload) => {
      const attempt = (attemptsBySku.get(payload.skuId) ?? 0) + 1;
      attemptsBySku.set(payload.skuId, attempt);
      if (payload.skuId === 1002 && attempt === 1) throw new Error('한우 전략 생성 실패');
      return { strategyCaseId: payload.skuId * 10 + attempt, caseStatus: 'GENERATING' };
    });
    renderWithProviders(<InventoryPage />);

    fireEvent.click((await screen.findAllByRole('checkbox', { name: /1\.05kg 단품팩 선택/ }))[0]);
    fireEvent.click((await screen.findAllByRole('checkbox', { name: /500g 냉장팩 선택/ }))[0]);
    fireEvent.click(screen.getByRole('button', { name: 'AI 전략 생성' }));

    fireEvent.change(screen.getByLabelText(/^현재·출발 판매처/), {
      target: { value: 'STORE_THE_HYUNDAI_SEOUL' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /출발 판매처 외 조건 전체를 AI에게 추천받기/ }));
    fireEvent.click(screen.getByRole('button', { name: /현대명품 한우/ }));
    fireEvent.change(screen.getByLabelText(/^현재·출발 판매처/), {
      target: { value: 'STORE_THE_HYUNDAI_SEOUL' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /출발 판매처 외 조건 전체를 AI에게 추천받기/ }));
    fireEvent.click(screen.getByRole('button', { name: /AI 전략 생성 요청/ }));

    expect(await screen.findByText('일부 AI 전략 생성 요청을 완료하지 못했습니다.')).toBeInTheDocument();
    expect(screen.getByText(/생성 완료 1건 · 재시도 대상 1건/)).toBeInTheDocument();
    expect(strategyApiMock.createAiStrategyCase.mock.calls.map(([payload]) => payload.skuId)).toEqual([1001, 1002]);

    fireEvent.click(screen.getByRole('button', { name: /AI 전략 생성 요청/ }));
    await waitFor(() =>
      expect(strategyApiMock.createAiStrategyCase.mock.calls.map(([payload]) => payload.skuId)).toEqual([
        1001, 1002, 1002,
      ]),
    );
    expect(screen.queryByRole('dialog', { name: 'AI 전략 생성' })).not.toBeInTheDocument();
  });

  it('renders filter empty state when no items match search query', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?q=존재하지않는상품검색어xyz'],
    });

    expect(await screen.findByText('일치하는 재고가 없습니다')).toBeInTheDocument();
  });

  it('opens detail drawer when clicking a table row and renders 2-tab navigation', async () => {
    renderWithProviders(<InventoryPage />);

    const rowButtons = await screen.findAllByRole('button', { name: /재고 상세 보기/ });
    fireEvent.click(rowButtons[0]);

    // 드로어 렌더링 확인
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect((await screen.findAllByText('재고 개요')).length).toBeGreaterThanOrEqual(1);
    expect((await screen.findAllByText('수요예측')).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole('tab', { name: /LOT 상세/ })).not.toBeInTheDocument();

    const salesPointSelect = screen.getByLabelText('상세 판매처 선택');
    fireEvent.change(salesPointSelect, { target: { value: 'GREETING_ONLINE' } });

    // 재고 개요 탭 내 우측 LOT 섹션에 FEFO 목록 표시 확인
    expect((await screen.findAllByText(/FEFO 1순위/)).length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('재고 부족 여부')).toBeInTheDocument();
    expect(await screen.findByText('부족')).toBeInTheDocument();
    expect(screen.queryByText('재고 위험 판정')).not.toBeInTheDocument();
    expect(screen.queryByText('판정 실패')).not.toBeInTheDocument();
  });

  it('opens detail drawer directly from URL query state', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: [
        '/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=STORE_THE_HYUNDAI_SEOUL&detailTab=OVERVIEW',
      ],
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect((await screen.findAllByText(/FEFO 1순위/)).length).toBeGreaterThanOrEqual(1);
  });

  it('loads LOTs for a selected seller even when the desktop drawer starts on the overview tab', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=STORE_THE_HYUNDAI_SEOUL'],
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText(/판매처별 재고 분산/)).toBeInTheDocument();
    expect((await screen.findAllByText('전체 15개')).length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('총 3개 LOT')).toBeInTheDocument();
    expect((await screen.findAllByText(/FEFO 1순위/)).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('등록된 LOT 재고가 없습니다')).not.toBeInTheDocument();
    expect(inventoryApiMock.getInventoryLots).toHaveBeenCalledWith(
      'SKU_MANDU_001_105',
      'STORE_THE_HYUNDAI_SEOUL',
      expect.anything(),
    );
  });

  it('defaults to the top sales point or shows all-summary when __ALL__ is specified', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=__ALL__'],
    });

    expect(await screen.findByText('판매처를 먼저 선택해 주세요')).toBeInTheDocument();
    expect(screen.getByText('판매처 선택하기')).toBeInTheDocument();
    expect(inventoryApiMock.getInventoryLots).not.toHaveBeenCalled();
  });

  it('automatically defaults to the top sales point when opening detail drawer without sales point parameter', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?detailSkuCode=SKU_MANDU_001_105'],
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect((await screen.findAllByText(/FEFO 1순위/)).length).toBeGreaterThanOrEqual(1);
    expect(inventoryApiMock.getInventoryLots).toHaveBeenCalledWith(
      'SKU_MANDU_001_105',
      expect.any(String),
      expect.anything(),
    );
  });

  it('does not request forecasts when __ALL__ summary is chosen', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=__ALL__&detailTab=FORECAST'],
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText(/수요예측을 조회할 판매처를 먼저 선택해 주세요/)).toBeInTheDocument();
    expect(forecastApiMock.getDemandForecast).not.toHaveBeenCalled();
  });

  it('shows forecast without requesting or rendering risk assessment in the forecast tab', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: [
        '/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=STORE_THE_HYUNDAI_SEOUL&detailTab=FORECAST',
      ],
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText(/수요예측 & 예상 잔고 추이/)).toBeInTheDocument();
    expect(screen.queryByText('판정 실패')).not.toBeInTheDocument();
    expect(screen.queryByText('위험 판정')).not.toBeInTheDocument();
    expect(riskApiMock.getInventoryRisk).not.toHaveBeenCalled();
    expect(forecastApiMock.getDemandForecast).toHaveBeenCalledWith(
      'SKU_MANDU_001_105',
      'STORE_THE_HYUNDAI_SEOUL',
      expect.anything(),
    );
  });
});
