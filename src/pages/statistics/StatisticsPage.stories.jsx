import { MemoryRouter } from 'react-router-dom';
import { StateView } from '@/shared/ui';
import { StatisticsPageContent, StatisticsPageShell } from './StatisticsPage.jsx';
import { inventoryStatisticsFixture } from './model/statisticsFixtures.js';

const meta = {
  title: 'Pages/Statistics',
  component: StatisticsPageContent,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;

function StoryFrame({ children }) {
  return (
    <MemoryRouter initialEntries={['/statistics']}>
      <div className="min-h-screen bg-[var(--background)]">
        <div className="content-wrap">{children}</div>
      </div>
    </MemoryRouter>
  );
}

export const Default = {
  render: () => (
    <StoryFrame>
      <StatisticsPageContent statistics={inventoryStatisticsFixture} />
    </StoryFrame>
  ),
};

export const WithoutFinancialPermission = {
  render: () => (
    <StoryFrame>
      <StatisticsPageContent statistics={{ ...inventoryStatisticsFixture, canViewFinancials: false }} />
    </StoryFrame>
  ),
};

export const Loading = {
  render: () => (
    <StoryFrame>
      <StatisticsPageShell>
        <StateView
          state="loading"
          title="재고 통계를 불러오고 있습니다."
          description="선택한 기간의 정상 집계 결과를 확인하는 중입니다."
        />
      </StatisticsPageShell>
    </StoryFrame>
  ),
};

export const Empty = {
  render: () => (
    <StoryFrame>
      <StatisticsPageShell>
        <StateView
          state="empty"
          title="조회 기간에 집계된 통계가 없습니다."
          description="재고 동기화와 위험등급 산정이 완료된 후 다시 확인해 주세요."
        />
      </StatisticsPageShell>
    </StoryFrame>
  ),
};

export const Error = {
  render: () => (
    <StoryFrame>
      <StatisticsPageShell>
        <StateView state="error" actionLabel="다시 시도" onAction={() => undefined} />
      </StatisticsPageShell>
    </StoryFrame>
  ),
};
