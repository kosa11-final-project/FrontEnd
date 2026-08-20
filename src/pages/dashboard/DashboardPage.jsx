import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/entities/inventory';
import { DashboardSummary } from '@/widgets/dashboard-summary';
import { InventoryLocationOverview } from '@/widgets/inventory-location-overview';
import { RiskSalesPointTable } from '@/widgets/risk-sales-points';
import { UrgentSkuList } from '@/widgets/urgent-skus';
import { StateView } from '@/shared/ui';

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
  return (
    <DashboardShell>
      <div className="space-y-4">
        <DashboardSummary calculatedAt={dashboard.calculatedAt} summary={dashboard.summary} />

        <section className="grid min-w-0 grid-cols-1 items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <InventoryLocationOverview
            centers={dashboard.warehouses}
            onlineSalesPoints={dashboard.onlineSalesPoints}
            stores={dashboard.offlineStores}
          />

          <div className="grid min-w-0 gap-4 lg:grid-cols-2 2xl:grid-cols-1">
            <UrgentSkuList compact skus={dashboard.urgentSkusTop5} />
            <RiskSalesPointTable compact points={dashboard.riskSalesPointsTop10} />
          </div>
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
        <StateView
          state="loading"
          title="대시보드 데이터를 불러오고 있습니다."
          description="최근 재고 동기화 결과를 확인하는 중입니다."
        />
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
