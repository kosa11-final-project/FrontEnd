import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import AuthGuard from './AuthGuard.jsx';

const LoginPage = lazy(() => import('@/pages/login/LoginPage.jsx'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage.jsx'));
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage.jsx'));
const AiStrategyPage = lazy(() => import('@/pages/ai-strategy/AiStrategyPage.jsx'));
const AiStrategyDetailPage = lazy(() => import('@/pages/ai-strategy/AiStrategyDetailPage.jsx'));
const AiStrategySimulationPage = lazy(() => import('@/pages/ai-strategy/AiStrategySimulationPage.jsx'));
const ExecutionListPage = lazy(() => import('@/pages/execution/ExecutionListPage.jsx'));
const ExecutionDetailPage = lazy(() => import('@/pages/execution/ExecutionDetailPage.jsx'));
const StatisticsPage = lazy(() => import('@/pages/statistics/StatisticsPage.jsx'));
const HeendiLoaderPage = lazy(() => import('@/pages/heendi-loader/HeendiLoaderPage.jsx'));

function LazyRoute({ children, fallback = null }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
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
  // 로그인 준비 API는 백엔드에서도 permitAll이므로 로그인 화면은 보호 라우트 밖에 둠
  {
    path: 'login',
    element: (
      // 로그인 진입 시 업무 화면용 전역 데이터 로딩 메시지를 노출하지 않음
      <LazyRoute fallback={null}>
        <LoginPage />
      </LazyRoute>
    ),
  },
  {
    path: 'heendi-loader',
    element: (
      <LazyRoute>
        <HeendiLoaderPage />
      </LazyRoute>
    ),
  },
  {
    // AuthGuard 아래의 업무 화면은 유효한 서버 세션이 있어야 렌더링됨
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate replace to="/dashboard" /> },
          {
            path: 'dashboard',
            element: (
              <LazyRoute>
                <DashboardPage />
              </LazyRoute>
            ),
          },
          {
            path: 'inventory',
            element: (
              <LazyRoute>
                <InventoryPage />
              </LazyRoute>
            ),
          },
          {
            path: 'ai-strategy',
            element: (
              <LazyRoute>
                <AiStrategyPage />
              </LazyRoute>
            ),
          },
          {
            path: 'ai-strategy/:strategyCaseId',
            element: (
              <LazyRoute>
                <AiStrategyDetailPage />
              </LazyRoute>
            ),
          },
          {
            path: 'ai-strategy/:strategyCaseId/simulation',
            element: (
              <LazyRoute>
                <AiStrategySimulationPage />
              </LazyRoute>
            ),
          },
          {
            path: 'execution',
            element: (
              <LazyRoute>
                <ExecutionListPage />
              </LazyRoute>
            ),
          },
          {
            path: 'execution/:strategyId',
            element: (
              <LazyRoute>
                <ExecutionDetailPage />
              </LazyRoute>
            ),
          },
          {
            path: 'statistics',
            element: (
              <LazyRoute>
                <StatisticsPage />
              </LazyRoute>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
