import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SimulationResultTable } from './StrategySimulationView.jsx';

const strategyCase = {
  baselineSimulation: {
    summary: {
      expectedSalesQty: 10,
    },
  },
};

function option(expectedSalesQty, incrementalSalesQty = expectedSalesQty - 10) {
  return {
    optionName: '재고 재할당 전략',
    simulationSummary: {
      expectedSalesQty,
      comparisonToBaseline: {
        incrementalSalesQty,
      },
    },
  };
}

describe('SimulationResultTable', () => {
  it('초기에는 사용자 조정값을 AI 추천값과 동일하게 표시한다', () => {
    const recommendedOption = option(20);

    render(
      <SimulationResultTable
        strategyCase={strategyCase}
        recommendedOption={recommendedOption}
        adjustedOption={recommendedOption}
      />,
    );

    expect(screen.getByRole('columnheader', { name: '사용자 조정값' })).toBeInTheDocument();
    expect(screen.getAllByText('20개')).toHaveLength(2);
    const row = screen.getByRole('row', { name: /\uC608\uC0C1 \uD310\uB9E4\uB7C9/ });
    expect(within(row).getByText('AI 추천과 동일')).toBeInTheDocument();
  });

  it('조정 시뮬레이션 완료 후 사용자 조정값과 기준 대비값을 갱신한다', () => {
    render(
      <SimulationResultTable
        strategyCase={strategyCase}
        recommendedOption={option(20)}
        adjustedOption={option(25)}
        adjustmentApplied
      />,
    );

    const row = screen.getByRole('row', { name: /\uC608\uC0C1 \uD310\uB9E4\uB7C9/ });
    expect(within(row).getByText('20개')).toBeInTheDocument();
    expect(within(row).getByText('25개')).toBeInTheDocument();
    expect(within(row).getByText('+15개')).toBeInTheDocument();
    expect(within(row).getByText('조정 시뮬레이션 반영')).toBeInTheDocument();
  });
});
