import { useState } from 'react';
import { fn } from 'storybook/test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { forecastQueryKeys, mapDemandForecastResponse } from '@/entities/forecast';
import { getMockDemandForecastDto } from '@/entities/forecast/testing/fixtures.js';
import { inventoryKeys, mapInventoryItem } from '@/entities/inventory';
import { mockRawInventoryItems } from '@/entities/inventory/testing/fixtures.js';
import { mapRiskAssessmentResponse, riskQueryKeys } from '@/entities/risk';
import { getMockRiskAssessmentDto } from '@/entities/risk/testing/fixtures.js';
import { InventoryDetailDrawer } from './InventoryDetailDrawer.jsx';

const inventoryItem = mapInventoryItem(mockRawInventoryItems[0]);
const handleClose = fn();

function createStoryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  inventoryItem.salesPoints.forEach((salesPoint, index) => {
    const { salesPointCode, salesPointName } = salesPoint;
    const availableQty = salesPoint.availableQuantity ?? 0;
    const demandScale = index === 1 ? 1.45 : index === 2 ? 0.72 : 1;
    const forecastDto = getMockDemandForecastDto(inventoryItem.skuCode, salesPointCode);
    const cumulativeForecast = Object.fromEntries(
      Object.entries(forecastDto.cumulativeForecast).map(([key, value]) => [key, Math.round(value * demandScale)]),
    );
    const projectedInventories = {
      projectedD7: Math.max(0, availableQty - cumulativeForecast.predictedQtyD7),
      projectedD14: Math.max(0, availableQty - cumulativeForecast.predictedQtyD14),
      projectedD30: Math.max(0, availableQty - cumulativeForecast.predictedQtyD30),
      projectedD60: Math.max(0, availableQty - cumulativeForecast.predictedQtyD60),
      projectedD90: Math.max(0, availableQty - cumulativeForecast.predictedQtyD90),
      stockoutPeriod: availableQty <= cumulativeForecast.predictedQtyD30 ? 'D+15~D+30' : null,
    };

    client.setQueryData(inventoryKeys.detail(inventoryItem.skuCode, salesPointCode), {
      ...inventoryItem,
      ...salesPoint,
      salesPoints: inventoryItem.salesPoints,
      lots: inventoryItem.lots,
    });
    client.setQueryData(inventoryKeys.lot(inventoryItem.skuCode, salesPointCode), {
      items: inventoryItem.lots,
      totalCount: inventoryItem.lots.length,
    });
    client.setQueryData(
      forecastQueryKeys.detail(inventoryItem.skuCode, salesPointCode),
      mapDemandForecastResponse({
        ...forecastDto,
        salesPointName,
        availableQty,
        cumulativeForecast,
        projectedInventories,
      }),
    );
    client.setQueryData(
      riskQueryKeys.detail(inventoryItem.skuCode, salesPointCode),
      mapRiskAssessmentResponse({
        ...getMockRiskAssessmentDto(inventoryItem.skuCode, salesPointCode),
        availableQty,
        safetyStockQty: inventoryItem.safetyQuantity,
        stockCoverageDays: index === 1 ? 2 : 28,
        safetyGapQty: Math.max(0, (inventoryItem.safetyQuantity ?? 0) - availableQty),
        shortageYn: availableQty < (inventoryItem.safetyQuantity ?? 0) ? 'Y' : 'N',
      }),
    );
  });

  return client;
}

function ControlledDrawer({ initialTab }) {
  const [client] = useState(createStoryClient);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedSalesPointCode, setSelectedSalesPointCode] = useState(
    inventoryItem.salesPoints[0]?.salesPointCode || '',
  );

  return (
    <QueryClientProvider client={client}>
      <InventoryDetailDrawer
        item={inventoryItem}
        open
        activeTab={activeTab}
        selectedSalesPointCode={selectedSalesPointCode}
        onSalesPointChange={setSelectedSalesPointCode}
        onTabChange={setActiveTab}
        onClose={handleClose}
      />
    </QueryClientProvider>
  );
}

const meta = {
  title: 'Widgets/Inventory/Detail Drawer',
  component: InventoryDetailDrawer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '판매처별 재고·LOT·위험 판정과 수요예측 차트/표를 한 화면에서 전환하는 실제 재고 상세 드로어 조합입니다. 모든 데이터는 Storybook fixture 캐시에 고정되어 API를 호출하지 않습니다.',
      },
    },
  },
};

export default meta;

export const ForecastTab = {
  render: () => <ControlledDrawer initialTab="FORECAST" />,
};

export const OverviewTab = {
  render: () => <ControlledDrawer initialTab="OVERVIEW" />,
};
