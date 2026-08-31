import { Route, Routes } from 'react-router-dom';
import { userEvent, within } from 'storybook/test';
import { aiStrategyKeys } from '@/entities/strategy';
import { strategyGenerationFixtures } from '@/widgets/strategy-generation-list/model/strategyFixtures.js';
import { createStoryQueryClient, StorybookProductFrame } from '@/storybook/StorybookProductFrame.jsx';
import AiStrategyDetailPage from './AiStrategyDetailPage.jsx';
import AiStrategyPage from './AiStrategyPage.jsx';
import AiStrategySimulationPage from './AiStrategySimulationPage.jsx';
import { strategyDetailFixtures } from './model/strategyDetailFixtures.js';

const listItems = strategyGenerationFixtures.map((fixture) => ({
  id: fixture.id,
  strategyNumber: fixture.strategyNumber,
  strategyName: fixture.strategyName,
  caseStatus: fixture.generationStatus,
  generationStage: fixture.generationStage,
  recommendationOutcome: fixture.id === 32 ? 'OPTIONS_GENERATED' : null,
  category: fixture.category,
  product: fixture.product,
  requester: { userId: 7, userName: '김영만 수석 MD' },
  createdAt: fixture.createdAt,
  completedAt: fixture.generationStatus === 'GENERATED' ? fixture.createdAt : null,
  resultExpiresAt: null,
  failure: fixture.failure
    ? {
        code: null,
        summary: fixture.failure.summary,
        failedAt: fixture.failure.failedAt,
      }
    : null,
}));

const reviewers = [
  {
    reviewerId: 101,
    reviewerName: '박지현',
    email: 'jihyun.park@example.com',
    organizationName: '현대그린푸드',
    roleName: '물류 운영 팀장',
  },
  {
    reviewerId: 102,
    reviewerName: '이준호',
    email: 'junho.lee@example.com',
    organizationName: '현대그린푸드',
    roleName: '상품기획 팀장',
  },
];

const generatedDetailTemplate = strategyDetailFixtures.find((fixture) => fixture.strategyCaseId === 32);
const strategyDetails = [
  ...strategyDetailFixtures,
  ...listItems
    .filter((item) => item.caseStatus === 'GENERATED')
    .filter((item) => !strategyDetailFixtures.some((fixture) => fixture.strategyCaseId === item.id))
    .map((item) => ({
      ...generatedDetailTemplate,
      strategyCaseId: item.id,
      caseCode: item.strategyNumber,
      caseName: item.strategyName,
      sku: {
        ...generatedDetailTemplate.sku,
        skuId: item.product.skuId,
        skuCode: item.product.skuCode,
        skuName: item.product.name,
        imageUrl: item.product.imageUrl,
      },
      requestedBy: item.requester,
      requestedAt: item.createdAt,
      completedAt: item.completedAt,
      resultExpiresAt: null,
    })),
];

function listResponse(status = 'ALL') {
  const content = listItems.filter((item) => status === 'ALL' || item.caseStatus === status);
  const pageSize = 10;
  return {
    content: content.slice(0, pageSize),
    statusCounts: {
      all: listItems.length,
      generated: listItems.filter((item) => item.caseStatus === 'GENERATED').length,
      generating: listItems.filter((item) => item.caseStatus === 'GENERATING').length,
      generationFailed: listItems.filter((item) => item.caseStatus === 'GENERATION_FAILED').length,
    },
    page: 0,
    size: pageSize,
    totalElements: content.length,
    totalPages: Math.max(1, Math.ceil(content.length / pageSize)),
    first: true,
    last: content.length <= pageSize,
  };
}

function createStrategyStoryClient() {
  return createStoryQueryClient((client) => {
    ['ALL', 'GENERATED', 'GENERATING', 'GENERATION_FAILED'].forEach((status) => {
      client.setQueryData(
        aiStrategyKeys.list({ page: 0, size: 10, status, sort: 'createdAt,desc' }),
        listResponse(status),
      );
    });

    strategyDetails.forEach((fixture) => {
      client.setQueryData(aiStrategyKeys.detail(fixture.strategyCaseId), fixture);
    });
    client.setQueryData(aiStrategyKeys.reviewers(), reviewers);
  });
}

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
    <StorybookProductFrame path={path} minHeight="980px" queryClient={createStrategyStoryClient()}>
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
