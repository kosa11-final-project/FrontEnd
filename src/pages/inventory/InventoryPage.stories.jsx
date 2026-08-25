import { useMemo, useState } from 'react';
import { fn } from 'storybook/test';
import { mapDemandForecastResponse, forecastQueryKeys } from '@/entities/forecast';
import { getMockDemandForecastDto } from '@/entities/forecast/testing/fixtures.js';
import { inventoryKeys, mapInventoryItem, RESULT_STATE } from '@/entities/inventory';
import { mockRawInventoryItems } from '@/entities/inventory/testing/fixtures.js';
import { mapRiskAssessmentResponse, riskQueryKeys } from '@/entities/risk';
import { getMockRiskAssessmentDto } from '@/entities/risk/testing/fixtures.js';
import { DEFAULT_INVENTORY_FILTERS, InventoryFilterBar } from '@/features/inventory-filter';
import { InventorySummaryBar } from '@/widgets/inventory-summary';
import { InventoryTable } from '@/widgets/inventory-table';
import { InventoryDetailDrawer } from '@/widgets/inventory-detail-drawer';
import { Button } from '@/shared/ui';
import { createStoryQueryClient, StorybookProductFrame } from '@/storybook/StorybookProductFrame.jsx';

const rawItems = mockRawInventoryItems.slice(0, 3).map((item) => ({ ...item, image_url: null, imageUrl: null }));
const inventoryItems = rawItems.map(mapInventoryItem);
const selectedItem = inventoryItems[0];

const filterOptions = {
  channels: [
    { code: 'GREETING', name: '그리팅' },
    { code: 'ECOMMERCE', name: '모두의맛집' },
    { code: 'HYUNDAI_DEPT', name: '현대백화점' },
    { code: 'HMART', name: '직영점' },
  ],
  salesPoints: selectedItem.salesPoints.slice(0, 4).map(({ salesPointCode, salesPointName }) => ({
    code: salesPointCode,
    name: salesPointName,
  })),
  warehouses: [
    { code: 'GYEONGIN_1', name: '경인 1센터' },
    { code: 'GYEONGIN_2', name: '경인 2센터' },
    { code: 'ICHEON_DC', name: '이천 통합센터' },
  ],
  regions: [{ code: 'GYEONGGI', name: '경기권' }],
  categories: [{ id: 1, name: '냉장·냉동 식품' }],
  storageTypes: [
    { code: 'FROZEN', name: '냉동' },
    { code: 'COLD', name: '냉장' },
  ],
  riskGrades: [
    { code: 'SAFE', name: '양호' },
    { code: 'NORMAL', name: '보통' },
    { code: 'CAUTION', name: '주의' },
    { code: 'DANGER', name: '위험' },
  ],
  assessmentStatuses: [
    { code: 'ASSESSED', name: '판정 완료' },
    { code: 'UNASSESSED', name: '미판정' },
  ],
};

const summary = {
  totalCurrentQuantity: 2550,
  totalAvailableQuantity: 2220,
  totalReservedQuantity: 330,
  underSafetyCount: 14,
  dangerRiskCount: 5,
  cautionRiskCount: 9,
};

