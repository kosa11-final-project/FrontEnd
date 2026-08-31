import { MemoryRouter } from 'react-router-dom';
import { mapDashboardResponse } from '@/entities/inventory';
import { mockDashboardResponse } from '@/entities/inventory/testing/dashboardFixtures.js';
import { StateView } from '@/shared/ui';
import { StorybookProductFrame } from '@/storybook/StorybookProductFrame.jsx';
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

export const ProductFrame = {
  render: () => (
    <StorybookProductFrame path="/dashboard" minHeight="900px">
      <DashboardPageContent dashboard={dashboardFixture} />
    </StorybookProductFrame>
  ),
};

export const Loading = {
  render: () => (
    <StorybookProductFrame path="/dashboard" minHeight="760px">
      <div className="page-shell">
        <StateView
          state="loading"
          title="대시보드 데이터를 불러오고 있습니다."
          description="최근 재고 동기화 결과를 확인하는 중입니다."
        />
      </div>
    </StorybookProductFrame>
  ),
};

export const SnapshotNotReady = {
  render: () => (
    <StorybookProductFrame path="/dashboard" minHeight="760px">
      <div className="page-shell">
        <StateView
          state="empty"
          title="아직 생성된 대시보드 데이터가 없습니다."
          description="재고 동기화와 위험등급 산정이 완료된 후 다시 확인해 주세요."
        />
      </div>
    </StorybookProductFrame>
  ),
};
