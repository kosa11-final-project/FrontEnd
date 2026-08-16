import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InventoryTable } from './InventoryTable.jsx';

const item = {
  rowId: 'SKU-1',
  productName: '테스트 상품',
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

  it('uses the explicit retry callback instead of mutating the current page', () => {
    const onRetry = vi.fn();

    render(<InventoryTable items={[]} totalCount={0} page={2} isError onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: '다시 조회' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
