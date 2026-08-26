import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DemandForecastReplenishmentAlert } from './DemandForecastReplenishmentAlert.jsx';

const crossing = {
  expectedLabel: 'D+22',
  recommendation: {
    variant: 'warning',
    title: '안전재고 도달 예정',
    message: 'D+22일 후 안전재고에 도달할 것으로 예상됩니다. 발주·이관·입고요청을 검토하세요.',
    actions: ['발주', '이관', '입고요청'],
  },
};

describe('DemandForecastReplenishmentAlert', () => {
  it('shows the crossing day and the same replenishment actions in the alert', () => {
    render(<DemandForecastReplenishmentAlert crossing={crossing} />);

    expect(screen.getByRole('alert')).toHaveTextContent('D+22일 후');
    expect(screen.getByRole('alert')).toHaveTextContent('발주·이관·입고요청');
    expect(screen.getByRole('alert')).toHaveTextContent('권장 조치: 발주 · 이관 · 입고요청');
  });

  it('renders nothing when no crossing has been calculated', () => {
    const { container } = render(<DemandForecastReplenishmentAlert crossing={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
