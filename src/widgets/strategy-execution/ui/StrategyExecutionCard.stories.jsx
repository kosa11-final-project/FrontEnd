import { MemoryRouter } from 'react-router-dom';
import { strategyExecutionFixtures } from '@/entities/strategy';
import { StrategyExecutionCard } from './StrategyExecutionCard.jsx';

const meta = {
  title: 'Widgets/Strategy/Execution Card',
  component: StrategyExecutionCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="w-[min(1200px,calc(100vw-48px))]">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: { strategy: strategyExecutionFixtures[0] },
  argTypes: { strategy: { control: 'object' } },
};

export default meta;

export const CompactProgressList = {};

export const AttentionStates = {
  args: { strategy: strategyExecutionFixtures[1] },
};

export const Ready = {
  args: { strategy: strategyExecutionFixtures[2] },
};

export const Completed = {
  args: { strategy: strategyExecutionFixtures[3] },
};

export const SingleAction = {
  args: {
    strategy: {
      ...strategyExecutionFixtures[3],
      actions: strategyExecutionFixtures[3].actions.slice(0, 1),
    },
  },
};

export const MobileList = {
  args: { strategy: strategyExecutionFixtures[1] },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};
