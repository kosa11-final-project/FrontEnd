import { fn } from 'storybook/test';
import { mapDashboardResponse } from '@/entities/inventory';
import { mockDashboardResponse } from '@/entities/inventory/testing/dashboardFixtures.js';
import { InventoryLocationOverview } from './InventoryLocationOverview.jsx';

const dashboard = mapDashboardResponse({
  ...mockDashboardResponse,
  warehouses: [
    ...mockDashboardResponse.warehouses,
    {
      ...mockDashboardResponse.warehouses[0],
      warehouseId: 2,
      warehouseCode: 'ICHEON',
      warehouseName: '이천 통합센터',
      address: '경기도 이천시',
      currentStock: 642,
      availableStock: 590,
      nearExpiryStock: 21,
      outboundStock: 52,
      riskSkuCount: 2,
    },
  ],
  onlineSalesPoints: [
    ...mockDashboardResponse.onlineSalesPoints,
    {
      ...mockDashboardResponse.onlineSalesPoints[0],
      salesPointId: 11,
      salesPointCode: 'MODU_MATZIP',
      salesPointName: '모두의 맛집',
      storageWarehouseCount: 1,
      currentStock: 486,
      availableStock: 414,
      nearExpiryStock: 29,
      expectedDisposalQty: 48,
      riskSkuCount: 1,
    },
  ],
  offlineStores: [
    ...mockDashboardResponse.offlineStores,
    {
      ...mockDashboardResponse.offlineStores[0],
      salesPointId: 14,
      salesPointCode: 'DEPT_MIA',
      salesPointName: '미아점',
      address: '서울특별시 강북구',
      currentStock: 382,
      availableStock: 314,
      nearExpiryStock: 18,
      expectedDisposalQty: 27,
      riskSkuCount: 2,
    },
  ],
});

const meta = {
  title: 'Widgets/Inventory/Location Overview',
  component: InventoryLocationOverview,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '오프라인 판매처·미할당 물류센터·온라인 판매처 재고를 탭으로 전환하고, 데스크톱 3D 장면과 모바일 위치 목록으로 핵심 수치를 확인합니다.',
      },
    },
  },
  args: {
    centers: dashboard.warehouses,
    onlineSalesPoints: dashboard.onlineSalesPoints,
    stores: dashboard.offlineStores,
    onSalesPointSelect: fn(),
    onViewModeChange: fn(),
  },
};

export default meta;

export const AllLocationTypes = {
  render: (args) => (
    <div className="h-[680px] w-full min-w-0 max-w-[1280px]">
      <InventoryLocationOverview {...args} />
    </div>
  ),
};

export const MobileLocationList = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: (args) => (
    <div className="w-full min-w-0">
      <InventoryLocationOverview {...args} />
    </div>
  ),
};

export const NoLocations = {
  args: {
    centers: [],
    onlineSalesPoints: [],
    stores: [],
  },
  render: (args) => (
    <div className="min-h-[320px] w-full max-w-[960px]">
      <InventoryLocationOverview {...args} />
    </div>
  ),
};
