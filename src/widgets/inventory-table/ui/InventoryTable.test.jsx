import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InventoryTable } from './InventoryTable.jsx';

const item = {
  rowId: 'SKU-1',
  productName: '테스트 상품',
  supplierName: '테스트 공급사',
  skuCode: 'SKU-1',
  skuName: '규격',
  categoryName: '베이커리',
  storageType: 'ROOM_TEMP',
  storageName: '상온',
  currentQuantity: 10,
  availableQuantity: 8,
  reservedQuantity: 2,
  salesPoints: [
    {
      salesPointCode: 'STORE-1',
      salesPointName: '판매처 1',
      channelType: 'GREETING',
      currentQuantity: 10,
      availableQuantity: 8,
      reservedQuantity: 2,
      riskGrade: 'SAFE',
    },
  ],
  salesPointCount: 1,
  ownerSalesPointCount: 3,
  riskGrade: 'SAFE',
  nearestExpiryDays: null,
};

describe('InventoryTable pagination', () => {
  it('uses server page metadata and exposes only API-supported page sizes', () => {
    const onPageChange = vi.fn();
    const onSizeChange = vi.fn();

    render(
      <InventoryTable
        items={[item]}
        totalCount={42}
        page={1}
        size={20}
        totalPages={3}
        onPageChange={onPageChange}
        onSizeChange={onSizeChange}
      />,
    );

    expect(screen.getByText('1 - 20건 표시 중')).toBeInTheDocument();
    expect(screen.getByText('SKU 및 상품 정보')).toBeInTheDocument();
    expect(screen.getAllByText('베이커리').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('공급사: 테스트 공급사')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '100개씩 보기' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '200개씩 보기' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3개 판매처/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    fireEvent.change(screen.getByLabelText('보기:'), { target: { value: '100' } });
    expect(onSizeChange).toHaveBeenCalledWith(100);
  });

  it('renders a compact sort caret and announces the next sort direction', () => {
    const onSortChange = vi.fn();
    const { rerender } = render(
      <InventoryTable
        items={[item]}
        totalCount={1}
        page={1}
        size={20}
        totalPages={1}
        sort="availableQuantity,desc"
        onSortChange={onSortChange}
      />,
    );

    expect(screen.queryByRole('button', { name: /상품 및 SKU 규격/ })).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: '소비기한 오름차순 정렬' })).toBeInTheDocument();

    const availableSortButton = screen.getByRole('button', { name: '가용수량 오름차순 정렬' });
    expect(availableSortButton).toHaveAttribute('aria-pressed', 'true');
    expect(availableSortButton.querySelector('svg')).toBeInTheDocument();

    fireEvent.click(availableSortButton);
    expect(onSortChange).toHaveBeenCalledWith('availableQuantity,asc');

    rerender(
      <InventoryTable
        items={[item]}
        totalCount={1}
        page={1}
        size={20}
        totalPages={1}
        sort="availableQuantity,asc"
        onSortChange={onSortChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '가용수량 내림차순 정렬' }));
    expect(onSortChange).toHaveBeenLastCalledWith('availableQuantity,desc');
  });

  it('starts 종합 위험도 sorting from 양호 and toggles to 위험 first', () => {
    const onSortChange = vi.fn();
    const { rerender } = render(
      <InventoryTable
        items={[item]}
        totalCount={1}
        page={1}
        size={20}
        totalPages={1}
        sort="updatedAt,desc"
        onSortChange={onSortChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '종합 위험도 오름차순 정렬' }));
    expect(onSortChange).toHaveBeenLastCalledWith('riskGrade,asc');

    rerender(
      <InventoryTable
        items={[item]}
        totalCount={1}
        page={1}
        size={20}
        totalPages={1}
        sort="riskGrade,asc"
        onSortChange={onSortChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '종합 위험도 내림차순 정렬' }));
    expect(onSortChange).toHaveBeenLastCalledWith('riskGrade,desc');
  });

  it('uses the explicit retry callback instead of mutating the current page', () => {
    const onRetry = vi.fn();

    render(<InventoryTable items={[]} totalCount={0} page={2} isError onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: '다시 조회' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows center-only inventory as a separate stock owner in the table', () => {
    render(
      <InventoryTable
        items={[
          {
            ...item,
            unassignedInventory: {
              currentQuantity: 40,
              availableQuantity: 35,
              reservedQuantity: 5,
              locationCount: 1,
              hasStock: true,
            },
          },
        ]}
        totalCount={1}
        page={1}
        size={20}
        totalPages={1}
      />,
    );

    expect(screen.getByText('물류센터 미할당 40개')).toBeInTheDocument();
    expect(screen.getAllByText('40개').length).toBeGreaterThanOrEqual(1);
  });

  it('renders separate 판매처 and 미할당 재고 column headers and hides 판정 완료 text for ASSESSED status', () => {
    render(
      <InventoryTable
        items={[
          {
            ...item,
            assessmentStatus: 'ASSESSED',
            riskGrade: 'CAUTION',
            unassignedInventory: {
              currentQuantity: 22,
              availableQuantity: 20,
              reservedQuantity: 2,
              hasStock: true,
            },
          },
        ]}
        totalCount={1}
        page={1}
        size={20}
        totalPages={1}
      />,
    );

    expect(screen.getByRole('columnheader', { name: '판매처' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '미할당 재고' })).toBeInTheDocument();
    expect(screen.getByText('22개')).toBeInTheDocument();
    expect(screen.queryByText('판정 완료')).not.toBeInTheDocument();
  });

  it('renders selection checkboxes and enforces max 5 selection limit', () => {
    const onToggleSelectSku = vi.fn();
    const onClearSelectedSkus = vi.fn();

    const items = Array.from({ length: 6 }, (_, idx) => ({
      ...item,
      rowId: `SKU-${idx + 1}`,
      skuCode: `SKU-${idx + 1}`,
      skuName: `상품 ${idx + 1}`,
    }));

    const { rerender } = render(
      <InventoryTable
        items={items}
        totalCount={6}
        page={1}
        size={20}
        totalPages={1}
        selectedSkuCodes={['SKU-1', 'SKU-2']}
        onToggleSelectSku={onToggleSelectSku}
        onClearSelectedSkus={onClearSelectedSkus}
        maxSelection={5}
      />,
    );

    expect(screen.getByText('2/5개 선택됨')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    // Header checkbox + desktop row checkboxes (6) + mobile checkboxes (6)
    expect(checkboxes.length).toBeGreaterThan(6);

    fireEvent.click(screen.getByRole('button', { name: '선택 해제' }));
    expect(onClearSelectedSkus).toHaveBeenCalledTimes(1);

    // 5개가 이미 선택된 상태
    rerender(
      <InventoryTable
        items={items}
        totalCount={6}
        page={1}
        size={20}
        totalPages={1}
        selectedSkuCodes={['SKU-1', 'SKU-2', 'SKU-3', 'SKU-4', 'SKU-5']}
        onToggleSelectSku={onToggleSelectSku}
        onClearSelectedSkus={onClearSelectedSkus}
        maxSelection={5}
      />,
    );

    expect(screen.getByText('5/5개 선택됨')).toBeInTheDocument();
    // SKU-6 checkbox should be disabled
    const sku6Checkboxes = screen.getAllByRole('checkbox', { name: /상품 6 선택/ });
    expect(sku6Checkboxes[0]).toBeDisabled();
  });

  it('triggers onSelectAllSkus([]) to clear selection when clicking header checkbox while items are selected', () => {
    const onSelectAllSkus = vi.fn();
    const items = Array.from({ length: 5 }, (_, idx) => ({
      ...item,
      rowId: `SKU-${idx + 1}`,
      skuCode: `SKU-${idx + 1}`,
      skuName: `상품 ${idx + 1}`,
    }));

    render(
      <InventoryTable
        items={items}
        totalCount={5}
        page={1}
        size={20}
        totalPages={1}
        selectedSkuCodes={['SKU-1', 'SKU-2', 'SKU-3', 'SKU-4', 'SKU-5']}
        onSelectAllSkus={onSelectAllSkus}
        maxSelection={5}
      />,
    );

    const headerCheckbox = screen.getByRole('checkbox', { name: /현재 페이지 항목 최대 5개 선택 토글/ });
    expect(headerCheckbox).toBeChecked();

    fireEvent.click(headerCheckbox);
    expect(onSelectAllSkus).toHaveBeenCalledWith([]);
  });
});
