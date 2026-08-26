import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { defaultStrategyExecutionFilters } from '../model/filterState.js';
import { StrategyExecutionFilters } from './StrategyExecutionFilters.jsx';

describe('StrategyExecutionFilters', () => {
  it('shows price discount and selects it as an action filter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StrategyExecutionFilters filters={defaultStrategyExecutionFilters} resultCount={360} onChange={onChange} />,
    );

    expect(screen.getByRole('group', { name: '전략 유형' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체 전략' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '할인' }));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultStrategyExecutionFilters,
      actionType: 'PRICE_DISCOUNT',
    });
  });

  it('omits channel concentration from the action type filter', () => {
    const onChange = vi.fn();

    render(<StrategyExecutionFilters filters={defaultStrategyExecutionFilters} resultCount={0} onChange={onChange} />);

    const actionTypeGroup = screen.getByRole('group', { name: '전략 유형' });
    expect(within(actionTypeGroup).queryByRole('button', { name: '채널 집중' })).not.toBeInTheDocument();
  });
});
