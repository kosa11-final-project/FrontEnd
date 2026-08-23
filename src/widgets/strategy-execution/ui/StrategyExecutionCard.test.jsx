import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { mapStrategyExecutionResponse } from '@/entities/strategy';
import { StrategyExecutionCard } from './StrategyExecutionCard.jsx';

describe('StrategyExecutionCard', () => {
  it('renders the badge, completed state, and representative KPI for a single price discount action', () => {
    const strategy = mapStrategyExecutionResponse({
      id: 355,
      number: 'DEMO-STAT-0355',
      status: 'COMPLETED',
      product: { skuId: 355, name: '정직한돈 김치 짜글이', sku: 'SKU000908', imageUrl: null },
      actions: [
        {
          id: 3551,
          type: 'PRICE_DISCOUNT',
          title: '가격 할인 실행',
          target: '모두의 맛집',
          status: 'COMPLETED',
          progress: 100,
          kpis: [{ label: '요청 수량', value: 9, unit: '개', representative: true }],
        },
      ],
    });

    const { container } = render(
      <MemoryRouter>
        <StrategyExecutionCard strategy={strategy} />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('할인').length).toBeGreaterThan(0);
    expect(screen.getByRole('listitem', { name: '할인: 완료' })).toBeInTheDocument();
    expect(screen.getByText('9개')).toBeInTheDocument();
    expect(screen.getByText('요청 수량 · 모두의 맛집')).toBeInTheDocument();
    expect(container.querySelector('[data-action-type="PRICE_DISCOUNT"]')).toHaveClass(
      'bg-[color:color-mix(in_srgb,var(--warning)_8%,var(--card))]',
    );
    expect(screen.queryByText('액션 없음')).not.toBeInTheDocument();
    expect(screen.queryByText('표시할 액션 성과가 없습니다.')).not.toBeInTheDocument();
  });
});
