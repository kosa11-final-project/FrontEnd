import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InventorySalesPointsSection } from './InventorySalesPointsSection.jsx';

describe('InventorySalesPointsSection', () => {
  it('keeps seller cards free of warehouse labels and shows the unassigned warehouse and status', () => {
    const onSelectSalesPoint = vi.fn();

    render(
      <InventorySalesPointsSection
        allSalesPoints={[
          {
            salesPointCode: 'STORE-A',
            salesPointName: 'A점',
            channelType: 'HYUNDAI_DEPT',
            currentQuantity: 60,
            availableQuantity: 55,
            warehouseName: '센터 A',
            salesPointState: 'ALLOCATED_ONLY',
          },
        ]}
        unassignedInventory={{
          currentQuantity: 40,
          availableQuantity: 35,
          reservedQuantity: 5,
          locationCount: 1,
          locations: [{ warehouseCode: 'DC-A', warehouseName: '센터 A', quantity: 40 }],
          hasStock: true,
          riskGrade: 'CAUTION',
          assessmentStatus: 'ASSESSED',
          riskReason: '미할당 공용재고의 예측 데이터 없음',
        }}
        ownerSalesPointCount={1}
        onSelectSalesPoint={onSelectSalesPoint}
      />,
    );

    expect(screen.getByText('A점')).toBeInTheDocument();
    expect(screen.queryByText('판매처 할당만 됨')).not.toBeInTheDocument();
    expect(screen.getAllByText('현재고')).toHaveLength(2);

    expect(screen.getByText('물류센터')).toBeInTheDocument();
    expect(screen.getByText('센터 A')).toBeInTheDocument();
    expect(screen.getByText('미할당 재고')).toBeInTheDocument();
    expect(screen.queryByText('판매처 미귀속')).not.toBeInTheDocument();
    expect(screen.getByText('주의')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /미할당 재고/ }));
    expect(onSelectSalesPoint).toHaveBeenCalledWith('UNASSIGNED');

    fireEvent.click(screen.getByRole('button', { name: /A점/ }));
    expect(onSelectSalesPoint).toHaveBeenCalledWith('STORE-A');
  });

  it('does not clear the active sales point when its card is clicked again', () => {
    const onSelectSalesPoint = vi.fn();

    render(
      <InventorySalesPointsSection
        allSalesPoints={[{ salesPointCode: 'STORE-A', salesPointName: 'A점', channelType: 'HYUNDAI_DEPT' }]}
        selectedSalesPointCode="STORE-A"
        onSelectSalesPoint={onSelectSalesPoint}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /A점/ }));

    expect(onSelectSalesPoint).toHaveBeenCalledWith('STORE-A');
    expect(onSelectSalesPoint).not.toHaveBeenCalledWith('__ALL__');
  });
});
