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

    const table = screen.getByRole('table', { name: '전략 실행 단계' });
    expect(table).toBeInTheDocument();
    expect(table.parentElement).toHaveClass('w-full');
    expect(table.parentElement).not.toHaveClass(
      'rounded-[var(--radius-panel)]',
      'border',
      'shadow-[var(--shadow-soft)]',
    );
    expect(screen.getByRole('row', { name: '재할당: 완료' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: 'RT 이동: 진행 중' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: '채널 확장: 시작 전' })).toBeInTheDocument();
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(4);
    headers.forEach((header) => {
      expect(header).toHaveClass('bg-[#E3EAE6]', 'border-b', 'border-[#CBD7D0]', 'text-[#374151]', 'font-semibold');
      expect(header).not.toHaveClass('bg-[#EEF3F0]');
    });
    expect(screen.getByRole('row', { name: '재할당: 완료' })).toHaveClass('bg-white');
    expect(screen.getByRole('columnheader', { name: '전략 상세' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '실행 대상' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '진행 정보' })).toBeInTheDocument();
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

    const step = screen.getByRole('row', { name: 'RT 이동: 완료' });
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
