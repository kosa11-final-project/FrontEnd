import { Route, Routes } from 'react-router-dom';
import { userEvent, within } from 'storybook/test';
import AiStrategyDetailPage from './AiStrategyDetailPage.jsx';
import AiStrategyPage from './AiStrategyPage.jsx';
import AiStrategySimulationPage from './AiStrategySimulationPage.jsx';
import { StorybookProductFrame } from '@/storybook/StorybookProductFrame.jsx';

function StrategyRoutes() {
  return (
    <Routes>
      <Route path="/ai-strategy" element={<AiStrategyPage />} />
      <Route path="/ai-strategy/:strategyCaseId/simulation" element={<AiStrategySimulationPage />} />
      <Route path="/ai-strategy/:strategyCaseId" element={<AiStrategyDetailPage />} />
    </Routes>
  );
}

function StrategyProductPreview({ path }) {
  return (
    <StorybookProductFrame path={path} minHeight="980px">
      <StrategyRoutes />
    </StorybookProductFrame>
  );
}

const meta = {
  title: 'Pages/AI Strategy',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'AI 전략 생성 목록부터 생성 상태 상세, 전략 대안 비교, 조건 조정형 시뮬레이션까지 실제 라우트 뎁스를 하나의 제품 프레임에서 검토합니다.',
      },
    },
  },
};

export default meta;

export const StrategyGenerationList = {
  render: () => <StrategyProductPreview path="/ai-strategy" />,
};

export const StrategyGenerationInProgress = {
  render: () => <StrategyProductPreview path="/ai-strategy?status=GENERATING" />,
};

export const StrategyGenerationFailure = {
  render: () => <StrategyProductPreview path="/ai-strategy?status=GENERATION_FAILED" />,
};

export const GeneratedStrategyComparison = {
  render: () => <StrategyProductPreview path="/ai-strategy/32" />,
};

export const StrategySimulation = {
  render: () => <StrategyProductPreview path="/ai-strategy/32/simulation?option=opt-transfer-discount" />,
};

export const StrategySimulationFinancialView = {
  render: () => <StrategyProductPreview path="/ai-strategy/32/simulation?option=opt-channel-expansion" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const financeTab = canvas.queryByRole('tab', { name: '공헌이익' });
    if (financeTab) await userEvent.click(financeTab);
  },
};

export const ExpiredStrategyResult = {
  render: () => <StrategyProductPreview path="/ai-strategy/999" />,
};

export const ListToComparisonFlow = {
  render: () => <StrategyProductPreview path="/ai-strategy" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const action = canvas.queryByRole('button', { name: /ST-2026-032 비교·시뮬레이션으로 이동/ });
    if (action) await userEvent.click(action);
  },
};