function createInventoryStoryClient() {
  return createStoryQueryClient((client) => {
    inventoryItems.forEach((item, index) => {
      item.salesPoints.slice(0, 4).forEach((salesPoint) => {
        const availableQty = salesPoint.availableQuantity ?? 0;
        const forecastDto = getMockDemandForecastDto(item.skuCode, salesPoint.salesPointCode);
        const demandScale = index === 1 ? 1.25 : index === 2 ? 0.72 : 1;
        const cumulativeForecast = Object.fromEntries(
          Object.entries(forecastDto.cumulativeForecast).map(([key, value]) => [key, Math.round(value * demandScale)]),
        );
        const forecast = mapDemandForecastResponse({
          ...forecastDto,
          salesPointName: salesPoint.salesPointName,
          availableQty,
          cumulativeForecast,
          projectedInventories: {
            projectedD7: Math.max(0, availableQty - cumulativeForecast.predictedQtyD7),
            projectedD14: Math.max(0, availableQty - cumulativeForecast.predictedQtyD14),
            projectedD30: Math.max(0, availableQty - cumulativeForecast.predictedQtyD30),
            projectedD60: Math.max(0, availableQty - cumulativeForecast.predictedQtyD60),
            projectedD90: Math.max(0, availableQty - cumulativeForecast.predictedQtyD90),
            stockoutPeriod: availableQty <= cumulativeForecast.predictedQtyD30 ? 'D+15~D+30' : null,
          },
        });
        const risk = mapRiskAssessmentResponse({
          ...getMockRiskAssessmentDto(item.skuCode, salesPoint.salesPointCode),
          availableQty,
          safetyStockQty: item.safetyQuantity,
          stockCoverageDays: index === 1 ? 4 : 28,
          safetyGapQty: Math.max(0, (item.safetyQuantity ?? 0) - availableQty),
          shortageYn: availableQty < (item.safetyQuantity ?? 0) ? 'Y' : 'N',
        });

        client.setQueryData(inventoryKeys.detail(item.skuCode, salesPoint.salesPointCode), {
          ...item,
          ...salesPoint,
          salesPoints: item.salesPoints,
          lots: item.lots,
        });
        client.setQueryData(inventoryKeys.lot(item.skuCode, salesPoint.salesPointCode), {
          items: item.lots,
          totalCount: item.lots.length,
        });
        client.setQueryData(forecastQueryKeys.detail(item.skuCode, salesPoint.salesPointCode), forecast);
        client.setQueryData(riskQueryKeys.detail(item.skuCode, salesPoint.salesPointCode), risk);
      });
    });
  });
}

function InventoryWorkspace({ initialDetailTab = '', initialSelected = [] }) {
  const [filters, setFilters] = useState({
    ...DEFAULT_INVENTORY_FILTERS,
    detailSkuCode: initialSelected.length ? selectedItem.skuCode : '',
    detailSalesPointCode: initialSelected.length ? selectedItem.salesPoints[0]?.salesPointCode : '',
    detailTab: initialDetailTab || DEFAULT_INVENTORY_FILTERS.detailTab,
  });
  const [selectedSkuCodes, setSelectedSkuCodes] = useState(initialSelected);
  const selectedRow = selectedSkuCodes.length ? selectedItem : null;

  const displayedItems = useMemo(() => inventoryItems.map((item) => ({ ...item, imageUrl: null })), []);

  function updateFilters(changes) {
    setFilters((current) => ({ ...current, ...changes }));
  }

  function toggleSelection(skuCode) {
    setSelectedSkuCodes((current) =>
      current.includes(skuCode) ? current.filter((code) => code !== skuCode) : [...current, skuCode],
    );
  }

  function selectRow(item) {
    updateFilters({
      detailSkuCode: item.skuCode,
      detailSalesPointCode: item.salesPoints[0]?.salesPointCode ?? '',
      detailTab: filters.detailTab || 'OVERVIEW',
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[color:var(--text-heading)]">통합 재고 관제</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--primary)]/25 bg-[color:var(--primary-soft)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--primary-strong)]">
              <span className="size-1.5 rounded-full bg-[color:var(--primary)]" />
              현재 DB 기준
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-[color:var(--text-muted)]">
            통합 판매채널과 물류센터에 적재된 현재 재고 현황과 위험도를 관제합니다.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={fn()}>
          재고 동기화
        </Button>
      </div>

      <InventorySummaryBar summary={summary} isLoading={false} isError={false} onRetry={fn()} />
      <InventoryFilterBar
        filters={filters}
        filterOptions={filterOptions}
        isFilterOptionsLoading={false}
        onFilterChange={updateFilters}
        onReset={() => setFilters(DEFAULT_INVENTORY_FILTERS)}
      />
      <InventoryTable
        items={displayedItems}
        totalCount={42}
        page={1}
        size={20}
        totalPages={3}
        sort="updatedAt,desc"
        selectedItem={selectedRow}
        selectedSkuCodes={selectedSkuCodes}
        onToggleSelectSku={toggleSelection}
        onSelectAllSkus={(codes) => setSelectedSkuCodes(Array.isArray(codes) ? codes.slice(0, 5) : [])}
        onClearSelectedSkus={() => setSelectedSkuCodes([])}
        onGenerateStrategy={fn()}
        resultState={RESULT_STATE.HAS_DATA}
        onPageChange={fn()}
        onSizeChange={fn()}
        onSortChange={fn()}
        onResetFilters={() => setFilters(DEFAULT_INVENTORY_FILTERS)}
        onRowClick={selectRow}
      />
      <InventoryDetailDrawer
        item={selectedItem}
        open={Boolean(filters.detailSkuCode)}
        activeTab={filters.detailTab}
        selectedSalesPointCode={filters.detailSalesPointCode}
        onSalesPointChange={(salesPointCode) => updateFilters({ detailSalesPointCode: salesPointCode })}
        onTabChange={(detailTab) => updateFilters({ detailTab })}
        onClose={() => updateFilters({ detailSkuCode: '', detailSalesPointCode: '' })}
      />
    </div>
  );
}

const meta = {
  title: 'Pages/Integrated Inventory',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '통합재고조회를 기준으로 한 실제 업무 화면입니다. 목록·필터·다중 선택·전략 요청 진입점과 SKU 상세 드로어의 재고 개요·수요예측 뎁스를 함께 검토합니다.',
      },
    },
  },
};

