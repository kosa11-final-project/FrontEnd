import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InventorySummaryBar } from './InventorySummaryBar.jsx';

describe('InventorySummaryBar', () => {
  it('keeps KPI labels and status chips on one line when the cards are compressed', () => {
    render(
      <InventorySummaryBar
        summary={{
          totalCurrentQuantity: 100,
          totalAvailableQuantity: 80,
          totalReservedQuantity: 20,
          underSafetyCount: 12,
          dangerRiskCount: 4,
          cautionRiskCount: 8,
        }}
      />,
    );

    expect(screen.getByText('위험, 주의 SKU 관제')).toHaveClass('whitespace-nowrap');
    expect(screen.getByText('재고 보충 필요')).toHaveClass('whitespace-nowrap');
    expect(screen.getByText('긴급 점검 권고')).toHaveClass('whitespace-nowrap');
    expect(screen.getByText('위험 4')).toHaveClass('whitespace-nowrap');
    expect(screen.getByText('주의 8')).toHaveClass('whitespace-nowrap');
  });

  it('explains a timeout and lets the user retry', () => {
    const onRetry = vi.fn();

    render(<InventorySummaryBar isError error={{ code: 'REQUEST_TIMEOUT' }} onRetry={onRetry} />);

    expect(screen.getByText('요약 조회 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
