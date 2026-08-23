import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StrategyInventoryTransferList } from './StrategyInventoryTransferList.jsx';

describe('StrategyInventoryTransferList', () => {
  it('renders each source, destination, and transfer quantity with an accessible route name', () => {
    render(
      <StrategyInventoryTransferList
        transfers={[
          {
            fromLocationId: 1,
            fromLocationName: '경기 광주센터',
            toLocationId: 2,
            toLocationName: '그리팅몰',
            quantity: 480,
          },
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

    expect(screen.getByRole('list', { name: '재고 이동 경로 목록' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: '경기 광주센터 → 그리팅몰, 480개 이동' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: '서울센터 → 부산 물류센터, 30개 이동' })).toBeInTheDocument();
  });

  it('does not render a route list when no transfer exists', () => {
    const { container } = render(<StrategyInventoryTransferList transfers={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
