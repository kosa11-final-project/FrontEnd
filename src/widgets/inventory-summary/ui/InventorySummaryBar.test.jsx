import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InventorySummaryBar } from './InventorySummaryBar.jsx';

describe('InventorySummaryBar', () => {
  it('explains a timeout and lets the user retry', () => {
    const onRetry = vi.fn();

    render(<InventorySummaryBar isError error={{ code: 'REQUEST_TIMEOUT' }} onRetry={onRetry} />);

    expect(screen.getByText('요약 조회 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
