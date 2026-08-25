import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

vi.mock('@/entities/inventory/api/inventoryApi.js', () => inventoryApiMock);
vi.mock('@/entities/forecast/api/forecastApi.js', () => forecastApiMock);
vi.mock('@/entities/risk/api/riskApi.js', () => riskApiMock);
vi.mock('@/features/inventory-sync/api/inventorySyncApi.js', () => inventorySyncApiMock);

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
            (salesPointCode === 'UNASSIGNED' && candidate.locations?.length > 0) ||
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
            (salesPointCode === 'UNASSIGNED' && candidate.locations?.length > 0) ||
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

  it('renders inventory sync card, summary KPI cards, filter bar and inventory table', async () => {
    renderWithProviders(<InventoryPage />);

    expect(document.querySelector('.inventory-page')).toHaveClass('gap-4');
    expect(screen.queryByText('통합 재고 관제')).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '재고 동기화' })).toBeEnabled();
    const syncCard = screen.getByRole('region', { name: '재고 동기화' });
    expect(syncCard).toHaveTextContent('통합 재고 동기화');
    expect(syncCard).toHaveTextContent(
      '그리팅, 이커머스(모두의 맛집), 백화점, 직영점의 재고가 통합재고로 동기화됩니다.',
    );
    expect(screen.getAllByRole('button', { name: '재고 동기화' })).toHaveLength(1);

    // 상단 KPI 카드 비동기 렌더링 확인
    expect(await screen.findByText(/총 현재고/)).toBeInTheDocument();
    expect(await screen.findByText(/총 가용수량/)).toBeInTheDocument();
    expect(await screen.findByText('안전재고 미달 SKU')).toBeInTheDocument();
    expect(screen.queryByText('개 SKU')).not.toBeInTheDocument();

    // 필터바 컨트롤 확인
    expect(screen.getByPlaceholderText(/상품명, SKU 코드, 판매처명/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /검색/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '필터 초기화' })).toBeInTheDocument();

    // 목록의 주 식별자는 상품명이 아니라 SKU 규격입니다.
    expect((await screen.findAllByText(/1\.05kg 단품팩/)).length).toBeGreaterThanOrEqual(1);
  });

  it('does not render the removed DB status badge when the inventory request fails', async () => {
    inventoryApiMock.getInventories.mockRejectedValueOnce(new Error('database unavailable'));

    renderWithProviders(<InventoryPage />);

    expect(await screen.findByRole('region', { name: '재고 동기화' })).toBeInTheDocument();
    expect(screen.queryByText('DB 연결 확인 필요')).not.toBeInTheDocument();
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

  it('clears persisted filter query parameters when the inventory page opens', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: [
        '/inventory?q=비비고&filterOperator=OR&storageType=FROZEN&riskGrade=DANGER&categoryId=12&shortageYn=Y',
      ],
    });

    await vi.waitFor(() => {
      const latestListParams = inventoryApiMock.getInventories.mock.calls.at(-1)?.[0];
      const latestSummaryParams = inventoryApiMock.getInventorySummary.mock.calls.at(-1)?.[0];

      expect(latestListParams).not.toHaveProperty('q');
      expect(latestListParams).not.toHaveProperty('filterOperator');
      expect(latestListParams).not.toHaveProperty('storageType');
      expect(latestListParams).not.toHaveProperty('riskGrade');
      expect(latestListParams).not.toHaveProperty('categoryId');
      expect(latestListParams).not.toHaveProperty('shortageYn');
      expect(latestSummaryParams).not.toHaveProperty('q');
      expect(latestSummaryParams).not.toHaveProperty('filterOperator');
      expect(latestSummaryParams).not.toHaveProperty('storageType');
      expect(latestSummaryParams).not.toHaveProperty('riskGrade');
      expect(latestSummaryParams).not.toHaveProperty('categoryId');
      expect(latestSummaryParams).not.toHaveProperty('shortageYn');
    });

    expect(screen.getByPlaceholderText(/상품명, SKU 코드, 판매처명/)).toHaveValue('');
  });

  it('does not restore a persisted OR operator or detailed filters on page entry', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?filterOperator=OR&storageType=FROZEN&riskGrade=DANGER'],
    });

    await vi.waitFor(() => {
      const listParams = inventoryApiMock.getInventories.mock.calls.at(-1)?.[0];
      const summaryParams = inventoryApiMock.getInventorySummary.mock.calls.at(-1)?.[0];
      expect(listParams).not.toHaveProperty('filterOperator');
      expect(listParams).not.toHaveProperty('storageType');
      expect(listParams).not.toHaveProperty('riskGrade');
      expect(summaryParams).not.toHaveProperty('filterOperator');
      expect(summaryParams).not.toHaveProperty('storageType');
      expect(summaryParams).not.toHaveProperty('riskGrade');
    });
  });

  it('moves back to page one when the filtered result no longer contains the current page', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?page=4'],
    });

    await vi.waitFor(() => expect(screen.getByRole('button', { name: '1', current: 'page' })).toBeInTheDocument());
  });

  it('does not let removed legacy URL filters affect list or summary requests', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?filterOperator=OR&storageType=FROZEN&regionCode=GYEONGGI&assessmentStatus=ASSESSED'],
    });

    await vi.waitFor(() => {
      expect(inventoryApiMock.getInventories).toHaveBeenCalled();
      expect(inventoryApiMock.getInventorySummary).toHaveBeenCalled();
    });

    const listParams = inventoryApiMock.getInventories.mock.calls.at(-1)[0];
    const summaryParams = inventoryApiMock.getInventorySummary.mock.calls.at(-1)[0];

    expect(listParams).not.toHaveProperty('filterOperator');
    expect(listParams).not.toHaveProperty('storageType');
    expect(summaryParams).not.toHaveProperty('filterOperator');
    expect(summaryParams).not.toHaveProperty('storageType');
    expect(listParams).not.toHaveProperty('regionCode');
    expect(listParams).not.toHaveProperty('assessmentStatus');
    expect(summaryParams).not.toHaveProperty('regionCode');
    expect(summaryParams).not.toHaveProperty('assessmentStatus');
  });

  it('opens the AI strategy request popup for selected products', async () => {
    renderWithProviders(<InventoryPage />);

    const productCheckboxes = await screen.findAllByRole('checkbox', { name: /1\.05kg 단품팩 선택/ });
    fireEvent.click(productCheckboxes[0]);

    const generateButton = screen.getByRole('button', { name: 'AI 전략 생성' });
    expect(generateButton).toBeEnabled();
    fireEvent.click(generateButton);

    expect(screen.getByRole('dialog', { name: 'AI 전략 생성' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^전략명/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^현재·출발 판매처/)).toBeInTheDocument();
    expect(screen.getByText('희망 전략 타입')).toBeInTheDocument();
    expect(screen.getByLabelText(/^시작일/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^종료일/)).toBeInTheDocument();
    expect(screen.getByText('출발 판매처를 먼저 선택해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('요청 조건 입력 0/1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /AI 전략 생성 요청/ }));
    expect(
      screen.getByText('조건을 하나 이상 입력하거나 조건 전체를 AI에게 추천받기를 선택해 주세요.'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^현재·출발 판매처/), {
      target: { value: 'STORE_THE_HYUNDAI_SEOUL' },
    });
    expect(await screen.findByRole('checkbox', { name: /LOT-GF-20260729-01 LOT 선택/ })).toBeInTheDocument();
    expect(inventoryApiMock.getInventoryLots).toHaveBeenCalledWith(
      'SKU_MANDU_001_105',
      'STORE_THE_HYUNDAI_SEOUL',
      expect.anything(),
    );
    expect(screen.getByText('요청 조건 입력 1/1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /조건 전체를 AI에게 추천받기/ }));
    expect(screen.getByText('요청 조건 입력 1/1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /AI 전략 생성 요청/ }));
    expect(screen.getByText(/1건의 목업 요청 구성이 완료되었습니다/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'AI 전략 생성 팝업 닫기' }));
    expect(screen.queryByRole('dialog', { name: 'AI 전략 생성' })).not.toBeInTheDocument();
  });

  it('renders filter empty state when no items match search query', async () => {
    renderWithProviders(<InventoryPage />);

    const searchInput = await screen.findByPlaceholderText(/상품명, SKU 코드, 판매처명/);
    fireEvent.change(searchInput, { target: { value: '존재하지않는상품검색어xyz' } });
    fireEvent.click(screen.getByRole('button', { name: /검색/i }));

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

  it('shows a stable overview skeleton while switching to an uncached sales point', async () => {
    const initialDetailImplementation = inventoryApiMock.getInventoryDetail.getMockImplementation();
    let releaseDetail;
    const pendingDetail = new Promise((resolve) => {
      releaseDetail = resolve;
    });
    inventoryApiMock.getInventoryDetail.mockImplementation((skuCode, salesPointCode, signal) => {
      if (salesPointCode === 'GREETING_ONLINE') return pendingDetail;
      return initialDetailImplementation(skuCode, salesPointCode, signal);
    });

    renderWithProviders(<InventoryPage />, {
      initialEntries: [
        '/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=STORE_THE_HYUNDAI_SEOUL&detailTab=OVERVIEW',
      ],
    });

    expect(await screen.findByText('총 3개 LOT')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('상세 판매처 선택'), { target: { value: 'GREETING_ONLINE' } });

    expect(
      await screen.findByRole('status', { name: '선택한 판매처의 재고 상세 정보를 불러오는 중' }),
    ).toBeInTheDocument();

    releaseDetail?.(initialDetailImplementation('SKU_MANDU_001_105', 'GREETING_ONLINE'));
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

  it('resets the forecast sales point after closing and reopening the detail drawer', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: [
        '/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=STORE_THE_HYUNDAI_SEOUL&detailTab=FORECAST',
      ],
    });

    expect(await screen.findByText(/수요예측 & 예상 잔고 추이/)).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: /신촌점/ }));
    await vi.waitFor(() => expect(screen.getByLabelText('상세 판매처 선택')).toHaveValue('STORE_SINCHON'));

    fireEvent.click(screen.getByRole('button', { name: '상세 드로어 닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click((await screen.findAllByRole('button', { name: /재고 상세 보기/ }))[0]);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.getByLabelText('상세 판매처 선택')).toHaveValue('GREETING_ONLINE'));
  });

  it('loads the server risk assessment for unassigned inventory', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=UNASSIGNED&detailTab=OVERVIEW'],
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText('서버 위험 판정 결과')).toBeInTheDocument();
    expect(riskApiMock.getInventoryRisk).toHaveBeenCalledWith('SKU_MANDU_001_105', 'UNASSIGNED', expect.anything());
    expect(screen.getAllByText('주의').length).toBeGreaterThan(0);
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

  it('keeps a sales point selected when a legacy __ALL__ value is present', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=__ALL__'],
    });

    expect(await screen.findByText('총 3개 LOT')).toBeInTheDocument();
    expect(screen.queryByText('판매처를 먼저 선택해 주세요')).not.toBeInTheDocument();
    expect(inventoryApiMock.getInventoryLots).toHaveBeenCalledWith(
      'SKU_MANDU_001_105',
      'GREETING_ONLINE',
      expect.anything(),
    );
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

  it('defaults the forecast tab to a sales point when a legacy __ALL__ value is present', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=__ALL__&detailTab=FORECAST'],
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText(/수요예측 & 예상 잔고 추이/)).toBeInTheDocument();
    expect(forecastApiMock.getDemandForecast).toHaveBeenCalledWith(
      'SKU_MANDU_001_105',
      'GREETING_ONLINE',
      expect.anything(),
    );
  });

  it('shows forecast without requesting or rendering risk assessment in the forecast tab', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: [
        '/inventory?detailSkuCode=SKU_MANDU_001_105&detailSalesPointCode=STORE_THE_HYUNDAI_SEOUL&detailTab=FORECAST',
      ],
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText(/수요예측 & 예상 잔고 추이/)).toBeInTheDocument();
    expect(await screen.findByText('신뢰도 LOW')).toBeInTheDocument();
    expect(screen.queryByText('모델:')).not.toBeInTheDocument();
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
