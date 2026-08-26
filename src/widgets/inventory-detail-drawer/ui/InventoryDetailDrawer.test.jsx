import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { inventoryKeys } from '@/entities/inventory/api/inventoryQueries.js';
import { forecastQueryKeys } from '@/entities/forecast/api/forecastQueries.js';
import { riskQueryKeys } from '@/entities/risk/api/riskQueries.js';
import { InventoryDetailDrawer } from './InventoryDetailDrawer.jsx';

function renderDrawer({ detailExpectedDisposalQuantity }) {
  const skuCode = 'SKU-TEST';
  const salesPointCode = 'STORE-A';
  const salesPoint = {
    salesPointCode,
    salesPointName: 'A점',
    channelType: 'HMART',
    currentQuantity: 20,
    availableQuantity: 18,
    reservedQuantity: 2,
  };
  const initialItem = {
    skuCode,
    skuName: '테스트 SKU',
    productName: '테스트 상품',
    storageName: '냉동',
    expectedDisposalQuantity: 91,
    salesPoints: [salesPoint],
    locations: [],
    unassignedInventory: { hasStock: false, locations: [] },
  };
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  client.setQueryData(inventoryKeys.detail(skuCode, salesPointCode), {
    ...initialItem,
    ...salesPoint,
    expectedDisposalQuantity: detailExpectedDisposalQuantity,
  });
  client.setQueryData(inventoryKeys.lot(skuCode, salesPointCode), { items: [], totalCount: 0 });
  client.setQueryData(riskQueryKeys.detail(skuCode, salesPointCode), {
    assessmentStatus: 'ASSESSED',
    riskGrade: 'DANGER',
    availableQty: 18,
    safetyStockQty: 10,
    safetyGapQty: 0,
    shortageYn: 'N',
    reasonMessage: '판매처별 위험 판정',
    reasons: [],
  });
  client.setQueryData(forecastQueryKeys.detail(skuCode, salesPointCode), null);

  render(
    <QueryClientProvider client={client}>
      <InventoryDetailDrawer
        item={initialItem}
        open
        activeTab="OVERVIEW"
        selectedSalesPointCode={salesPointCode}
        onSalesPointChange={vi.fn()}
        onTabChange={vi.fn()}
        onClose={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe('InventoryDetailDrawer', () => {
  it('does not reuse the SKU total when the selected sales point disposal quantity is unavailable', () => {
    renderDrawer({ detailExpectedDisposalQuantity: null });

    const disposalCard = screen.getByText('30일 예상 폐기수량').parentElement;
    expect(disposalCard).toHaveTextContent('산정 불가');
    expect(screen.queryByText('91개')).not.toBeInTheDocument();
  });

  it('shows the expected disposal quantity returned for the selected sales point', () => {
    renderDrawer({ detailExpectedDisposalQuantity: 4 });

    expect(screen.getByText('4개')).toBeInTheDocument();
    expect(screen.queryByText('91개')).not.toBeInTheDocument();
  });
});
