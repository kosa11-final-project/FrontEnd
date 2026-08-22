import { MemoryRouter } from 'react-router-dom';
import { strategyExecutionFixtures } from '@/entities/strategy';
import { StrategyExecutionDetailContent } from './ExecutionDetailPage.jsx';
import { StrategyExecutionListContent } from './ExecutionListPage.jsx';

const meta = {
  title: 'Pages/Strategy Execution',
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
export const Default = {
  render: () => (
    <Frame>
      <StrategyExecutionListContent initialStrategies={strategyExecutionFixtures} />
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
      <StrategyExecutionListContent initialStrategies={[]} />
    </Frame>
  ),
};
export const Mobile = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => (
    <Frame>
      <StrategyExecutionListContent initialStrategies={strategyExecutionFixtures.slice(0, 1)} />
    </Frame>
  ),
};
