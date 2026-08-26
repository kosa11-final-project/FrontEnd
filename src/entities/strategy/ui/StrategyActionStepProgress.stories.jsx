import { strategyExecutionFixtures } from '../testing/fixtures.js';
import { StrategyActionStepProgress } from './StrategyActionStepProgress.jsx';

const meta = {
  title: 'Entities/Strategy Action Progress List',
  component: StrategyActionStepProgress,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[min(900px,calc(100vw-48px))] bg-[var(--card)] p-4">
        <Story />
      </div>
    ),
  ],
  args: { actions: strategyExecutionFixtures[0].actions },
  argTypes: { actions: { control: 'object' } },
};

export default meta;

export const Default = {};

export const AttentionStates = {
  args: { actions: strategyExecutionFixtures[1].actions },
};

export const Ready = {
  args: { actions: strategyExecutionFixtures[2].actions },
};

export const SingleRow = {
  args: { actions: strategyExecutionFixtures[3].actions.slice(0, 1) },
};

export const Empty = {
  args: { actions: [] },
};

export const Mobile = {
  args: { actions: strategyExecutionFixtures[1].actions },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div className="w-[320px] bg-[var(--card)] p-3">
        <Story />
      </div>
    ),
  ],
};
