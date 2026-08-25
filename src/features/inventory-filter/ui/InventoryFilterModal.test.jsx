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
          regions: [],
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

  it('applies and resets the sales-point region filter', () => {
    const onApply = vi.fn();

    const { rerender } = render(
      <InventoryFilterModal
        open
        filters={DEFAULT_INVENTORY_FILTERS}
        filterOptions={{
          categories: [],
          storageTypes: [],
          riskGrades: [],
          warehouses: [],
          salesPoints: [],
          regions: [{ code: 'GYEONGGI', name: '경기권' }],
          assessmentStatuses: [],
        }}
        onClose={vi.fn()}
        onApply={onApply}
      />,
    );

    expect(screen.getByLabelText('판매처 권역')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('판매처 권역'), { target: { value: 'GYEONGGI' } });
    fireEvent.click(screen.getByRole('button', { name: /필터 적용하기/ }));
    expect(onApply).toHaveBeenLastCalledWith(expect.objectContaining({ regionCode: ['GYEONGGI'] }));

    rerender(
      <InventoryFilterModal
        open
        filters={{ ...DEFAULT_INVENTORY_FILTERS, regionCode: ['GYEONGGI'] }}
        filterOptions={{
          categories: [],
          storageTypes: [],
          riskGrades: [],
          warehouses: [],
          salesPoints: [],
          regions: [{ code: 'GYEONGGI', name: '경기권' }],
          assessmentStatuses: [],
        }}
        onClose={vi.fn()}
        onApply={onApply}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '조건 초기화' }));
    fireEvent.click(screen.getByRole('button', { name: /필터 적용하기/ }));
    expect(onApply).toHaveBeenLastCalledWith(expect.objectContaining({ regionCode: [] }));
  });

  it('does not show assessment statuses that inventory rows cannot produce', () => {
    render(
      <InventoryFilterModal
        open
        filters={DEFAULT_INVENTORY_FILTERS}
        filterOptions={{
          categories: [],
          storageTypes: [],
          riskGrades: [],
          warehouses: [],
          salesPoints: [],
          regions: [],
          assessmentStatuses: [
            { code: 'ASSESSED', name: '판정 완료' },
            { code: 'UNASSESSED', name: '미판정' },
            { code: 'STALE', name: '판정 만료' },
            { code: 'FAILED', name: '판정 실패' },
            { code: 'REASSESSING', name: '재판정 중' },
          ],
        }}
        onClose={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '판정 완료' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '미판정' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '판정 만료' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '판정 실패' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '재판정 중' })).not.toBeInTheDocument();
  });
});