export default meta;

export const InventoryOverview = {
  render: () => (
    <StorybookProductFrame path="/inventory" minHeight="980px" queryClient={createInventoryStoryClient()}>
      <InventoryWorkspace />
    </StorybookProductFrame>
  ),
};

export const InventoryWithSelectedRows = {
  render: () => (
    <StorybookProductFrame path="/inventory" minHeight="980px" queryClient={createInventoryStoryClient()}>
      <InventoryWorkspace initialSelected={[inventoryItems[0].skuCode, inventoryItems[1].skuCode]} />
    </StorybookProductFrame>
  ),
};

export const SkuDetailOverview = {
  render: () => (
    <StorybookProductFrame
      path={`/inventory?detailSkuCode=${encodeURIComponent(selectedItem.skuCode)}&detailSalesPointCode=${encodeURIComponent(selectedItem.salesPoints[0].salesPointCode)}`}
      minHeight="980px"
      queryClient={createInventoryStoryClient()}
    >
      <InventoryWorkspace initialSelected={[selectedItem.skuCode]} />
    </StorybookProductFrame>
  ),
};

export const SkuDetailForecast = {
  render: () => (
    <StorybookProductFrame
      path={`/inventory?detailSkuCode=${encodeURIComponent(selectedItem.skuCode)}&detailSalesPointCode=${encodeURIComponent(selectedItem.salesPoints[0].salesPointCode)}&detailTab=FORECAST`}
      minHeight="980px"
      queryClient={createInventoryStoryClient()}
    >
      <InventoryWorkspace initialDetailTab="FORECAST" initialSelected={[selectedItem.skuCode]} />
    </StorybookProductFrame>
  ),
};

export const InventoryEmpty = {
  render: () => (
    <StorybookProductFrame path="/inventory" minHeight="760px">
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[color:var(--text-heading)]">통합 재고 관제</h1>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">조회 조건에 맞는 재고가 없습니다.</p>
        </div>
        <InventoryTable items={[]} totalCount={0} resultState={RESULT_STATE.NO_DATA} onRetry={fn()} />
      </div>
    </StorybookProductFrame>
  ),
};
