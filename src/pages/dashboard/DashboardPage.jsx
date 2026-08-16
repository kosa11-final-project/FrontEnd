import { useQuery } from '@tanstack/react-query';
import { Database } from 'reicon-react';
import { dashboardQueryOptions } from '@/entities/inventory';
import { DashboardSummary } from '@/widgets/dashboard-summary';
import { InventoryLocationOverview } from '@/widgets/inventory-location-overview';
import { RiskSalesPointTable } from '@/widgets/risk-sales-points';
import { UrgentSkuList } from '@/widgets/urgent-skus';
import { formatDateTime } from '@/shared/lib/format';
import { Badge, Card, Icon, StateView } from '@/shared/ui';

function DashboardShell({ calculatedAt, children }) {
  return (
    <main className="page-shell" aria-labelledby="dashboard-page-title">
      <Card asChild padding="lg" className="mb-6 shadow-[var(--shadow-soft)]">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-card)] bg-[var(--primary-soft)] text-[color:var(--primary-strong)]">
              <Icon icon={Database} size={22} aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  id="dashboard-page-title"
                  className="m-0 text-[length:var(--font-size-page-title)] font-[var(--font-weight-headline1)] leading-[var(--line-height-heading)] tracking-[-0.05em] text-[color:var(--text-heading)]"
                >
                  재고 운영 대시보드
                </h1>
                <Badge variant="good">전국 재고 거점</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-[length:var(--font-size-body)] text-[color:var(--text-muted)]">
                전체 재고를 요약하고 조치가 필요한 물류센터·판매처·SKU를 빠르게 확인합니다.
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
            마지막 정상 동기화
            <strong className="ml-2 text-[color:var(--text-heading)]">{formatDateTime(calculatedAt)}</strong>
          </div>
        </section>
      </Card>

      {children}
    </main>
  );
}

export function DashboardPageContent({ dashboard }) {
  return (
    <DashboardShell calculatedAt={dashboard.calculatedAt}>
      <div className="space-y-4">
        <DashboardSummary summary={dashboard.summary} />
        <InventoryLocationOverview centers={dashboard.warehouses} stores={dashboard.offlineStores} />

        <section className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
          <RiskSalesPointTable points={dashboard.riskSalesPointsTop10} />
          <UrgentSkuList skus={dashboard.urgentSkusTop5} />
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
