import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DashboardPageContent } from './DashboardPage.jsx';

const urgentSku = (id, name, salesPointCode) => ({
  id: `sku-${id}`,
  rank: 1,
  skuId: String(id),
  code: `SKU-${id}`,
  name,
  stockLocationType: 'WAREHOUSE',
  stockLocationCode: 'SEONGNAM',
  stockLocation: '성남센터',
  allocatedSalesPointCode: salesPointCode,
  expiryDays: 12,
  saleStopDays: 5,
  expectedDisposal: 10,
  issue: '소비기한 내 판매 소진이 어렵습니다.',
});

const store = (id, code, name) => ({
  id: code,
  salesPointId: id,
  code,
  name,
  shortName: name,
  type: '오프라인',
  region: '경기',
  address: '경기도 성남시',
  currentStock: 100,
  availableStock: 80,
  nearExpiryStock: 10,
  expectedDisposal: 5,
  riskSkuCount: 1,
  x: 20,
  y: 20,
});

const dashboard = {
  warehouses: [
    {
      id: 'SEONGNAM',
      warehouseId: 1,
      code: 'SEONGNAM',
      name: '성남센터',
      region: '경기',
      address: '경기도 성남시',
      currentStock: 200,
      availableStock: 160,
      nearExpiryStock: 12,
      outboundStock: 20,
      riskSkuCount: 1,
      x: 20,
      y: 20,
    },
  ],
  onlineSalesPoints: [],
  offlineStores: [store(13, 'DEPT_PANGYO', '판교점'), store(14, 'DEPT_SUJI', '수지점')],
  urgentSkusTop5: [],
  urgentSkusBySalesPoint: {
    13: [urgentSku(1, '판교 긴급 SKU', 'DEPT_PANGYO')],
    14: [urgentSku(2, '수지 긴급 SKU', 'DEPT_SUJI')],
  },
  riskSalesPointsTop10: [
    {
      id: '13',
      rank: 1,
      name: '판교점',
      type: '오프라인',
      region: '경기',
      riskSkuCount: 1,
      expectedDisposal: 5,
    },
  ],
};

describe('DashboardPageContent', () => {
  it('updates only urgent SKUs when a different sales point is selected', () => {
    render(
      <MemoryRouter>
        <DashboardPageContent dashboard={dashboard} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('heading', { name: '판매처 운영 현황' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /긴급 처리 SKU TOP 5/ })).toBeInTheDocument();
    expect(screen.getByText('판교 긴급 SKU')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /수지점/ }));

    expect(screen.getByText('수지 긴급 SKU')).toBeInTheDocument();
    expect(screen.queryByText('판교 긴급 SKU')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /위험재고 보유 판매처 TOP 10/ }));
    expect(screen.getByRole('link', { name: '판교점 재고 보기' })).toBeInTheDocument();
  });

  it('uses the global urgent list for a legacy snapshot without seller buckets', () => {
    render(
      <MemoryRouter>
        <DashboardPageContent
          dashboard={{
            ...dashboard,
            urgentSkusBySalesPoint: {},
            urgentSkusTop5: [urgentSku(3, '기존 스냅샷 긴급 SKU', 'DEPT_PANGYO')],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('기존 스냅샷 긴급 SKU')).toBeInTheDocument();
  });

  it('hides seller-specific urgent processing when the unassigned tab is selected', () => {
    render(
      <MemoryRouter>
        <DashboardPageContent dashboard={dashboard} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('tab', { name: /미할당/ }));

    expect(screen.queryByRole('button', { name: /긴급 처리 SKU TOP 5/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /위험재고 보유 판매처 TOP 10/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
