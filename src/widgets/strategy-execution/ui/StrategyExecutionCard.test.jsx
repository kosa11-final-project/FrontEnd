import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { mapStrategyExecutionResponse } from '@/entities/strategy';
import { StrategyExecutionCard } from './StrategyExecutionCard.jsx';

describe('StrategyExecutionCard', () => {
  it('renders a compact summary and expands action steps on request', async () => {
    const user = userEvent.setup();
    const strategy = mapStrategyExecutionResponse({
      id: 355,
      number: 'DEMO-STAT-0355',
      status: 'COMPLETED',
      product: { skuId: 355, name: '정직한돈 김치 짜글이', sku: 'SKU000908', imageUrl: null },
      resultSummary: '실제 판매 120 / 목표 100 (달성률 120%)',
      performance: { actualSalesQuantity: 120 },
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

    render(
      <MemoryRouter>
        <StrategyExecutionCard strategy={strategy} />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('할인').length).toBeGreaterThan(0);
    const footer = screen.getByText('최근 동기화 이력 없음').closest('footer');
    expect(within(footer).getByRole('link', { name: '상세 리포트' })).toHaveAttribute('href', '/execution/355');
    expect(within(footer).getByRole('button', { name: '실행 단계 보기' })).toBeInTheDocument();
    const salesPerformance = screen.getByRole('region', { name: '판매 성과 요약' });
    expect(within(salesPerformance).getByText('120개')).toBeInTheDocument();
    expect(within(salesPerformance).getByText('100개')).toBeInTheDocument();
    expect(within(salesPerformance).getByText('120%')).toBeInTheDocument();
    expect(salesPerformance).toHaveTextContent('목표 달성');
    expect(salesPerformance).not.toHaveTextContent('목표보다 20개 더 판매했어요');
    expect(screen.queryByRole('listitem', { name: '할인: 완료' })).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: '판매 성과 비교 설명' })).toHaveAttribute(
      'aria-description',
      '목표보다 20개 더 판매했어요',
    );

    await user.click(screen.getByRole('button', { name: '실행 단계 보기' }));

    expect(screen.getByRole('listitem', { name: '할인: 완료' })).toBeInTheDocument();
    const expandedSection = screen.getByRole('region', { name: '정직한돈 김치 짜글이 실행 단계' });
    expect(expandedSection).toHaveClass('border-t');
    expect(expandedSection).not.toHaveClass('p-3', 'bg-[var(--surface-subtle)]');
    expect(screen.getByText('모두의 맛집')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: '할인 진행률' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '실행 단계 닫기' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('region', { name: '주요 전략 지표' })).not.toBeInTheDocument();
    expect(screen.queryByText('액션 없음')).not.toBeInTheDocument();
  });

  it('calculates an unmet target from the existing sales result and exposes its explanation as a tooltip', () => {
    const strategy = mapStrategyExecutionResponse({
      id: 356,
      status: 'EXECUTING',
      product: { name: '판매 중인 상품', sku: 'SKU000909' },
      resultSummary: '실제 판매 80 / 목표 100',
      actions: [],
    });

    render(
      <MemoryRouter>
        <StrategyExecutionCard strategy={strategy} />
      </MemoryRouter>,
    );

    const salesPerformance = screen.getByRole('region', { name: '판매 성과 요약' });
    expect(within(salesPerformance).getByText('80개')).toBeInTheDocument();
    expect(within(salesPerformance).getByText('100개')).toBeInTheDocument();
    expect(within(salesPerformance).getByText('80%')).toBeInTheDocument();
    expect(salesPerformance).not.toHaveTextContent('목표보다 20개 덜 판매했어요');
    expect(salesPerformance).toHaveTextContent('목표 미달');
    expect(screen.queryByText('목표 달성')).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: '판매 성과 비교 설명' })).toHaveAttribute(
      'aria-description',
      '목표보다 20개 덜 판매했어요',
    );
  });

  it('does not expose an internal UUID-based strategy case code', () => {
    const internalNumber = 'SC-c57fa559f43a4163a57dd6f48d9bb537';
    const strategy = mapStrategyExecutionResponse({
      id: 357,
      number: internalNumber,
      status: 'READY',
      product: { name: '치즈쫄우 떡볶이', sku: 'SKU002562' },
      actions: [],
    });

    render(
      <MemoryRouter>
        <StrategyExecutionCard strategy={strategy} />
      </MemoryRouter>,
    );

    expect(screen.queryByText(internalNumber)).not.toBeInTheDocument();
  });
});
