import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildInventoryComparisonChartData,
  InventoryValueLabel,
  StrategyInventoryComparisonBarChart,
} from './StrategyInventoryComparisonBarChart.jsx';

const results = [
  { location: '경기 광주센터', before: 2310, moved: -480, after: 1830, guardrail: '안전재고 유지' },
  { location: '그리팅몰', before: 190, moved: 480, after: 670, guardrail: '가용재고 증가' },
];

describe('StrategyInventoryComparisonBarChart', () => {
  it('normalizes numeric values without replacing missing results with zero', () => {
    expect(buildInventoryComparisonChartData([...results, { location: '동부센터', before: 34, after: null }])).toEqual([
      expect.objectContaining({ location: '경기 광주센터', before: 2310, moved: -480, after: 1830 }),
      expect.objectContaining({ location: '그리팅몰', before: 190, moved: 480, after: 670 }),
      expect.objectContaining({ location: '동부센터', before: 34, moved: null, after: null }),
    ]);
  });

  it('renders an accessible horizontal comparison chart and text alternative', () => {
    render(<StrategyInventoryComparisonBarChart results={results} />);

    expect(screen.getByRole('img', { name: '위치별 재고 변화 비교 가로 막대 차트' })).toBeInTheDocument();
    expect(screen.getByLabelText('차트 범례')).toHaveTextContent('전략 시작');
    expect(screen.getByLabelText('차트 범례')).toHaveTextContent('현재 재고');
    expect(
      screen.getByText(/경기 광주센터: 전략 시작 2,310개, 현재 재고 1,830개, 재고 증감 -480개/),
    ).toBeInTheDocument();
  });

  it('does not render an empty chart when no comparable inventory value exists', () => {
    const { container } = render(
      <StrategyInventoryComparisonBarChart results={[{ location: '미수집 위치', before: null, after: null }]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders inventory values inside long bars and beside zero-length bars', () => {
    const { rerender } = render(
      <svg>
        <InventoryValueLabel x={10} y={4} width={80} height={18} value={156} />
      </svg>,
    );

    expect(screen.getByText('156개')).toHaveAttribute('text-anchor', 'end');
    expect(screen.getByText('156개')).toHaveAttribute('x', '84');

    rerender(
      <svg>
        <InventoryValueLabel x={10} y={4} width={0} height={18} value={0} />
      </svg>,
    );
    expect(screen.getByText('0개')).toHaveAttribute('text-anchor', 'start');
    expect(screen.getByText('0개')).toHaveAttribute('x', '16');
  });
});
