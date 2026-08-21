import { MemoryRouter } from 'react-router-dom';
import { strategyExecutionFixtures } from '@/entities/strategy';
import { StrategyExecutionCard } from './StrategyExecutionCard.jsx';

const meta = {
  title: 'Widgets/Strategy Execution Card',
  component: StrategyExecutionCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="w-full max-w-5xl">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: { strategy: strategyExecutionFixtures[0] },
  argTypes: { strategy: { control: 'object' } },
};
export default meta;
export const Default = {};
export const MultipleActions = { args: { strategy: strategyExecutionFixtures[1] } };
export const NoPerformanceData = { args: { strategy: strategyExecutionFixtures[2] } };
export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="w-[320px]">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};
