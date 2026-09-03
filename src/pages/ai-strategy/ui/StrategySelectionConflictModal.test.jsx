import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StrategySelectionConflictModal } from './StrategySelectionConflictModal.jsx';

function buildConflictError(changes) {
  return {
    status: 409,
    code: 'AI_STRATEGY-028',
    details: {
      details: {
        strategyCaseId: 4057,
        optionId: 'CAND-1',
        validatedAt: '2026-08-31T16:37:54+09:00',
        changes,
      },
    },
  };
}

describe('StrategySelectionConflictModal', () => {
  it('변경된 실행 조건과 안전한 조정값을 표시하고 다시 조정을 요청한다', async () => {
    const user = userEvent.setup();
    const onReadjust = vi.fn();
    render(
      <StrategySelectionConflictModal
        error={buildConflictError([
          {
            type: 'AVAILABLE_QUANTITY_DECREASED',
            field: 'availableQuantity',
            label: 'LOT 가용재고',
            subject: { inventoryBalanceId: 31, lotId: 7, warehouseId: 2, salesPointId: 10 },
            previousValue: 42,
            currentValue: 31,
            requestedValue: 42,
            suggestedValue: 31,
            unit: '개',
            reason: 'LOT 7의 가용재고가 요청 수량보다 11개 부족합니다.',
          },
          {
            type: 'AVAILABLE_QUANTITY_DECREASED',
            field: 'actionQuantity',
            label: '전체 실행 가능 수량',
            previousValue: 42,
            currentValue: 31,
            requestedValue: 42,
            suggestedValue: 31,
            unit: '개',
            reason: '현재 실행 가능 수량이 11개 부족합니다.',
          },
        ])}
        onClose={vi.fn()}
        onReadjust={onReadjust}
        onCreateNew={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: '실행 조건 변경 내역' })).toBeInTheDocument();
    expect(screen.getByText('전체 실행 가능 수량')).toBeInTheDocument();
    expect(screen.getByText('LOT 가용재고')).toBeInTheDocument();
    expect(screen.getByText('재고 #31 · LOT #7 · 물류센터 #2 · 판매처 #10')).toBeInTheDocument();
    expect(screen.getAllByText('42개')).not.toHaveLength(0);
    expect(screen.getAllByText('31개')).not.toHaveLength(0);

    await user.click(screen.getByRole('button', { name: '최신 조건으로 다시 조정' }));

    expect(onReadjust).toHaveBeenCalledWith(
      expect.objectContaining({
        retryableWithAdjustment: true,
        suggestedAdjustments: { actionQuantity: 31 },
      }),
    );
  });

  it('자동 보정할 수 없는 구조 변경이면 다시 조정을 막고 새 전략 생성을 우선한다', async () => {
    const user = userEvent.setup();
    const onReadjust = vi.fn();
    const onCreateNew = vi.fn();
    render(
      <StrategySelectionConflictModal
        error={buildConflictError([
          {
            type: 'INVENTORY_LOCATION_CHANGED',
            field: 'sourceLocation',
            label: 'LOT 또는 출발 위치',
            previousValue: 'warehouseId=1, salesPointId=10, lotId=7',
            currentValue: 'warehouseId=2, salesPointId=10, lotId=7',
            reason: 'LOT 또는 출발 위치가 변경되었습니다.',
          },
        ])}
        onClose={vi.fn()}
        onReadjust={onReadjust}
        onCreateNew={onCreateNew}
      />,
    );

    expect(screen.getByRole('button', { name: '자동 조정 불가' })).toBeDisabled();
    expect(screen.getByText(/새 전략 생성이 필요합니다/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '새 전략 생성' }));
    expect(onCreateNew).toHaveBeenCalledOnce();
    expect(onReadjust).not.toHaveBeenCalled();
  });
});
