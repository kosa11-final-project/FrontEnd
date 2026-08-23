import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mapInventoryItem, mapInventoryListResponse, mapInventorySummaryResponse } from '@/entities/inventory';
import { mockInventorySummaryResponse, mockRawInventoryItems } from '@/entities/inventory/testing/fixtures.js';

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

vi.mock('@/entities/inventory/api/inventoryApi.js', () => inventoryApiMock);
vi.mock('@/entities/forecast/api/forecastApi.js', () => forecastApiMock);
vi.mock('@/entities/risk/api/riskApi.js', () => riskApiMock);

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
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('InventoryPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      safetyGapQty: 5,
      reasons: [],
    });
  });

  it('renders page header, summary KPI cards, filter bar and inventory table', async () => {
    renderWithProviders(<InventoryPage />);

    // 실제 source 스키마가 없으므로 동기화는 요청을 보내지 않는 준비 중 상태입니다.
    expect(screen.getByText('통합 재고 관제')).toBeInTheDocument();
    expect(screen.getByText('현재 DB 기준')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '재고 동기화 준비 중' })).toBeDisabled();
    expect(screen.getByText('원천 데이터 연결과 Flyway 반영 후 활성화됩니다.')).toBeInTheDocument();

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

  it('renders filtered items according to query parameters', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?q=비비고'],
    });

    expect((await screen.findAllByText(/1\.05kg 단품팩/)).length).toBeGreaterThanOrEqual(1);
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
