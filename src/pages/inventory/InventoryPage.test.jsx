import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockInventorySummaryResponse, mockRawInventoryItems } from '@/entities/inventory/testing/fixtures.js';
import {
  mapInventoryItem,
  mapInventoryListResponse,
  mapInventorySummaryResponse,
} from '@/entities/inventory/model/inventoryMapper.js';

const inventoryApiMock = vi.hoisted(() => ({
  getInventories: vi.fn(),
  getInventorySummary: vi.fn(),
  getInventoryFilterOptions: vi.fn(),
  getInventoryDetail: vi.fn(),
  getInventoryLots: vi.fn(),
}));

vi.mock('@/entities/inventory/api/inventoryApi.js', () => inventoryApiMock);

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
        (candidate) => candidate.sku_code === skuCode && candidate.sales_point_code === salesPointCode,
      );
      return mapInventoryItem(item || mockRawInventoryItems[0]);
    });
    inventoryApiMock.getInventoryLots.mockImplementation(async (skuCode, salesPointCode) => {
      const item = mockRawInventoryItems.find(
        (candidate) => candidate.sku_code === skuCode && candidate.sales_point_code === salesPointCode,
      );
      const mapped = mapInventoryItem(item || mockRawInventoryItems[0]);
      return { items: mapped.lots, totalCount: mapped.lots.length };
    });
  });

  it('renders page header, summary KPI cards, filter bar and inventory table', async () => {
    renderWithProviders(<InventoryPage />);

    // 헤더 타이틀 확인
    expect(screen.getByText('통합 재고 관제')).toBeInTheDocument();

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

  it('renders filter empty state when no items match search query', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?q=존재하지않는상품검색어xyz'],
    });

    expect(await screen.findByText('일치하는 재고가 없습니다')).toBeInTheDocument();
  });

  it('opens detail drawer when clicking a table row and allows navigating to LOT tab', async () => {
    renderWithProviders(<InventoryPage />);

    const itemRows = await screen.findAllByText(/1\.05kg 단품팩/);
    itemRows[0].click();

    // 드로어 렌더링 확인
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect((await screen.findAllByText('재고 개요')).length).toBeGreaterThanOrEqual(1);
    expect((await screen.findAllByText(/LOT 상세/)).length).toBeGreaterThanOrEqual(1);

    const salesPointSelect = screen.getByLabelText('상세 판매처 선택');
    fireEvent.change(salesPointSelect, { target: { value: 'GREETING_ONLINE' } });

    // LOT 상세 탭 전환
    const lotTabs = await screen.findAllByText(/LOT 상세/);
    lotTabs[0].click();
    expect((await screen.findAllByText(/FEFO 1순위/)).length).toBeGreaterThanOrEqual(1);
  });

  it('opens detail drawer directly from URL query state', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: [
        '/inventory?detailSkuCode=SKU_MANDU_01_105&detailSalesPointCode=STORE_THE_HYUNDAI_SEOUL&detailTab=LOTS',
      ],
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect((await screen.findAllByText(/FEFO 1순위/)).length).toBeGreaterThanOrEqual(1);
  });

  it('loads LOTs for a selected seller even when the desktop drawer starts on the overview tab', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?detailSkuCode=SKU_MANDU_01_105&detailSalesPointCode=STORE_THE_HYUNDAI_SEOUL'],
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText(/판매처별 재고 분산/)).toBeInTheDocument();
    expect((await screen.findAllByText('전체 15개')).length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('총 3개 LOT')).toBeInTheDocument();
    expect((await screen.findAllByText(/FEFO 1순위/)).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('등록된 LOT 재고가 없습니다')).not.toBeInTheDocument();
    expect(inventoryApiMock.getInventoryLots).toHaveBeenCalledWith(
      'SKU_MANDU_01_105',
      'STORE_THE_HYUNDAI_SEOUL',
      expect.anything(),
    );
  });

  it('does not infer a seller for the LOT tab when the URL has no seller context', async () => {
    renderWithProviders(<InventoryPage />, {
      initialEntries: ['/inventory?detailSkuCode=SKU_MANDU_01_105&detailTab=LOTS'],
    });

    expect(await screen.findByText('판매처를 먼저 선택해 주세요')).toBeInTheDocument();
    expect(screen.getByText('판매처 선택하기')).toBeInTheDocument();
    expect(inventoryApiMock.getInventoryLots).not.toHaveBeenCalled();
  });
});
