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
});
