import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_INVENTORY_FILTERS } from '../model/filterState.js';
import { InventoryFilterBar } from './InventoryFilterBar.jsx';

describe('InventoryFilterBar', () => {
  it('lets the user switch the filter group operator directly from the filter bar', () => {
    const onFilterChange = vi.fn();

    render(
      <InventoryFilterBar
        filters={DEFAULT_INVENTORY_FILTERS}
        filterOptions={{ channels: [] }}
        onFilterChange={onFilterChange}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'AND 조건으로 필터링' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'OR 조건으로 필터링' }));

    expect(onFilterChange).toHaveBeenCalledWith({ filterOperator: 'OR' });
  });
  it('does not display a removed region-only filter from legacy URL state', () => {
    render(
      <InventoryFilterBar
        filters={{ ...DEFAULT_INVENTORY_FILTERS, regionCode: ['GYEONGGI'] }}
        filterOptions={{ channels: [], regions: [{ code: 'GYEONGGI', name: '경기권' }] }}
        onFilterChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.queryByText('경기권')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /상세 필터/ })).not.toHaveTextContent('1');
  });

  it('shows each selected category with an independent remove action', () => {
    const onFilterChange = vi.fn();
    const filters = { ...DEFAULT_INVENTORY_FILTERS, categoryIds: ['3', '5'], categoryId: '3' };
    const categories = [
      { code: '1', name: '간편식/메인요리', categoryLevel: 1 },
      { code: '2', name: '부침/전', categoryLevel: 2, parentCode: '1' },
      { code: '3', name: '부침', categoryLevel: 3, parentCode: '2' },
      { code: '4', name: '육류요리', categoryLevel: 2, parentCode: '1' },
      { code: '5', name: '갈비', categoryLevel: 3, parentCode: '4' },
    ];

    render(
      <InventoryFilterBar
        filters={filters}
        filterOptions={{ channels: [], categories }}
        onFilterChange={onFilterChange}
        onReset={vi.fn()}
      />,
    );

    const removeGalbi = screen.getByRole('button', { name: /간편식\/메인요리 › 육류요리 › 갈비 카테고리 필터 해제/ });
    fireEvent.click(removeGalbi);

    expect(onFilterChange).toHaveBeenCalledWith({ categoryId: '3', categoryIds: ['3'] });
  });

  it('shows every selected warehouse and sales point as an independent filter chip', () => {
    render(
      <InventoryFilterBar
        filters={{
          ...DEFAULT_INVENTORY_FILTERS,
          warehouseCode: ['WH-1', 'WH-2'],
          salesPointCode: ['SP-1', 'SP-2'],
        }}
        filterOptions={{
          channels: [],
          warehouses: [
            { code: 'WH-1', name: '경인1센터' },
            { code: 'WH-2', name: '서울센터' },
          ],
          salesPoints: [
            { code: 'SP-1', name: '판교점' },
            { code: 'SP-2', name: '수지점' },
          ],
        }}
        onFilterChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText('경인1센터')).toBeInTheDocument();
    expect(screen.getByText('서울센터')).toBeInTheDocument();
    expect(screen.getByText('판교점')).toBeInTheDocument();
    expect(screen.getByText('수지점')).toBeInTheDocument();
  });

  it('clears the legacy category id when the last category chip is removed', () => {
    const onFilterChange = vi.fn();
    const filters = { ...DEFAULT_INVENTORY_FILTERS, categoryIds: ['3'], categoryId: '3' };

    render(
      <InventoryFilterBar
        filters={filters}
        filterOptions={{ channels: [], categories: [{ code: '3', name: '부침' }] }}
        onFilterChange={onFilterChange}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /부침 카테고리 필터 해제/ }));

    expect(onFilterChange).toHaveBeenCalledWith({ categoryId: '', categoryIds: [] });
  });

  it('uses the named filter reset button without rendering a duplicate clear action', () => {
    render(
      <InventoryFilterBar
        filters={{ ...DEFAULT_INVENTORY_FILTERS, q: '만두' }}
        filterOptions={{ channels: [] }}
        onFilterChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '필터 초기화' })).toBeInTheDocument();
    expect(screen.queryByText('모든 조건 지우기')).not.toBeInTheDocument();
  });
});
