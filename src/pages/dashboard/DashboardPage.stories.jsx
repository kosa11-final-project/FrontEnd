import { MemoryRouter } from 'react-router-dom';
import {
  dashboardInventorySummary,
  distributionCenters,
  offlineStoreInventories,
  rankRiskSalesPoints,
  rankUrgentSkus,
  riskSalesPoints,
  urgentSkus,
} from '@/entities/inventory';
import { DashboardPageContent } from './DashboardPage.jsx';

const dashboardFixture = {
  summary: dashboardInventorySummary,
  warehouses: distributionCenters,
  offlineStores: offlineStoreInventories,
  riskSalesPointsTop10: rankRiskSalesPoints(riskSalesPoints)
    .slice(0, 10)
    .map((point, index) => ({ ...point, rank: index + 1 })),
  urgentSkusTop5: rankUrgentSkus(urgentSkus)
    .slice(0, 5)
    .map((sku, index) => ({
      ...sku,
      rank: index + 1,
      skuId: sku.id,
      stockLocation: sku.salesPoint,
      saleStopDays: null,
    })),
  calculatedAt: '2026-08-15T01:05:00Z',
};

const meta = {
  title: 'Pages/Dashboard',
  component: DashboardPageContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '인증 라우팅과 분리해 대시보드의 핵심 지표, 물류센터 hover 상세, 위험 판매처와 긴급 SKU 순위를 검토합니다.',
      },
    },
  },
};

export default meta;

export const Default = {
  render: () => (
    <MemoryRouter initialEntries={['/dashboard']}>
      <div className="min-h-screen bg-[var(--background)]">
        <div className="content-wrap">
          <DashboardPageContent dashboard={dashboardFixture} />
        </div>
      </div>
    </MemoryRouter>
  ),
};
