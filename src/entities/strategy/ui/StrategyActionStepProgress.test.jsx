import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StrategyActionStepProgress } from './StrategyActionStepProgress.jsx';

describe('StrategyActionStepProgress', () => {
  it('renders completed, current and upcoming actions as named steps', () => {
    render(
      <StrategyActionStepProgress
        actions={[
          { id: 1, type: 'REALLOCATION', status: 'COMPLETED' },
          { id: 2, type: 'RT_TRANSFER', status: 'IN_PROGRESS' },
          { id: 3, type: 'CHANNEL_EXPANSION', status: 'NOT_STARTED' },
        ]}
      />,
    );

    expect(screen.getByRole('list', { name: '전략 액션 진행 단계' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: '재할당: 완료' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'RT 이동: 진행 중' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: '채널 확장: 시작 전' })).toBeInTheDocument();
  });

  it('keeps an explicit empty state when actions are unavailable', () => {
    render(<StrategyActionStepProgress actions={[]} />);
    expect(screen.getByText('진행 단계 미수집')).toBeInTheDocument();
  });

  it('renders one action as a compact status summary instead of an isolated step', () => {
    render(<StrategyActionStepProgress actions={[{ id: 1, type: 'RT_TRANSFER', status: 'COMPLETED' }]} />);

    const step = screen.getByRole('listitem', { name: 'RT 이동: 완료' });
    expect(step).toHaveTextContent('RT 이동');
    expect(step).toHaveTextContent('완료');
  });
});
