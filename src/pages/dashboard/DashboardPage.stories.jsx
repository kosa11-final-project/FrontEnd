import { MemoryRouter } from 'react-router-dom';
import { mapDashboardResponse } from '@/entities/inventory';
import { mockDashboardResponse } from '@/entities/inventory/testing/dashboardFixtures.js';
import { DashboardPageContent } from './DashboardPage.jsx';

// Storybook 전용 API 응답 예시입니다. 운영 엔티티 barrel에는 정적 재고값을 노출하지 않습니다.
const dashboardFixture = mapDashboardResponse(mockDashboardResponse);

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
