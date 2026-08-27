import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_INVENTORY_FILTERS } from '../model/filterState.js';
import { InventoryFilterModal } from './InventoryFilterModal.jsx';

describe('InventoryFilterModal', () => {
  it('leaves the external AND/OR operator outside the detailed filter modal', () => {
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

    expect(screen.queryByRole('group', { name: '필터 조건 결합 방식' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '위험' }));
    fireEvent.click(screen.getByRole('button', { name: /필터 적용하기/ }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        riskGrade: ['DANGER'],
      }),
    );
    expect(onApply.mock.lastCall[0]).not.toHaveProperty('filterOperator');
  });

  it('keeps storage and risk selections multi-valued', () => {
    const onApply = vi.fn();

    render(
      <InventoryFilterModal
        open
        filters={DEFAULT_INVENTORY_FILTERS}
        filterOptions={{
          categories: [],
          storageTypes: [
            { code: 'FROZEN', name: '냉동' },
            { code: 'ROOM_TEMP', name: '상온' },
          ],
          riskGrades: [
            { code: 'NORMAL', name: '보통' },
            { code: 'CAUTION', name: '주의' },
          ],
          warehouses: [],
          salesPoints: [],
          regions: [],
          assessmentStatuses: [],
        }}
        onClose={vi.fn()}
        onApply={onApply}
      />,
    );

    expect(screen.getByText(/보관유형/)).toBeInTheDocument();
    expect(screen.getAllByText('(복수 선택 가능)')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '냉동' }).parentElement).toHaveClass('flex-nowrap');
    expect(screen.getByRole('button', { name: '보통' }).parentElement).toHaveClass('flex-nowrap');
    expect(screen.getByText('재고 부족 상품 포함여부')).toHaveClass('whitespace-nowrap');

    fireEvent.click(screen.getByRole('button', { name: '냉동' }));
    fireEvent.click(screen.getByRole('button', { name: '상온' }));
    fireEvent.click(screen.getByRole('button', { name: '보통' }));
    fireEvent.click(screen.getByRole('button', { name: '주의' }));
    fireEvent.click(screen.getByRole('button', { name: /필터 적용하기/ }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        storageType: ['FROZEN', 'ROOM_TEMP'],
        riskGrade: ['NORMAL', 'CAUTION'],
      }),
    );
  });

  it('clears every selected filter from the summary with one action', () => {
    const onApply = vi.fn();

    render(
      <InventoryFilterModal
        open
        filters={DEFAULT_INVENTORY_FILTERS}
        filterOptions={{
          categories: [],
          storageTypes: [
            { code: 'FROZEN', name: '냉동' },
            { code: 'ROOM_TEMP', name: '상온' },
          ],
          riskGrades: [{ code: 'CAUTION', name: '주의' }],
          warehouses: [],
          salesPoints: [],
          regions: [],
          assessmentStatuses: [],
        }}
        onClose={vi.fn()}
        onApply={onApply}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '냉동' }));
    fireEvent.click(screen.getByRole('button', { name: '주의' }));

    expect(screen.getByText('2개 선택')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '조건 초기화' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '선택된 필터 일괄 해제' }));

    expect(screen.queryByText('2개 선택')).not.toBeInTheDocument();
    expect(screen.getByText('필터를 선택하면 이곳에 모두 함께 표시됩니다.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /필터 적용하기/ }));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryIds: [],
        storageType: [],
        riskGrade: [],
        warehouseCode: [],
        salesPointCode: [],
        shortageYn: '',
      }),
    );
  });

  it('allows multiple warehouses and sales points and combines them in the selected filter summary', () => {
    const onApply = vi.fn();

    render(
      <InventoryFilterModal
        open
        filters={DEFAULT_INVENTORY_FILTERS}
        filterOptions={{
          categories: [],
          storageTypes: [],
          riskGrades: [],
          warehouses: [
            { code: 'GYEONGIN_1', name: '경인1센터' },
            { code: 'SEOUL', name: '서울센터' },
          ],
          salesPoints: [
            { code: 'PANGYO', name: '판교점' },
            { code: 'SUJI', name: '수지점' },
          ],
          regions: [],
          assessmentStatuses: [],
        }}
        onClose={vi.fn()}
        onApply={onApply}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '물류센터(미할당 재고) 선택' }));
    expect(screen.getByRole('listbox', { name: '물류센터(미할당 재고) 목록' })).toHaveClass('top-full', 'bottom-auto');
    fireEvent.click(screen.getByRole('option', { name: '경인1센터' }));
    fireEvent.click(screen.getByRole('option', { name: '서울센터' }));
    fireEvent.click(screen.getByRole('button', { name: '상세 판매처 선택' }));
    fireEvent.click(screen.getByRole('option', { name: '판교점' }));
    fireEvent.click(screen.getByRole('option', { name: '수지점' }));

    expect(screen.getByRole('button', { name: '물류센터(미할당 재고) 선택' })).toHaveTextContent('경인1센터, 서울센터');
    expect(screen.getByRole('button', { name: '상세 판매처 선택' })).toHaveTextContent('판교점, 수지점');
    expect(screen.getByText('선택된 필터')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '경인1센터 필터 해제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '서울센터 필터 해제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '판교점 필터 해제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수지점 필터 해제' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /필터 적용하기/ }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        warehouseCode: ['GYEONGIN_1', 'SEOUL'],
        salesPointCode: ['PANGYO', 'SUJI'],
      }),
    );
  });

  it('scrolls the opened multi-select list into view', async () => {
    const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView');

    try {
      render(
        <InventoryFilterModal
          open
          filters={DEFAULT_INVENTORY_FILTERS}
          filterOptions={{
            categories: [],
            storageTypes: [],
            riskGrades: [],
            warehouses: [{ code: 'GYEONGIN_1', name: '경인1센터' }],
            salesPoints: [],
            regions: [],
            assessmentStatuses: [],
          }}
          onClose={vi.fn()}
          onApply={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: '물류센터(미할당 재고) 선택' }));

      await vi.waitFor(() => {
        expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
      });
    } finally {
      scrollIntoViewSpy.mockRestore();
    }
  });

  it('keeps one category per parent branch while allowing another root branch', () => {
    const onApply = vi.fn();
    const categories = [
      { code: '1', name: '간편식/메인요리', categoryLevel: 1 },
      { code: '2', name: '부침/전', categoryLevel: 2, parentCode: '1' },
      { code: '3', name: '부침', categoryLevel: 3, parentCode: '2' },
      { code: '9', name: '김치전', categoryLevel: 3, parentCode: '2' },
      { code: '4', name: '육류요리', categoryLevel: 2, parentCode: '1' },
      { code: '5', name: '갈비', categoryLevel: 3, parentCode: '4' },
      { code: '6', name: '생활/주방', categoryLevel: 1 },
      { code: '7', name: '생활용품', categoryLevel: 2, parentCode: '6' },
      { code: '8', name: '수세미', categoryLevel: 3, parentCode: '7' },
    ];

    render(
      <InventoryFilterModal
        open
        filters={DEFAULT_INVENTORY_FILTERS}
        filterOptions={{
          categories,
          storageTypes: [],
          riskGrades: [],
          warehouses: [],
          salesPoints: [],
          regions: [],
          assessmentStatuses: [],
        }}
        onClose={vi.fn()}
        onApply={onApply}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '간편식/메인요리' }));
    fireEvent.click(screen.getByRole('button', { name: '생활/주방' }));

    expect(screen.queryByRole('button', { name: '선택 해제' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /간편식\/메인요리 선택 해제/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /생활\/주방 선택 해제/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '간편식/메인요리' }));
    fireEvent.click(screen.getByRole('button', { name: '부침/전' }));
    fireEvent.click(screen.getByRole('button', { name: '부침' }));
    fireEvent.click(screen.getByRole('button', { name: '김치전' }));

    expect(
      screen.queryByRole('button', { name: /간편식\/메인요리 › 부침\/전 › 부침 선택 해제/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /간편식\/메인요리 › 부침\/전 › 김치전 선택 해제/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '육류요리' }));
    fireEvent.click(screen.getByRole('button', { name: '갈비' }));

    expect(
      screen.queryByRole('button', { name: /간편식\/메인요리 › 부침\/전 › 부침 선택 해제/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /간편식\/메인요리 › 육류요리 › 갈비 선택 해제/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '생활/주방' }));
    fireEvent.click(screen.getByRole('button', { name: '생활용품' }));
    fireEvent.click(screen.getByRole('button', { name: '수세미' }));

    expect(screen.getByRole('button', { name: /간편식\/메인요리 › 육류요리 › 갈비 선택 해제/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /생활\/주방 › 생활용품 › 수세미 선택 해제/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /필터 적용하기/ }));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryIds: ['5', '8'],
        categoryId: '5',
      }),
    );
  });

  it('does not show or apply the removed sales-point region filter', () => {
    const onApply = vi.fn();

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
          regions: [{ code: 'GYEONGGI', name: '경기권' }],
          assessmentStatuses: [],
        }}
        onClose={vi.fn()}
        onApply={onApply}
      />,
    );

    expect(screen.queryByLabelText('판매처 권역')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /필터 적용하기/ }));
    expect(onApply.mock.lastCall[0]).not.toHaveProperty('regionCode');
  });

  it('does not show the removed assessment status filter', () => {
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

    expect(screen.queryByText('위험 판정 상태')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '판정 완료' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '미판정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '판정 만료' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '판정 실패' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '재판정 중' })).not.toBeInTheDocument();
  });

  it('applies the inventory shortage filter', () => {
    const onApply = vi.fn();

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
          assessmentStatuses: [],
        }}
        onClose={vi.fn()}
        onApply={onApply}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: '재고 부족 상품 포함여부' }));
    fireEvent.click(screen.getByRole('button', { name: /필터 적용하기/ }));

    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ shortageYn: 'Y' }));
  });

  it('does not allow the shortage filter to change while filter options are loading', () => {
    render(
      <InventoryFilterModal
        open
        filters={DEFAULT_INVENTORY_FILTERS}
        filterOptions={undefined}
        isFilterOptionsLoading
        onClose={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    expect(screen.getByRole('checkbox', { name: '재고 부족 상품 포함여부' })).toBeDisabled();
  });
});
