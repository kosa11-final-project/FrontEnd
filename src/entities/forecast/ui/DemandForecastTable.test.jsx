import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DemandForecastTable } from './DemandForecastTable.jsx';

const forecast = {
  availableQty: 100,
  safetyStockQty: null,
  cumulativeForecast: {
    predictedQtyD7: 10,
    predictedQtyD14: 20,
    predictedQtyD30: 30,
    predictedQtyD60: 40,
    predictedQtyD90: 50,
  },
  projectedInventories: {
    projectedD7: 90,
    projectedD14: 80,
    projectedD30: 70,
    projectedD60: 60,
    projectedD90: 50,
    stockoutPeriod: '90일 이상 재고 유지',
  },
};

describe('DemandForecastTable', () => {
  it('shows forecast values while marking a missing safety baseline as unavailable', () => {
    render(<DemandForecastTable data={forecast} />);

    expect(
      screen.getByText((_, element) => element?.textContent?.replace(/\s+/g, '') === '안전재고기준:미적재'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('기준 미적재')).toHaveLength(5);
    expect(screen.getByText('10개')).toBeInTheDocument();
    expect(screen.queryByText('안전 확보')).not.toBeInTheDocument();
  });

  it('marks non-null projected quantities less than or equal to zero as depleted', () => {
    const depletedForecast = {
      availableQty: 100,
      safetyStockQty: 50,
      cumulativeForecast: {
        predictedQtyD7: 50,
        predictedQtyD14: 100,
        predictedQtyD30: 150,
        predictedQtyD60: 200,
        predictedQtyD90: 250,
      },
      projectedInventories: {
        projectedD7: 50,
        projectedD14: 0,
        projectedD30: -50,
        projectedD60: -100,
        projectedD90: -150,
        stockoutPeriod: 'D+14 소진 예상',
      },
    };

    render(<DemandForecastTable data={depletedForecast} />);

    // D+14(0개), D+30(-50개), D+60(-100개), D+90(-150개) 총 4개 구간 재고 소진
    expect(screen.getAllByText('재고 소진')).toHaveLength(4);
  });
});
