import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  expectedDisposalQuantity: 3,
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

const imageItem = {
  ...item,
  imageUrl: 'https://example.com/test-product.png',
};

describe('InventoryTable pagination', () => {
  describe('loading feedback', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('shows the full table skeleton immediately only when there is no initial data', () => {
      render(<InventoryTable items={[]} isLoading />);

      expect(screen.getByRole('status', { name: '재고 목록 불러오는 중' })).toBeInTheDocument();
      expect(screen.queryByText('조회 중')).not.toBeInTheDocument();
    });

    it('keeps existing rows for fast refetches and progressively reveals delayed feedback', () => {
      const { rerender } = render(<InventoryTable items={[item]} totalCount={1} page={1} size={20} totalPages={1} />);
      const initialTable = screen.getByRole('table');

      rerender(<InventoryTable items={[item]} totalCount={1} page={1} size={20} totalPages={1} isFetching />);

      expect(screen.getAllByText('규격')).toHaveLength(2);
      expect(screen.queryByText('조회 중')).not.toBeInTheDocument();
      expect(screen.queryByTestId('inventory-table-desktop-body-skeleton')).not.toBeInTheDocument();
      expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('table')).toBe(initialTable);

      act(() => {
        vi.advanceTimersByTime(399);
      });
      expect(screen.queryByText('조회 중')).not.toBeInTheDocument();
      expect(screen.getAllByText('규격')).toHaveLength(2);

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByText('조회 중')).toBeInTheDocument();
      expect(screen.getAllByText('규격')).toHaveLength(2);

      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(screen.getByRole('columnheader', { name: 'SKU 및 상품 정보' })).toBeInTheDocument();
      const desktopBodySkeleton = screen.getByTestId('inventory-table-desktop-body-skeleton');
      const mobileBodySkeleton = screen.getByTestId('inventory-table-mobile-body-skeleton');
      expect(desktopBodySkeleton).toBeInTheDocument();
      expect(mobileBodySkeleton).toBeInTheDocument();
      expect(desktopBodySkeleton.querySelectorAll('tr')).toHaveLength(1);
      expect(mobileBodySkeleton.children).toHaveLength(1);
      expect(screen.queryByText('규격')).not.toBeInTheDocument();

      rerender(<InventoryTable items={[item]} totalCount={1} page={1} size={20} totalPages={1} />);

      expect(screen.queryByText('조회 중')).not.toBeInTheDocument();
      expect(screen.queryByTestId('inventory-table-desktop-body-skeleton')).not.toBeInTheDocument();
      expect(screen.getAllByText('규격')).toHaveLength(2);
      expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy');
      expect(screen.getByRole('table')).toBe(initialTable);
    });

    it('cancels delayed feedback when a refetch finishes before the hint threshold', () => {
      const { rerender } = render(
        <InventoryTable items={[item]} totalCount={1} page={1} size={20} totalPages={1} fetchKey="default" />,
      );

      rerender(
        <InventoryTable
          items={[item]}
          totalCount={1}
          page={1}
          size={20}
          totalPages={1}
          fetchKey="search-a"
          isFetching
        />,
      );

      act(() => {
        vi.advanceTimersByTime(399);
      });

      rerender(<InventoryTable items={[item]} totalCount={1} page={1} size={20} totalPages={1} fetchKey="search-a" />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByText('조회 중')).not.toBeInTheDocument();
      expect(screen.queryByTestId('inventory-table-desktop-body-skeleton')).not.toBeInTheDocument();
      expect(screen.getAllByText('규격')).toHaveLength(2);
    });

    it('restarts progressive feedback when a new request begins before the previous one finishes', () => {
      const { rerender } = render(
        <InventoryTable items={[item]} totalCount={1} page={1} size={20} totalPages={1} fetchKey="default" />,
      );

      rerender(
        <InventoryTable
          items={[item]}
          totalCount={1}
          page={1}
          size={20}
          totalPages={1}
          fetchKey="search-a"
          isFetching
        />,
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByTestId('inventory-table-desktop-body-skeleton')).toBeInTheDocument();

      rerender(
        <InventoryTable
          items={[item]}
          totalCount={1}
          page={1}
          size={20}
          totalPages={1}
          fetchKey="search-b"
          isFetching
        />,
      );

      expect(screen.queryByText('조회 중')).not.toBeInTheDocument();
      expect(screen.queryByTestId('inventory-table-desktop-body-skeleton')).not.toBeInTheDocument();
      expect(screen.getAllByText('규격')).toHaveLength(2);

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByText('조회 중')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(screen.getByTestId('inventory-table-desktop-body-skeleton')).toBeInTheDocument();
    });

    it('disables select-all while stale rows are replaced by a body skeleton', () => {
      const onSelectAllSkus = vi.fn();
      render(
        <InventoryTable
          items={[item]}
          totalCount={1}
          page={1}
          size={20}
          totalPages={1}
          isFetching
          onSelectAllSkus={onSelectAllSkus}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const selectAllCheckbox = screen.getByRole('checkbox', { name: '현재 페이지 항목 최대 5개 선택 토글' });
      expect(selectAllCheckbox).toBeDisabled();
      fireEvent.click(selectAllCheckbox);
      expect(onSelectAllSkus).not.toHaveBeenCalled();
    });

    it('does not leave a stale empty message indefinitely during a slow refetch', () => {
      render(
        <InventoryTable items={[]} totalCount={0} resultState="FILTER_EMPTY" isFetching onResetFilters={vi.fn()} />,
      );

      const emptyStateContainer = screen.getByTestId('inventory-table-empty-state');
      expect(screen.getByText('일치하는 재고가 없습니다')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByText('조회 중')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(screen.queryByText('일치하는 재고가 없습니다')).not.toBeInTheDocument();
      expect(screen.getByTestId('inventory-table-empty-refetch-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('inventory-table-empty-state')).toBe(emptyStateContainer);
      expect(screen.queryByRole('status', { name: '재고 목록 불러오는 중' })).not.toBeInTheDocument();
    });
  });

  it('opens a product image in a motion lightbox and closes it with Escape', async () => {
    render(<InventoryTable items={[imageItem]} totalCount={1} page={1} size={20} totalPages={1} />);

    const imageButtons = screen.getAllByRole('button', { name: '규격 이미지 크게 보기' });
    expect(imageButtons).toHaveLength(2);

    fireEvent.click(imageButtons[0]);

    expect(screen.getByRole('dialog', { name: '규격 크게 보기' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '이미지 크게 보기 닫기' })).toHaveLength(2);

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '규격 크게 보기' })).not.toBeInTheDocument());
  });

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
    expect(screen.getByRole('row', { name: /3개 판매처/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    fireEvent.change(screen.getByLabelText('보기:'), { target: { value: '100' } });
    expect(onSizeChange).toHaveBeenCalledWith(100);
  });

  it('keeps the selection column flush left and distributes desktop columns evenly', () => {
    render(<InventoryTable items={[item]} totalCount={1} page={1} size={20} totalPages={1} />);

    const table = screen.getByRole('table');
    const columnWidths = [...table.querySelectorAll('col')].map((column) => column.className);

    expect(table.querySelector('th')).toHaveClass('text-left', 'pl-3');
    expect(table.querySelector('tbody td')).toHaveClass('text-left', 'pl-3');
    expect(columnWidths).toEqual([
      'w-[4%]',
      'w-[30%]',
      'w-[16%]',
      'w-[6%]',
      'w-[8%]',
      'w-[9%]',
      'w-[8%]',
      'w-[12%]',
      'w-[7%]',
    ]);
  });

  it('shows the server-calculated 30-day expected disposal quantity on desktop and mobile', () => {
    render(<InventoryTable items={[item]} totalCount={1} page={1} size={20} totalPages={1} />);

    expect(screen.getByRole('columnheader', { name: '30일 예상 폐기' })).toBeInTheDocument();
    expect(screen.getAllByText('3개')).toHaveLength(2);
    expect(screen.getByText('향후 30일')).toBeInTheDocument();
    expect(screen.getAllByText('30일 예상 폐기')).toHaveLength(2);
  });

  it('shows the nearest expiry date alongside the remaining days', () => {
    render(
      <InventoryTable
        items={[{ ...item, nearestExpiryDays: 14, nearestExpiryDate: '2026-12-31' }]}
        totalCount={1}
        page={1}
        size={20}
        totalPages={1}
      />,
    );

    expect(screen.getAllByText('D-14')).toHaveLength(2);
    expect(screen.getAllByText('2026.12.31')).toHaveLength(2);
  });

  it('keeps expiry headers and remaining-day badges on one line', () => {
    render(
      <InventoryTable
        items={[{ ...item, nearestExpiryDays: 204, nearestExpiryDate: '2027-03-18' }]}
        totalCount={1}
        page={1}
        size={20}
        totalPages={1}
      />,
    );

    expect(screen.getByRole('columnheader', { name: /소비기한/ })).toHaveClass('whitespace-nowrap');
    expect(screen.getAllByText('D-204').every((element) => element.classList.contains('whitespace-nowrap'))).toBe(true);
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

  it('sorts the 30-day expected disposal column in both directions', () => {
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

    fireEvent.click(screen.getByRole('button', { name: '30일 예상 폐기 내림차순 정렬' }));
    expect(onSortChange).toHaveBeenLastCalledWith('expectedDisposalQuantity,desc');

    rerender(
      <InventoryTable
        items={[item]}
        totalCount={1}
        page={1}
        size={20}
        totalPages={1}
        sort="expectedDisposalQuantity,desc"
        onSortChange={onSortChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '30일 예상 폐기 오름차순 정렬' }));
    expect(onSortChange).toHaveBeenLastCalledWith('expectedDisposalQuantity,asc');
  });

  it('starts 최고 위험도 sorting from 양호 and toggles to 위험 first', () => {
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

    fireEvent.click(screen.getByRole('button', { name: '최고 위험도 오름차순 정렬' }));
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

    fireEvent.click(screen.getByRole('button', { name: '최고 위험도 내림차순 정렬' }));
    expect(onSortChange).toHaveBeenLastCalledWith('riskGrade,desc');
  });

  it('uses the explicit retry callback instead of mutating the current page', () => {
    const onRetry = vi.fn();

    render(<InventoryTable items={[]} totalCount={0} page={2} isError onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: '다시 조회' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('explains when an inventory request exceeds its time limit', () => {
    render(<InventoryTable items={[]} totalCount={0} isError error={{ code: 'REQUEST_TIMEOUT' }} />);

    expect(
      screen.getByText('재고 조회 시간이 초과되었습니다. 조건을 줄이거나 잠시 후 다시 시도해 주세요.'),
    ).toBeInTheDocument();
  });

  it('keeps center-only inventory in the mobile owner summary without a desktop column', () => {
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
    expect(screen.queryByRole('columnheader', { name: '미할당 재고' })).not.toBeInTheDocument();
  });

  it('removes the 미할당 재고 column and hides 판정 완료 text for ASSESSED status', () => {
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
    expect(screen.queryByRole('columnheader', { name: '미할당 재고' })).not.toBeInTheDocument();
    expect(screen.queryByText('22개')).not.toBeInTheDocument();
    expect(screen.queryByText('판정 완료')).not.toBeInTheDocument();
  });

  it('shows safety-stock shortage in the risk column without adding a separate column', () => {
    const { rerender } = render(
      <InventoryTable
        items={[
          {
            ...item,
            shortageYn: 'Y',
            salesPoints: [{ ...item.salesPoints[0], shortageYn: 'Y' }],
          },
        ]}
        totalCount={1}
        page={1}
        size={20}
        totalPages={1}
      />,
    );

    expect(screen.queryByRole('columnheader', { name: '안전재고' })).not.toBeInTheDocument();
    expect(screen.getAllByText('안전재고 미달 상품 포함')).toHaveLength(2);

    rerender(
      <InventoryTable items={[{ ...item, shortageYn: 'N' }]} totalCount={1} page={1} size={20} totalPages={1} />,
    );
    expect(screen.queryByText('안전재고 충족')).not.toBeInTheDocument();
    expect(screen.queryByText('안전재고 미달 상품 포함')).not.toBeInTheDocument();
  });

  it('shows safety-stock shortage when only center-only inventory is below safety stock', () => {
    render(
      <InventoryTable
        items={[
          {
            ...item,
            shortageYn: 'N',
            unassignedInventory: {
              currentQuantity: 6,
              availableQuantity: 6,
              shortageYn: 'Y',
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

    expect(screen.getAllByText('안전재고 미달 상품 포함')).toHaveLength(2);
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

  it('enables AI strategy generation only after selecting a SKU', () => {
    const onGenerateStrategy = vi.fn();
    const { rerender } = render(
      <InventoryTable items={[item]} totalCount={1} selectedSkuCodes={[]} onGenerateStrategy={onGenerateStrategy} />,
    );

    const generateButton = screen.getByRole('button', { name: 'AI 전략 생성' });
    expect(generateButton).toBeDisabled();
    expect(generateButton).toHaveClass(
      'disabled:opacity-100',
      'disabled:bg-[var(--primary-soft)]',
      'disabled:text-[color:var(--text-muted)]',
    );

    rerender(
      <InventoryTable
        items={[item]}
        totalCount={1}
        selectedSkuCodes={[item.skuCode]}
        onGenerateStrategy={onGenerateStrategy}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'AI 전략 생성' }));
    expect(onGenerateStrategy).toHaveBeenCalledTimes(1);
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
