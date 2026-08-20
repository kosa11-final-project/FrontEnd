import { StrategyActionCard } from './StrategyActionCard.jsx';
import { StrategyStatusBadge } from './StrategyStatusBadge.jsx';
import { StrategySyncStatus } from './StrategySyncStatus.jsx';
import { StrategyDailySalesAreaChart } from './StrategyDailySalesAreaChart.jsx';
import { EmptyPerformanceState } from './EmptyPerformanceState.jsx';
import { strategyExecutionFixtures } from '../testing/fixtures.js';

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
    <div className="grid w-full max-w-4xl gap-3">
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
    <div className="grid w-full max-w-4xl gap-3">
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
