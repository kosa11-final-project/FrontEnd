import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { getStrategyExecutionPaginationRange, StrategyExecutionPagination } from './StrategyExecutionPagination.jsx';

describe('StrategyExecutionPagination', () => {
  it('builds compact page ranges for long result sets', () => {
    expect(getStrategyExecutionPaginationRange(1, 10)).toEqual([1, 2, 3, 4, 5, 'dots-right', 10]);
    expect(getStrategyExecutionPaginationRange(6, 10)).toEqual([1, 'dots-left', 5, 6, 7, 'dots-right', 10]);
    expect(getStrategyExecutionPaginationRange(10, 10)).toEqual([1, 'dots-left', 6, 7, 8, 9, 10]);
  });

  it('shows server metadata and supports previous, next, and numbered navigation', () => {
    const onPageChange = vi.fn();
    render(
      <StrategyExecutionPagination page={2} size={10} totalElements={25} totalPages={3} onPageChange={onPageChange} />,
    );

    expect(screen.getByText('2 / 3 페이지')).toBeInTheDocument();
    expect(screen.getByText(/11–20/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2페이지' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: '이전 페이지' }));
    fireEvent.click(screen.getByRole('button', { name: '3페이지' }));
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    expect(onPageChange.mock.calls).toEqual([[1], [3], [3]]);
  });

  it('disables boundary navigation and hides controls for a single page', () => {
    const { rerender } = render(
      <StrategyExecutionPagination page={1} size={10} totalElements={25} totalPages={3} onPageChange={() => {}} />,
    );
    expect(screen.getByRole('button', { name: '이전 페이지' })).toBeDisabled();

    rerender(
      <StrategyExecutionPagination page={3} size={10} totalElements={25} totalPages={3} onPageChange={() => {}} />,
    );
    expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled();

    rerender(
      <StrategyExecutionPagination page={1} size={10} totalElements={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(screen.getByText('1 / 1 페이지')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '전략 실행 목록 페이지 이동' })).not.toBeInTheDocument();
  });

  it('does not render the pagination footer or navigation for an empty result', () => {
    const { container } = render(
      <StrategyExecutionPagination page={1} size={10} totalElements={0} totalPages={0} onPageChange={() => {}} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('navigation', { name: '전략 실행 목록 페이지 이동' })).not.toBeInTheDocument();
  });
});
