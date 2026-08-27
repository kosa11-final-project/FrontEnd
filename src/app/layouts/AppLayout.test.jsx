import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authKeys } from '@/entities/auth';
import { notificationKeys } from '@/entities/notification';
import AppLayout from './AppLayout.jsx';

function renderLayout() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  queryClient.setQueryData(authKeys.currentUser(), {
    userName: '김영만',
    roleName: '그린푸드 총괄',
  });
  queryClient.setQueryData(notificationKeys.list(), []);
  queryClient.setQueryData(notificationKeys.unreadCount(), 0);

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="*" element={<Outlet />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AppLayout sidebar toggle', () => {
  it('moves the sidebar into a compact rail while keeping its open action available', async () => {
    const user = userEvent.setup();

    renderLayout();

    const shell = document.querySelector('.app-shell');
    const sidebar = screen.getByRole('complementary', { name: '주요 메뉴' });
    const main = screen.getByRole('main');
    const toggle = screen.getByRole('button', { name: '사이드바 닫기' });

    expect(shell).not.toHaveClass('sidebar-collapsed');
    expect(sidebar).not.toHaveAttribute('aria-hidden');

    await user.click(toggle);

    expect(shell).toHaveClass('sidebar-collapsed');
    expect(sidebar).not.toHaveAttribute('aria-hidden', 'true');
    expect(main).toHaveClass('main-content');
    expect(screen.getByRole('button', { name: '사이드바 열기' })).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('AppLayout AI strategy event subscription', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps one SSE connection across route changes and closes it on unmount', async () => {
    const user = userEvent.setup();
    const instances = [];

    class FakeEventSource {
      constructor() {
        this.close = vi.fn();
        instances.push(this);
      }

      addEventListener() {}

      removeEventListener() {}
    }

    vi.stubGlobal('EventSource', FakeEventSource);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(authKeys.currentUser(), { userName: '김영만', roleName: '그린푸드 총괄' });
    queryClient.setQueryData(notificationKeys.list(), []);
    queryClient.setQueryData(notificationKeys.unreadCount(), 0);

    const result = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Link to="/inventory">테스트 화면 이동</Link>} />
              <Route path="/inventory" element={<p>재고 화면</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(instances).toHaveLength(1);
    await user.click(screen.getByRole('link', { name: '테스트 화면 이동' }));
    expect(await screen.findByText('재고 화면')).toBeInTheDocument();
    expect(instances).toHaveLength(1);

    result.unmount();
    expect(instances[0].close).toHaveBeenCalledOnce();
  });
});
