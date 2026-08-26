import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StrategyActionStepProgress } from './StrategyActionStepProgress.jsx';

describe('StrategyActionStepProgress', () => {
  it('renders completed, current and upcoming actions as named steps', () => {
    render(
      <StrategyActionStepProgress
        actions={[
          { id: 1, type: 'REALLOCATION', status: 'COMPLETED' },
          { id: 2, type: 'RT_TRANSFER', status: 'IN_PROGRESS', progress: 40 },
          { id: 3, type: 'CHANNEL_EXPANSION', status: 'NOT_STARTED' },
        ]}
      />,
    );

    const list = screen.getByRole('list', { name: '전략 액션 진행 단계' });
    expect(list).toBeInTheDocument();
    expect(list.parentElement).toHaveClass('w-full');
    expect(list.parentElement).not.toHaveClass(
      'rounded-[var(--radius-panel)]',
      'border',
      'shadow-[var(--shadow-soft)]',
    );
    expect(screen.getByRole('listitem', { name: '재할당: 완료' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'RT 이동: 진행 중' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: '채널 확장: 시작 전' })).toBeInTheDocument();
    expect(screen.getByText('액션')).toBeInTheDocument();
    expect(screen.getByText('실행 대상')).toBeInTheDocument();
    expect(screen.getByText('진행 정보')).toBeInTheDocument();
    expect(screen.getByText('STEP 01')).toBeInTheDocument();
    expect(screen.getByText('STEP 02')).toBeInTheDocument();
    expect(screen.getByText('STEP 03')).toBeInTheDocument();
  });

  it('keeps an explicit empty state when actions are unavailable', () => {
    render(<StrategyActionStepProgress actions={[]} />);
    expect(screen.getByText('진행 단계 미수집')).toBeInTheDocument();
  });

  it('renders one action as a compact progress row', () => {
    render(
      <StrategyActionStepProgress
        actions={[{ id: 1, type: 'RT_TRANSFER', status: 'COMPLETED', progress: 100, target: '중부센터' }]}
      />,
    );

    const step = screen.getByRole('listitem', { name: 'RT 이동: 완료' });
    expect(step).toHaveTextContent('RT 이동');
    expect(step).toHaveTextContent('완료');
    expect(step).toHaveTextContent('중부센터');
    expect(screen.getByText('완료 처리됨')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: 'RT 이동 진행률' })).not.toBeInTheDocument();
  });

  it('does not expose a backend action enum used as the title', () => {
    render(
      <StrategyActionStepProgress
        actions={[
          {
            id: 1,
            type: 'PRICE_DISCOUNT',
            title: 'PRICE_DISCOUNT',
            status: 'IN_PROGRESS',
            progress: 40,
          },
        ]}
      />,
    );

    expect(screen.getByText('할인')).toBeInTheDocument();
    expect(screen.queryByText('PRICE_DISCOUNT')).not.toBeInTheDocument();
  });

  it('uses warning and danger states without relying on a purple tone', () => {
    const { container } = render(
      <StrategyActionStepProgress
        actions={[
          { id: 1, type: 'REALLOCATION', status: 'PARTIAL', progress: 75 },
          { id: 2, type: 'RT_TRANSFER', status: 'FAILED', progress: 25 },
          { id: 3, type: 'CHANNEL_EXPANSION', status: 'BLOCKED', progress: 0 },
        ]}
      />,
    );

    expect(container.querySelector('[data-step-state="attention"]')).toBeInTheDocument();
    expect(container.querySelector('[data-step-state="problem"]')).toBeInTheDocument();
    expect(container.innerHTML).not.toContain('var(--chart-4)');
  });
});
