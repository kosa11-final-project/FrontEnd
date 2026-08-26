import { MemoryRouter } from 'react-router-dom';
import { fn, userEvent, within } from 'storybook/test';
import { StateView } from '@/shared/ui';
import { StorybookProductFrame } from '@/storybook/StorybookProductFrame.jsx';
import { StatisticsPageContent, StatisticsPageShell } from './StatisticsPage.jsx';
import { StatisticsSkeleton } from './ui/StatisticsSkeleton.jsx';
import { inventoryStatisticsFixture } from './model/statisticsFixtures.js';

const meta = {
  title: 'Pages/Statistics',
  component: StatisticsPageContent,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    onQueryParamsChange: fn(),
    onRetryStrategy: fn(),
  },
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
  render: (args) => (
    <StoryFrame>
      <StatisticsPageContent {...args} statistics={inventoryStatisticsFixture} />
    </StoryFrame>
  ),
};

export const ProductFrame = {
  render: (args) => (
    <StorybookProductFrame path="/statistics" minHeight="1140px">
      <StatisticsPageContent {...args} statistics={inventoryStatisticsFixture} />
    </StorybookProductFrame>
  ),
};

export const ProductFrameInventoryRiskTrend = {
  render: (args) => (
    <StorybookProductFrame path="/statistics" minHeight="1140px">
      <StatisticsPageContent {...args} statistics={inventoryStatisticsFixture} />
    </StorybookProductFrame>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('tab', { name: '위험재고 추이' }));
  },
};

export const InventoryRiskTrend = {
  render: Default.render,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('tab', { name: '위험재고 추이' }));
  },
};

export const WithoutFinancialPermission = {
  render: (args) => (
    <StoryFrame>
      <StatisticsPageContent {...args} statistics={{ ...inventoryStatisticsFixture, canViewFinancials: false }} />
    </StoryFrame>
  ),
};

export const StrategyLoading = {
  render: (args) => (
    <StoryFrame>
      <StatisticsPageContent {...args} statistics={inventoryStatisticsFixture} strategyState="loading" />
    </StoryFrame>
  ),
};

export const StrategyEmpty = {
  render: (args) => (
    <StoryFrame>
      <StatisticsPageContent {...args} statistics={inventoryStatisticsFixture} strategyState="empty" />
    </StoryFrame>
  ),
};

export const StrategyError = {
  render: (args) => (
    <StoryFrame>
      <StatisticsPageContent {...args} statistics={inventoryStatisticsFixture} strategyState="error" />
    </StoryFrame>
  ),
};

export const Loading = {
  render: () => (
    <StoryFrame>
      <StatisticsPageShell>
        <StatisticsSkeleton />
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
