import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StrategyInventoryTransferList } from './StrategyInventoryTransferList.jsx';

describe('StrategyInventoryTransferList', () => {
  it('prioritizes the destination warehouse and renders the target sales point as supporting information', () => {
    render(
      <StrategyInventoryTransferList
        transfers={[
          {
            fromLocationId: 7,
            fromLocationName: '영남센터',
            toLocationId: 1,
            toLocationName: '그리팅',
            destinationWarehouseId: 1,
            destinationWarehouseName: '경인1센터',
            targetSalesPointId: 1,
            targetSalesPointName: '그리팅',
            quantity: 161,
          },
        ]}
      />,
    );

    expect(screen.getByRole('list', { name: '재고 이동 경로 목록' })).toBeInTheDocument();
    expect(
      screen.getByRole('listitem', { name: '영남센터 → 경인1센터, 161개 이동, 대상 판매처 그리팅' }),
    ).toBeInTheDocument();
    expect(screen.getByText('대상 판매처')).toBeInTheDocument();
    expect(screen.getByText('그리팅')).toBeInTheDocument();
    expect(screen.queryByRole('listitem', { name: /영남센터 → 그리팅/ })).not.toBeInTheDocument();
  });

  it('falls back to the legacy destination and hides a missing target sales point', () => {
    render(
      <StrategyInventoryTransferList
        transfers={[
          {
            fromLocationId: 3,
            fromLocationName: '서울센터',
            toLocationId: 4,
            toLocationName: '부산 물류센터',
            quantity: 30,
          },
        ]}
      />,
    );

    expect(screen.getByRole('listitem', { name: '서울센터 → 부산 물류센터, 30개 이동' })).toBeInTheDocument();
    expect(screen.queryByText(/대상 판매처/)).not.toBeInTheDocument();
  });

  it('does not render a route list when no transfer exists', () => {
    const { container } = render(<StrategyInventoryTransferList transfers={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
