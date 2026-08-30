import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authKeys } from '@/entities/auth';
import { notificationKeys } from '@/entities/notification';
import { AppHeader, AppSidebar } from '@/widgets/app-shell';

/**
 * Storybook 전용 제품 프레임입니다.
 * 실제 AppLayout과 같은 AppSidebar/AppHeader를 사용해 페이지 스토리가
 * 콘텐츠 단위와 실제 업무 화면 단위에서 모두 검토되도록 합니다.
 */
const storyUser = {
  userId: 1,
  loginId: 'greenfood-admin',
  userName: '김영만',
  email: 'admin@example.com',
  organizationId: 10,
  organizationName: '그린푸드',
  roleCode: 'GREENFOOD_ADMIN',
  roleName: '그린푸드 총괄',
};

export function createStoryQueryClient(seed) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  queryClient.setQueryData(authKeys.currentUser(), storyUser);
  // AppHeader는 모든 제품 프레임에서 알림 개수를 조회하므로 Storybook에서도
  // 네트워크 요청 없이 안정적인 초기 상태를 제공해야 합니다.
  queryClient.setQueryData(notificationKeys.list(), []);
  queryClient.setQueryData(notificationKeys.unreadCount(), 0);
  seed?.(queryClient);
  return queryClient;
}

export function StorybookProductFrame({
  children,
  path = '/inventory',
  minHeight = '760px',
  contentClassName = '',
  queryClient,
}) {
  const [client] = useState(() => queryClient ?? createStoryQueryClient());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <div className={`app-shell mesh-forecast${isSidebarOpen ? '' : ' sidebar-collapsed'}`} style={{ minHeight }}>
          <AppSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)} />
          <main className="main-content">
            <AppHeader />
            <div className={`content-wrap ${contentClassName}`.trim()}>{children}</div>
          </main>
        </div>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export function StorybookSurface({ children, className = '' }) {
  return <div className={`page-shell ${className}`.trim()}>{children}</div>;
}
