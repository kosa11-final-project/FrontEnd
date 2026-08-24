import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authKeys } from '@/entities/auth';
import { StateView } from '@/shared/ui';
import { AppHeader } from './AppHeader.jsx';
import AppSidebar from './AppSidebar.jsx';

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

function AuthenticatedStory({ children }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
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
    client.setQueryData(authKeys.currentUser(), storyUser);
    return client;
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const meta = {
  title: 'App Shell/Navigation',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '현재 AppSidebar·AppHeader와 업무 페이지가 배치되는 전역 애플리케이션 프레임을 확인합니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <AuthenticatedStory>
        <Story />
      </AuthenticatedStory>
    ),
  ],
};

export default meta;

export const ApplicationChrome = {
  render: () => (
    <MemoryRouter initialEntries={['/inventory']}>
      <div className="app-shell mesh-forecast min-h-[760px]">
        <AppSidebar />
        <main className="main-content">
          <AppHeader />
          <div className="content-wrap">
            <section className="page-shell">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">통합 재고 관제</h1>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B7ECCF] bg-[#DAF7E9] px-2.5 py-0.5 text-xs font-semibold text-[#1E8251]">
                      <span className="size-1.5 rounded-full bg-[#27B06E]" />
                      현재 DB 기준
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    전역 탐색과 헤더가 실제 업무 콘텐츠를 감싸는 현재 레이아웃입니다.
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-xl border border-[var(--border)] bg-white p-8 shadow-xs">
                <StateView
                  state="loading"
                  compact
                  title="업무 콘텐츠 영역"
                  description="각 페이지 스토리에서 대시보드, 재고, 실행 관제, 통계 콘텐츠를 확인할 수 있습니다."
                />
              </div>
            </section>
          </div>
        </main>
      </div>
    </MemoryRouter>
  ),
  parameters: {
    docs: {
      source: {
        code: `<MemoryRouter initialEntries={['/inventory']}>
  <div className="app-shell mesh-forecast">
    <AppSidebar />
    <main className="main-content">
      <AppHeader />
      <div className="content-wrap">
        <section className="page-shell">현재 업무 페이지</section>
      </div>
    </main>
  </div>
</MemoryRouter>`,
      },
    },
  },
};

export const AppHeaderOnly = {
  render: () => (
    <MemoryRouter initialEntries={['/inventory']}>
      <div className="app-shell min-h-[120px]">
        <main className="main-content" style={{ width: '100%', marginLeft: 0 }}>
          <AppHeader />
        </main>
      </div>
    </MemoryRouter>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '라우터 경로에 따라 breadcrumb만 갱신되는 앱 헤더 단독 상태입니다. 초기 세팅 안내 문구 없이 알림과 사용자 메뉴만 표시합니다.',
      },
      source: {
        code: `<MemoryRouter initialEntries={['/inventory']}>
  <AppHeader />
</MemoryRouter>`,
      },
    },
  },
};

export const AppSidebarOnly = {
  render: () => (
    <MemoryRouter initialEntries={['/inventory']}>
      <div className="app-shell min-h-[760px]">
        <AppSidebar />
        <main className="main-content" aria-hidden="true" />
      </div>
    </MemoryRouter>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: '현대그린푸드 브랜드와 업무 메뉴를 포함한 사이드바 단독 상태입니다.',
      },
      source: {
        code: `<MemoryRouter initialEntries={['/inventory']}>
  <AppSidebar />
</MemoryRouter>`,
      },
    },
  },
};
