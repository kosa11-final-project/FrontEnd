import { fn } from 'storybook/test';
import { getMockRiskAssessmentDto } from '../testing/fixtures.js';
import { mapRiskAssessmentResponse } from '../model/riskMapper.js';
import { RiskAssessmentStateView } from './RiskAssessmentStateView.jsx';
import { RiskExplanationPanel } from './RiskExplanationPanel.jsx';
import { RiskGradeBadge } from './RiskGradeBadge.jsx';

function createRisk(overrides = {}) {
  return mapRiskAssessmentResponse({
    ...getMockRiskAssessmentDto(),
    stockCoverageDays: 18,
    ...overrides,
  });
}

const meta = {
  title: 'Entities/Risk/Risk Assessment',
  component: RiskExplanationPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '서버 위험 판정 결과의 핵심 사유, 보유 가능 일수, 안전재고 충족 여부와 세부 근거를 보여줍니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[min(760px,calc(100vw-48px))]">
        <Story />
      </div>
    ),
  ],
  args: {
    data: createRisk(),
  },
  argTypes: {
    data: { control: false },
  },
};

export default meta;

export const Caution = {};

export const Critical = {
  args: {
    data: createRisk({
      riskGrade: 'CRITICAL',
      availableQty: 80,
      safetyStockQty: 240,
      safetyGapQty: 160,
      shortageYn: 'Y',
      stockCoverageDays: 3,
      reasonMessage: '안전재고 기준 미달과 D+7 이내 재고 소진이 동시에 예상됩니다.',
      reasons: [
        {
          code: 'SAFETY_STOCK_SHORTAGE',
          message: '가용재고가 안전재고보다 160개 부족합니다.',
          severity: 'CRITICAL',
          evidence: 'availableQty=80, safetyStockQty=240, safetyGapQty=160',
        },
        {
          code: 'PREDICTED_SHORTAGE',
          message: 'D+7 이내 재고 소진이 예상됩니다.',
          severity: 'WARNING',
          evidence: 'projectedD7=0',
        },
      ],
    }),
  },
};

export const Safe = {
  args: {
    data: createRisk({
      riskGrade: 'SAFE',
      availableQty: 1600,
      safetyStockQty: 300,
      safetyGapQty: 0,
      shortageYn: 'N',
      stockCoverageDays: 74,
      reasonMessage: '예측 기간 동안 안전재고 기준을 안정적으로 충족합니다.',
      reasons: [
        {
          code: 'SUFFICIENT_STOCK',
          message: 'D+30 예상 가용재고가 안전재고 기준 이상입니다.',
          severity: 'INFO',
          evidence: 'projectedD30=980, safetyStockQty=300',
        },
      ],
    }),
  },
};

export const MissingSafetyBaseline = {
  args: {
    data: createRisk({
      riskGrade: null,
      assessmentStatus: 'UNASSESSED',
      safetyStockQty: null,
      safetyGapQty: null,
      shortageYn: null,
      stockCoverageDays: null,
      reasonMessage: '안전재고 데이터가 없어 위험도를 판정할 수 없습니다.',
      reasons: [],
    }),
  },
};

export const AssessmentStates = {
  render: () => (
    <div className="grid gap-3 md:grid-cols-2">
      <RiskAssessmentStateView status="LOADING" />
      <RiskAssessmentStateView status="REASSESSING" />
      <RiskAssessmentStateView status="UNASSESSED" />
      <RiskAssessmentStateView status="FAILED" onRetry={fn()} />
    </div>
  ),
};

export const GradeBadges = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <RiskGradeBadge grade="CRITICAL" />
      <RiskGradeBadge grade="WARNING" />
      <RiskGradeBadge grade="SAFE" />
      <RiskGradeBadge grade={null} status="UNASSESSED" showStatus />
      <RiskGradeBadge grade="WARNING" status="REASSESSING" showStatus />
    </div>
  ),
};
