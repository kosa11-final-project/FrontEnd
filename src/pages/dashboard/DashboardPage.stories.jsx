import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage.jsx';

const meta = {
  title: 'Pages/Dashboard',
  component: DashboardPage,
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
          <DashboardPage />
        </div>
      </div>
    </MemoryRouter>
  ),
};
