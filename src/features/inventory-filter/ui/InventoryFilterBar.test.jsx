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
});
