import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import AiStrategyPage from '@/pages/ai-strategy/AiStrategyPage.jsx';
import DashboardPage from '@/pages/dashboard/DashboardPage.jsx';
import ExecutionPage from '@/pages/execution/ExecutionPage.jsx';
import InventoryPage from '@/pages/inventory/InventoryPage.jsx';
import StatisticsPage from '@/pages/statistics/StatisticsPage.jsx';
import { StateView } from '@/shared/ui';

const HeendiLoaderPage = lazy(() => import('@/pages/heendi-loader/HeendiLoaderPage.jsx'));

function LazyRoute({ children }) {
  return <Suspense fallback={<StateView state="loading" />}>{children}</Suspense>;
}

function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-6 text-center text-[color:var(--foreground)]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[color:var(--primary)]">404</p>
        <h1 className="mt-2 text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          주소를 확인하거나 통합 재고 조회로 이동해 주세요.
        </p>
      </div>
    </main>
  );
}

export const router = createBrowserRouter([
  {
    path: 'heendi-loader',
    element: (
      <LazyRoute>
        <HeendiLoaderPage />
      </LazyRoute>
    ),
  },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate replace to="/inventory" /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'ai-strategy', element: <AiStrategyPage /> },
      { path: 'execution', element: <ExecutionPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
