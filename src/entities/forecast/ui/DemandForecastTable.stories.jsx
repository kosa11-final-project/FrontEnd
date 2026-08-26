import { getMockDemandForecastDto } from '../testing/fixtures.js';
import { mapDemandForecastResponse } from '../model/forecastMapper.js';
import { DemandForecastTable } from './DemandForecastTable.jsx';

function createForecast(overrides = {}) {
  const fixture = getMockDemandForecastDto();
  return mapDemandForecastResponse({
    ...fixture,
    ...overrides,
    cumulativeForecast: {
      ...fixture.cumulativeForecast,
      ...overrides.cumulativeForecast,
    },
    projectedInventories: {
      ...fixture.projectedInventories,
      ...overrides.projectedInventories,
    },
  });
}

const meta = {
  title: 'Entities/Forecast/Demand Forecast Table',
  component: DemandForecastTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '예측 시점별 누적 수요와 예상 가용재고를 비교하고, 안전재고 미달과 재고 소진을 구분하는 표입니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[min(840px,calc(100vw-48px))]">
        <Story />
      </div>
    ),
  ],
  args: {
    data: createForecast(),
  },
  argTypes: {
    data: { control: false },
  },
};

export default meta;

export const ExpectedStockout = {};

export const HealthyInventory = {
  args: {
    data: createForecast({
      availableQty: 1800,
      safetyStockQty: 300,
      cumulativeForecast: {
        predictedQtyD7: 160,
        predictedQtyD14: 340,
        predictedQtyD30: 620,
        predictedQtyD60: 980,
        predictedQtyD90: 1320,
      },
      projectedInventories: {
        projectedD7: 1640,
        projectedD14: 1460,
        projectedD30: 1180,
        projectedD60: 820,
        projectedD90: 480,
        stockoutPeriod: null,
      },
    }),
  },
};

export const WithoutSafetyStock = {
  args: {
    data: createForecast({ safetyStockQty: null }),
  },
};

export const PartialForecast = {
  args: {
    data: createForecast({
      cumulativeForecast: {
        predictedQtyD60: null,
        predictedQtyD90: null,
      },
      projectedInventories: {
        projectedD60: null,
        projectedD90: null,
        stockoutPeriod: null,
      },
    }),
  },
};
