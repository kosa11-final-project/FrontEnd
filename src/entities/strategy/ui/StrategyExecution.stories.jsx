import { StrategyActionCard } from './StrategyActionCard.jsx';
import { StrategyStatusBadge } from './StrategyStatusBadge.jsx';
import { StrategySyncStatus } from './StrategySyncStatus.jsx';
import { StrategyDailySalesAreaChart } from './StrategyDailySalesAreaChart.jsx';
import { StrategyChannelPerformanceReport } from './StrategyChannelPerformanceReport.jsx';
import { StrategyInventoryComparisonBarChart } from './StrategyInventoryComparisonBarChart.jsx';
import { StrategyInventoryTransferList } from './StrategyInventoryTransferList.jsx';
import { EmptyPerformanceState } from './EmptyPerformanceState.jsx';
import { strategyExecutionFixtures } from '../testing/fixtures.js';

const scatterChannelResults = [
  { channel: '모두의 맛집', status: 'COMPLETED', sales: 63, revenue: 598500, cannibalization: '미수집' },
  { channel: '그리팅', status: 'COMPLETED', sales: 41, revenue: 382000, cannibalization: '해당 없음' },
  { channel: '현대식품관 투홈', status: 'EXECUTING', sales: 25, revenue: 220000, cannibalization: '관찰 중' },
  { channel: '복지몰', status: 'COMPLETED', sales: 52, revenue: 470000, cannibalization: '해당 없음' },
];

const meta = {
  title: 'Entities/Strategy Execution',
  component: StrategyActionCard,
  tags: ['autodocs'],
  args: { action: strategyExecutionFixtures[0].actions[0], index: 0 },
  argTypes: { action: { control: 'object' }, index: { control: 'number' } },
};
export default meta;

export const Default = {};
export const ReadyExecutingPartialCompletedFailed = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {['READY', 'EXECUTING', 'PARTIAL', 'COMPLETED', 'FAILED'].map((status) => (
        <StrategyStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};
export const MultipleActions = {
  render: () => (
    <div className="grid w-[min(1200px,calc(100vw-48px))] gap-4 md:grid-cols-2 xl:grid-cols-3">
      {strategyExecutionFixtures[1].actions.map((action, index) => (
        <StrategyActionCard
          key={action.id}
          action={action}
          index={index}
          actionNames={Object.fromEntries(strategyExecutionFixtures[1].actions.map((item) => [item.id, item.title]))}
        />
      ))}
    </div>
  ),
};
export const SequentialAndParallelActions = {
  render: () => (
    <div className="grid w-[min(1200px,calc(100vw-48px))] gap-4 md:grid-cols-2 xl:grid-cols-3">
      {strategyExecutionFixtures[0].actions.map((action, index) => (
        <StrategyActionCard key={action.id} action={action} index={index} />
      ))}
    </div>
  ),
};
export const BlockedAction = { args: { action: strategyExecutionFixtures[1].actions[2], index: 2 } };
export const LastSyncedAt = {
  render: () => <StrategySyncStatus lastSyncedAt={strategyExecutionFixtures[0].lastSyncedAt} />,
};
export const NeverSynced = {
  render: () => <StrategySyncStatus lastSyncedAt={null} />,
};
export const NoPerformanceData = { args: { action: strategyExecutionFixtures[2].actions[0], index: 0 } };
export const LongText = {
  args: {
    action: {
      ...strategyExecutionFixtures[1].actions[2],
      title: '매우 긴 이름을 가진 동부권 기업복지몰 및 관계사 임직원 전용 신규 판매 채널 확장 실행 액션',
      target: '동부권 기업복지몰과 제휴 관계사 임직원 전용 복합 판매 채널',
    },
    index: 2,
  },
};
export const MobileViewport = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (args) => (
    <div className="w-[320px]">
      <StrategyActionCard {...args} />
    </div>
  ),
};
export const EmptyState = {
  render: () => (
    <div className="w-full max-w-xl">
      <EmptyPerformanceState />
    </div>
  ),
};
export const DailySalesAreaChartInteractive = {
  render: () => (
    <div className="w-full max-w-5xl">
      <StrategyDailySalesAreaChart
        establishedAt={strategyExecutionFixtures[0].establishedAt}
        records={strategyExecutionFixtures[0].salesDaily}
        salesPointComparison={strategyExecutionFixtures[0].salesPointComparison}
      />
    </div>
  ),
};
export const InventoryComparisonHorizontalBars = {
  render: () => (
    <div className="w-full max-w-3xl rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-5">
      <StrategyInventoryComparisonBarChart results={strategyExecutionFixtures[0].inventoryResults} />
    </div>
  ),
};
export const InventoryTransferRoutes = {
  render: () => (
    <div className="w-[768px] max-w-[calc(100vw-2rem)] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-5">
      <StrategyInventoryTransferList transfers={strategyExecutionFixtures[0].inventoryTransfers} />
    </div>
  ),
};
export const InventoryTransferRoutesMobile = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <div className="w-[320px] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4">
      <StrategyInventoryTransferList transfers={strategyExecutionFixtures[0].inventoryTransfers} />
    </div>
  ),
};
export const ChannelPerformanceSingleReport = {
  render: () => (
    <div className="w-[720px] max-w-[calc(100vw-2rem)] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-5">
      <StrategyChannelPerformanceReport results={strategyExecutionFixtures[3].channelResults} />
    </div>
  ),
};
export const ChannelPerformanceTreemapReport = {
  render: () => (
    <div className="w-[720px] max-w-[calc(100vw-2rem)] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-5">
      <StrategyChannelPerformanceReport results={strategyExecutionFixtures[0].channelResults} />
    </div>
  ),
};
export const ChannelPerformanceScatterReport = {
  render: () => (
    <div className="w-[720px] max-w-[calc(100vw-2rem)] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-5">
      <StrategyChannelPerformanceReport results={scatterChannelResults} />
    </div>
  ),
};
