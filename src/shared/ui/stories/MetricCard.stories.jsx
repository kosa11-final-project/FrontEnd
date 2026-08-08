import { AlertTriangle, Box, CheckCircle, Clock } from 'reicon-react';
import { MetricCard } from '@/shared/ui';

const meta = {
  title: 'Shared UI/MetricCard',
  component: MetricCard,
  tags: ['autodocs'],
  args: {
    label: '현재고',
    value: '284개',
    helper: '전체 판매처 기준',
    tone: 'neutral',
    selected: false,
  },
  argTypes: {
    icon: { description: 'Reicon 컴포넌트입니다.', control: false },
    tone: {
      description: '수치의 의미에 맞는 semantic 색상을 선택합니다.',
      control: 'select',
      options: ['neutral', 'good', 'info', 'warning', 'danger'],
      table: { defaultValue: { summary: 'neutral' } },
    },
    selected: {
      description: '현재 선택된 범위임을 표현합니다.',
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    onClick: { description: '클릭 가능한 카드로 사용할 때 연결합니다.', control: false },
  },
};

export default meta;

export const SummaryMetrics = {
  render: () => (
    <div className="grid w-full max-w-[920px] grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard label="현재고" value="284개" helper="전체 판매처 기준" icon={Box} />
      <MetricCard label="판매 가능" value="250개" helper="가용수량 기준" icon={CheckCircle} tone="good" />
      <MetricCard label="출고 예정" value="34개" helper="예약 출고 포함" icon={Clock} tone="info" />
      <MetricCard label="SKU 위험도" value="주의" helper="12개 품목 확인 필요" icon={AlertTriangle} tone="warning" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<MetricCard label="현재고" value="284개" icon={Box} />
<MetricCard label="판매 가능" value="250개" tone="good" icon={CheckCircle} />
<MetricCard label="출고 예정" value="34개" tone="info" icon={Clock} />
<MetricCard label="SKU 위험도" value="주의" tone="warning" icon={AlertTriangle} />`,
      },
    },
  },
};

export const SelectedMetric = {
  args: {
    label: '전체 재고 위치',
    value: '4,752개',
    helper: '현재 선택된 범위',
    icon: Box,
    selected: true,
    tone: 'good',
  },
};
