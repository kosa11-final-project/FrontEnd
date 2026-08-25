import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { authKeys } from '@/entities/auth';
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
