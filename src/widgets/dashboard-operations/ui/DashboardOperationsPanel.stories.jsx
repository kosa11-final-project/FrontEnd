import { mapDashboardResponse } from '@/entities/inventory';
import { mockDashboardResponse } from '@/entities/inventory/testing/dashboardFixtures.js';
import { StorybookProductFrame } from '@/storybook/StorybookProductFrame.jsx';
import { DashboardOperationsPanel } from './DashboardOperationsPanel.jsx';

const dashboard = mapDashboardResponse(mockDashboardResponse);
const selectedSalesPoint = dashboard.offlineStores[0] ?? dashboard.onlineSalesPoints[0];
const urgentSkus =
  dashboard.urgentSkusBySalesPoint?.[selectedSalesPoint?.salesPointId] ?? dashboard.urgentSkusTop5 ?? [];

const meta = {
  title: 'Widgets/Dashboard/Operations Panel',
  component: DashboardOperationsPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '선택 판매처의 긴급 처리 SKU와 위험재고 판매처 순위를 접고 펼쳐 확인하는 대시보드 운영 패널입니다.',
      },
    },
  },
};

export default meta;

function PanelFrame({ children }) {
  return (
    <StorybookProductFrame path="/dashboard" minHeight="760px">
      <div className="mx-auto h-[min(680px,calc(100dvh-180px))] max-w-[420px]">{children}</div>
    </StorybookProductFrame>
  );
}

export const SelectedSalesPoint = {
  render: () => (
    <PanelFrame>
      <DashboardOperationsPanel
        selectedSalesPoint={selectedSalesPoint}
        urgentSkus={urgentSkus}
        riskSalesPoints={dashboard.riskSalesPointsTop10}
      />
    </PanelFrame>
  ),
};

export const NoSelectedSalesPoint = {
  render: () => (
    <PanelFrame>
      <DashboardOperationsPanel
        selectedSalesPoint={null}
        urgentSkus={[]}
        riskSalesPoints={dashboard.riskSalesPointsTop10}
      />
    </PanelFrame>
  ),
};
