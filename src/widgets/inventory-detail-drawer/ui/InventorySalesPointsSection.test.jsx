import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InventorySalesPointsSection } from './InventorySalesPointsSection.jsx';

describe('InventorySalesPointsSection', () => {
  it('keeps seller cards free of warehouse labels and shows center-only stock separately', () => {
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
          },
        ]}
        unassignedInventory={{
          currentQuantity: 40,
          availableQuantity: 35,
          reservedQuantity: 5,
          locationCount: 1,
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
    expect(screen.queryByText('센터 A')).not.toBeInTheDocument();

    expect(screen.getByText('물류센터')).toBeInTheDocument();
    expect(screen.getByText('미할당 재고')).toBeInTheDocument();
    expect(screen.getByText('주의')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /미할당 재고/ }));
    expect(onSelectSalesPoint).toHaveBeenCalledWith('UNASSIGNED');

    fireEvent.click(screen.getByRole('button', { name: /A점/ }));
    expect(onSelectSalesPoint).toHaveBeenCalledWith('STORE-A');
  });
});
