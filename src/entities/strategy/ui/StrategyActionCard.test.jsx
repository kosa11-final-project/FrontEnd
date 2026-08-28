import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StrategyActionCard } from './StrategyActionCard.jsx';

const action = {
  id: 1,
  type: 'PRICE_DISCOUNT',
  title: 'PRICE_DISCOUNT',
  target: '모두의 맛집',
  relationship: null,
  dependsOn: [],
  status: 'COMPLETED',
  progress: 100,
  kpis: [],
};

describe('StrategyActionCard', () => {
  it('replaces a raw action type title with its user-facing label', () => {
    render(<StrategyActionCard action={action} index={0} />);

    expect(screen.getByRole('heading', { name: '가격 할인' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'PRICE_DISCOUNT' })).not.toBeInTheDocument();
  });

  it('keeps a descriptive backend title', () => {
    render(<StrategyActionCard action={{ ...action, title: '주말 특가 할인 실행' }} index={0} />);

    expect(screen.getByRole('heading', { name: '주말 특가 할인 실행' })).toBeInTheDocument();
  });

  it('places the request quantity in the card header and keeps other KPIs below', () => {
    render(
      <StrategyActionCard
        action={{
          ...action,
          kpis: [
            { label: '요청 수량', value: 13.4, unit: '개' },
            { label: '완료 수량', value: 10, unit: '개' },
          ],
        }}
        index={0}
      />,
    );

    const requestQuantity = screen.getByText('요청 수량').closest('dl');
    expect(requestQuantity.closest('header')).toBeInTheDocument();
    expect(requestQuantity).toHaveTextContent('13.4개');
    expect(screen.getByText('완료 수량').closest('header')).not.toBeInTheDocument();
  });
});
