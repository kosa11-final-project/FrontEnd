import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_INVENTORY_FILTERS } from '../model/filterState.js';
import { InventoryFilterModal } from './InventoryFilterModal.jsx';

describe('InventoryFilterModal', () => {
  it('applies the selected AND/OR operator with the detailed filters', () => {
    const onApply = vi.fn();

    render(
      <InventoryFilterModal
        open
        filters={DEFAULT_INVENTORY_FILTERS}
        filterOptions={{
          categories: [],
          storageTypes: [{ code: 'FROZEN', name: '냉동' }],
          riskGrades: [{ code: 'DANGER', name: '위험' }],
          warehouses: [],
          salesPoints: [],
          assessmentStatuses: [],
        }}
        onClose={vi.fn()}
        onApply={onApply}
      />,
    );

    expect(screen.getByRole('button', { name: '모든 조건 만족 (AND)' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '하나 이상 만족 (OR)' }));
    fireEvent.click(screen.getByRole('button', { name: '위험' }));
    fireEvent.click(screen.getByRole('button', { name: /필터 적용하기/ }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        filterOperator: 'OR',
        riskGrade: ['DANGER'],
      }),
    );
  });
});
