import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardOperationsPanel } from './DashboardOperationsPanel.jsx';

describe('DashboardOperationsPanel', () => {
  it('combines the two operational lists in collapsible sections without the removed panel heading', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DashboardOperationsPanel
          selectedSalesPoint={{ id: 'DEPT_PANGYO', salesPointId: 13, name: '판교점' }}
          urgentSkus={[
            {
              id: 'sku-1',
              rank: 1,
              name: '그린믹스 · 5팩',
              stockLocation: '성남센터',
              expiryDays: 12,
              expectedDisposal: 86,
              issue: '소비기한 내 판매 소진이 어렵습니다.',
              code: 'GF-SAL-GRN-05',
              stockLocationType: 'WAREHOUSE',
              stockLocationCode: 'SEONGNAM',
              allocatedSalesPointCode: 'DEPT_PANGYO',
            },
          ]}
          riskSalesPoints={[
            {
              id: '13',
              rank: 1,
              name: '판교점',
              type: '오프라인',
              region: '경기',
              riskSkuCount: 3,
              expectedDisposal: 38,
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(document.querySelectorAll('[data-slot="card"]')).toHaveLength(1);
    expect(screen.queryByRole('heading', { name: '판매처 운영 현황' })).not.toBeInTheDocument();
    expect(screen.getByText('판교점')).toBeInTheDocument();
    const urgentTrigger = screen.getByRole('button', { name: /긴급 처리 SKU TOP 5/ });
    const riskTrigger = screen.getByRole('button', { name: /위험재고 보유 판매처 TOP 10/ });
    expect(urgentTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(riskTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('그린믹스 · 5팩')).toBeInTheDocument();
    expect(screen.queryByText(/목록 안에서 스크롤해/)).not.toBeInTheDocument();

    await user.click(riskTrigger);

    expect(urgentTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(riskTrigger).toHaveAttribute('aria-expanded', 'true');
    const riskContent = document.getElementById(riskTrigger.getAttribute('aria-controls'));
    expect(riskContent).not.toHaveAttribute('hidden');
    expect(riskContent).toHaveClass('overflow-y-auto');
  });

  it('hides seller-specific urgent processing for an unassigned location', () => {
    render(
      <MemoryRouter>
        <DashboardOperationsPanel
          selectedSalesPoint={null}
          urgentSkus={[]}
          riskSalesPoints={[
            {
              id: '13',
              rank: 1,
              name: '판교점',
              type: '오프라인',
              region: '경기',
              riskSkuCount: 3,
              expectedDisposal: 38,
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: /긴급 처리 SKU TOP 5/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /위험재고 보유 판매처 TOP 10/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.queryByText('판매처를 선택해 주세요.')).not.toBeInTheDocument();
  });

  it('starts with both sections closed after a location tab change', () => {
    render(
      <MemoryRouter>
        <DashboardOperationsPanel
          accordionResetKey={1}
          selectedSalesPoint={{ id: 'DEPT_PANGYO', salesPointId: 13, name: '판교점' }}
          urgentSkus={[]}
          riskSalesPoints={[]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /긴급 처리 SKU TOP 5/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /위험재고 보유 판매처 TOP 10/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
