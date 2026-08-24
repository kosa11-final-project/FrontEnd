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
});
