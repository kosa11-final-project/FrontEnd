import { getMockDemandForecastDto } from '../testing/fixtures.js';
import { mapDemandForecastResponse } from '../model/forecastMapper.js';
import { DemandForecastChart } from './DemandForecastChart.jsx';

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
    freshness: {
      ...fixture.freshness,
      ...overrides.freshness,
    },
  });
}

const healthyForecast = createForecast({
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
});

const stockoutForecast = createForecast();

const forecastWithoutSafetyStock = createForecast({
  safetyStockQty: null,
  freshness: {
    message: '예측값은 제공되지만 안전재고 기준은 아직 적재되지 않았습니다.',
  },
});

const alreadyBelowSafetyStockForecast = createForecast({
  availableQty: 120,
  safetyStockQty: 180,
  cumulativeForecast: {
    predictedQtyD7: 90,
    predictedQtyD14: 190,
    predictedQtyD30: 360,
    predictedQtyD60: 680,
    predictedQtyD90: 980,
  },
  projectedInventories: {
    projectedD7: 30,
    projectedD14: 0,
    projectedD30: 0,
    projectedD60: 0,
    projectedD90: 0,
    stockoutPeriod: '현재~D+7 소진 예상',
  },
});

const meta = {
  title: 'Entities/Forecast/Demand Forecast Chart',
  component: DemandForecastChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'SKU × 판매처의 D+7~D+90 예상 가용재고와 안전재고 기준선을 보여주는 수요예측 차트입니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[min(920px,calc(100vw-48px))] rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <Story />
      </div>
    ),
  ],
  args: {
    data: healthyForecast,
    height: 300,
  },
  argTypes: {
    data: { control: false },
    height: { control: { type: 'range', min: 220, max: 480, step: 20 } },
  },
};

export default meta;

export const HealthyInventory = {};

export const ExpectedStockout = {
  args: {
    data: stockoutForecast,
  },
};

export const AlreadyBelowSafetyStock = {
  args: {
    data: alreadyBelowSafetyStockForecast,
  },
};

export const WithoutSafetyStock = {
  args: {
    data: forecastWithoutSafetyStock,
  },
};

export const NoSelection = {
  args: {
    data: null,
  },
};

export const NoData = {
  args: {
    data: createForecast({
      status: 'NO_DATA',
      availableQty: null,
      safetyStockQty: null,
      cumulativeForecast: {
        predictedQtyD7: null,
        predictedQtyD14: null,
        predictedQtyD30: null,
        predictedQtyD60: null,
        predictedQtyD90: null,
      },
      projectedInventories: {
        projectedD7: null,
        projectedD14: null,
        projectedD30: null,
        projectedD60: null,
        projectedD90: null,
        stockoutPeriod: null,
      },
    }),
  },
};

export const Error = {
  args: {
    data: createForecast({ status: 'ERROR' }),
  },
};
