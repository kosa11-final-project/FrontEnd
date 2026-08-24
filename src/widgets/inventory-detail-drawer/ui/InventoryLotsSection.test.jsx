import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InventoryLotsSection } from './InventoryLotsSection.jsx';

describe('InventoryLotsSection', () => {
  it('LOT 상태를 한글 배지로 표시하고 툴팁 설명을 제공합니다', () => {
    render(
      <InventoryLotsSection
        selectedSalesPointCode="STORE-A"
        selectedSalesPoint={{ salesPointName: 'A점' }}
        lotsQuery={{
          data: {
            items: [
              {
                id: 1,
                lotNumber: 'LOT-SKU000032-03',
                lotStatus: 'SALE_STOPPED',
                quantity: 8,
                availableQuantity: 8,
                reservedQuantity: 0,
                receivedDate: '2026-02-03',
                expiryDate: '2026-08-31',
                saleStopDate: '2026-08-24',
                expiryDays: 7,
                fefoPriority: 1,
              },
            ],
          },
          isLoading: false,
          isError: false,
        }}
      />,
    );

    expect(screen.getByTitle('판매가 중지된 LOT입니다.')).toHaveTextContent('판매중지');
    expect(screen.getByText('LOT-SKU000032-03')).toBeInTheDocument();
    expect(screen.getByText('FEFO 1순위')).toBeInTheDocument();
  });
});
