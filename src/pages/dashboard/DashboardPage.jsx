import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/entities/inventory/api/inventoryQueries.js';
import { StateView } from '@/shared/ui/StateView.jsx';
import { DashboardOperationsPanel } from '@/widgets/dashboard-operations/ui/DashboardOperationsPanel.jsx';
import { InventoryLocationOverview } from '@/widgets/inventory-location-overview/ui/InventoryLocationOverview.jsx';

import { DashboardSkeleton } from './ui/DashboardSkeleton.jsx';

function DashboardShell({ children }) {
  return (
    <main className="page-shell" aria-labelledby="dashboard-page-title">
      <h1 id="dashboard-page-title" className="sr-only">
        재고 운영 대시보드
      </h1>
      {children}
    </main>
  );
}

export function DashboardPageContent({ dashboard }) {
  const [selectedSalesPointId, setSelectedSalesPointId] = useState(
    () => dashboard.offlineStores[0]?.salesPointId ?? dashboard.onlineSalesPoints[0]?.salesPointId ?? null,
  );
  const [tabSelectionVersion, setTabSelectionVersion] = useState(0);
  const salesPoints = [...dashboard.offlineStores, ...dashboard.onlineSalesPoints];
  const selectedSalesPoint = salesPoints.find((salesPoint) => salesPoint.salesPointId === selectedSalesPointId) ?? null;
  const urgentSkusBySalesPoint = dashboard.urgentSkusBySalesPoint ?? {};
  const hasSelectedSalesPointSkus =
    selectedSalesPointId !== null && Object.prototype.hasOwnProperty.call(urgentSkusBySalesPoint, selectedSalesPointId);
  const urgentSkus =
    selectedSalesPointId === null
      ? []
      : hasSelectedSalesPointSkus
        ? (urgentSkusBySalesPoint[selectedSalesPointId] ?? [])
        : (dashboard.urgentSkusTop5 ?? []).filter((sku) => sku.allocatedSalesPointCode === selectedSalesPoint?.code);

  return (
    <DashboardShell>
      <div className="space-y-3">
        <section className="grid min-w-0 grid-cols-1 items-stretch gap-4 2xl:h-[calc(100dvh-126px)] 2xl:min-h-0 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-rows-[minmax(0,1fr)]">
          <InventoryLocationOverview
            centers={dashboard.warehouses}
            onlineSalesPoints={dashboard.onlineSalesPoints}
            stores={dashboard.offlineStores}
            onSalesPointSelect={setSelectedSalesPointId}
            onViewModeChange={() => setTabSelectionVersion((version) => version + 1)}
          />

          <DashboardOperationsPanel
            accordionResetKey={tabSelectionVersion}
            selectedSalesPoint={selectedSalesPoint}
            urgentSkus={urgentSkus}
            riskSalesPoints={dashboard.riskSalesPointsTop10}
          />
        </section>
      </div>
    </DashboardShell>
  );
}

// pages는 URL에 대응하는 화면을 조합하고, 서버 상태는 entity query를 통해 조회합니다.
export default function DashboardPage() {
  const dashboardQuery = useQuery(dashboardQueryOptions());

  if (dashboardQuery.isPending) {
    return (
      <DashboardShell>
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  if (dashboardQuery.isError) {
    const snapshotNotReady = dashboardQuery.error?.code === 'DASHBOARD-001';
    const forbidden = dashboardQuery.error?.status === 403;

    return (
      <DashboardShell>
        <StateView
          state={forbidden ? 'forbidden' : snapshotNotReady ? 'empty' : 'error'}
          title={snapshotNotReady ? '아직 생성된 대시보드 데이터가 없습니다.' : undefined}
          description={snapshotNotReady ? '재고 동기화와 위험등급 산정이 완료된 후 다시 확인해 주세요.' : undefined}
          actionLabel={forbidden ? undefined : '다시 시도'}
          onAction={forbidden ? undefined : () => dashboardQuery.refetch()}
        />
      </DashboardShell>
    );
  }

  return <DashboardPageContent dashboard={dashboardQuery.data} />;
}
