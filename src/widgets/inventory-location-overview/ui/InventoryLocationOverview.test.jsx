import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InventoryLocationOverview } from './InventoryLocationOverview.jsx';

const stores = [
  {
    id: 'DEPT_PANGYO',
    salesPointId: 13,
    code: 'DEPT_PANGYO',
    name: '판교점',
    type: '오프라인',
    region: '경기',
    address: '경기도 성남시',
    currentStock: 526,
    availableStock: 472,
    nearExpiryStock: 45,
    expectedDisposal: 38,
    riskSkuCount: 3,
    x: 20,
    y: 20,
  },
];

const centers = [
  {
    id: 'SEONGNAM',
    warehouseId: 1,
    code: 'SEONGNAM',
    name: '성남센터',
    region: '경기',
    address: '경기도 성남시',
    currentStock: 956,
    availableStock: 872,
    nearExpiryStock: 68,
    outboundStock: 84,
    riskSkuCount: 5,
    x: 20,
    y: 20,
  },
];

describe('InventoryLocationOverview sales-point selection', () => {
  it('notifies the selected sales point and clears it when switching to centers', () => {
    const onSalesPointSelect = vi.fn();

    render(
      <InventoryLocationOverview
        centers={centers}
        onlineSalesPoints={[]}
        stores={stores}
        onSalesPointSelect={onSalesPointSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /판교점/ }));
    expect(onSalesPointSelect).toHaveBeenLastCalledWith(13);

    fireEvent.click(screen.getByRole('tab', { name: /미할당/ }));
    expect(onSalesPointSelect).toHaveBeenLastCalledWith(null);
  });
});
