import { render, screen } from '@testing-library/react';
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

    const actionTypeSelect = screen.getByRole('combobox', { name: '전략 유형' });
    expect(actionTypeSelect).toHaveTextContent('전체 전략 유형');

    await user.click(actionTypeSelect);
    await user.click(screen.getByRole('option', { name: '가격 할인' }));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultStrategyExecutionFilters,
      actionType: 'PRICE_DISCOUNT',
    });
  });

  it('omits channel concentration from the action type filter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<StrategyExecutionFilters filters={defaultStrategyExecutionFilters} resultCount={0} onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: '전략 유형' }));
    expect(screen.queryByRole('option', { name: '채널 집중' })).not.toBeInTheDocument();
  });

  it('resets the search query and every filter together', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StrategyExecutionFilters
        filters={{ query: '왕교자', actionType: 'RT_TRANSFER', strategyStatus: 'EXECUTING' }}
        resultCount={1}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: '초기화' }));

    expect(onChange).toHaveBeenCalledWith(defaultStrategyExecutionFilters);
    expect(screen.getByLabelText('전략 번호 또는 상품명 검색')).toHaveValue('');
  });
});
