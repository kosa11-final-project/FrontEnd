import { useMemo, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { filterStrategies, strategyExecutionFixtures } from '@/entities/strategy';
import { defaultStrategyExecutionFilters, STRATEGY_EXECUTION_PAGE_SIZE } from '@/features/strategy-execution-filter';
import { StorybookProductFrame } from '@/storybook/StorybookProductFrame.jsx';
import { StrategyExecutionDetailContent } from './ExecutionDetailPage.jsx';
import { StrategyExecutionListContent } from './ExecutionListPage.jsx';
import { ExecutionListSkeleton } from './ui/ExecutionListSkeleton.jsx';

const meta = {
  title: 'Pages/Execution',
  component: StrategyExecutionListContent,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
const Frame = ({ children, path = '/execution' }) => (
  <MemoryRouter initialEntries={[path]}>
    <div className="min-h-screen bg-[var(--background)]">
      <div className="content-wrap">{children}</div>
    </div>
  </MemoryRouter>
);

function ListPreview({ strategies }) {
  const [filters, setFilters] = useState(defaultStrategyExecutionFilters);
  const filtered = useMemo(() => filterStrategies(strategies, filters), [filters, strategies]);
  return (
    <StrategyExecutionListContent
      strategies={filtered}
      summary={{
        executionStrategyCount: filtered.filter((strategy) => strategy.status !== 'READY').length,
        inProgressStrategyCount: filtered.filter((strategy) => strategy.status === 'EXECUTING').length,
        attentionStrategyCount: filtered.filter((strategy) => strategy.status === 'PARTIAL').length,
        totalStrategyCount: filtered.length,
      }}
      filters={filters}
      pagination={{
        page: 1,
        size: STRATEGY_EXECUTION_PAGE_SIZE,
        totalElements: filtered.length,
        totalPages: 1,
      }}
      onFiltersChange={setFilters}
      onPageChange={() => {}}
    />
  );
}

export const Default = {
  render: () => (
    <Frame>
      <ListPreview strategies={strategyExecutionFixtures} />
    </Frame>
  ),
};
export const DetailSequentialParallelBlocked = {
  render: () => (
    <Frame path="/execution/102">
      <StrategyExecutionDetailContent strategy={strategyExecutionFixtures[1]} />
    </Frame>
  ),
};
export const DetailNoPerformanceData = {
  render: () => (
    <Frame path="/execution/103">
      <StrategyExecutionDetailContent strategy={strategyExecutionFixtures[2]} />
    </Frame>
  ),
};
export const Empty = {
  render: () => (
    <Frame>
      <ListPreview strategies={[]} />
    </Frame>
  ),
};
export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <Frame>
      <ListPreview strategies={strategyExecutionFixtures.slice(0, 1)} />
    </Frame>
  ),
};

export const ProductFrame = {
  render: () => (
    <StorybookProductFrame path="/execution" minHeight="980px">
      <ListPreview strategies={strategyExecutionFixtures} />
    </StorybookProductFrame>
  ),
};

export const ProductFrameDetail = {
  render: () => (
    <StorybookProductFrame path="/execution/102" minHeight="1360px">
      <StrategyExecutionDetailContent strategy={strategyExecutionFixtures[1]} />
    </StorybookProductFrame>
  ),
};

export const Loading = {
  render: () => (
    <StorybookProductFrame path="/execution" minHeight="980px">
      <ExecutionListSkeleton />
    </StorybookProductFrame>
  ),
};
