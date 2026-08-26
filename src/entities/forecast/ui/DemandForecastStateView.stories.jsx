import { fn } from 'storybook/test';
import { DemandForecastStateView } from './DemandForecastStateView.jsx';

const meta = {
  title: 'Entities/Forecast/Demand Forecast State',
  component: DemandForecastStateView,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '수요예측 데이터의 미적재, 만료, 조회 실패 상태를 일관된 안내 배너로 표현합니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[min(720px,calc(100vw-48px))]">
        <Story />
      </div>
    ),
  ],
  args: {
    onRetry: fn(),
  },
};

export default meta;

export const NoData = {
  args: {
    status: 'NO_DATA',
    message: '선택한 판매처에는 아직 수요예측 데이터가 적재되지 않았습니다.',
    onRetry: undefined,
  },
};

export const Stale = {
  args: {
    status: 'STALE',
    message: '예측 기준일이 오래되었습니다. 최신 동기화 결과를 확인해 주세요.',
  },
};

export const Error = {
  args: {
    status: 'ERROR',
    message: '선택한 판매처의 수요예측 API 조회에 실패했습니다.',
  },
};

export const StateGallery = {
  render: (args) => (
    <div className="space-y-3">
      <DemandForecastStateView status="NO_DATA" message="판매처를 선택하거나 예측 데이터 적재 상태를 확인해 주세요." />
      <DemandForecastStateView
        status="STALE"
        message="예측 기준일이 오래되었습니다. 최신 동기화 결과를 확인해 주세요."
        onRetry={args.onRetry}
      />
      <DemandForecastStateView
        status="ERROR"
        message="선택한 판매처의 수요예측 API 조회에 실패했습니다."
        onRetry={args.onRetry}
      />
    </div>
  ),
};
