import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStrategyExecutionsMock } = vi.hoisted(() => ({ getStrategyExecutionsMock: vi.fn() }));

vi.mock('@/entities/strategy', async () => {
  const actual = await vi.importActual('@/entities/strategy');
  return { ...actual, getStrategyExecutions: getStrategyExecutionsMock };
});

import { strategyExecutionFixtures } from '@/entities/strategy';
import ExecutionListPage from './ExecutionListPage.jsx';

function LocationControls() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location-search">{location.search}</output>
      <button type="button" onClick={() => navigate(-1)}>
        브라우저 뒤로
      </button>
    </>
  );
}

function renderPage(path) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <LocationControls />
        <ExecutionListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ExecutionListPage server pagination', () => {
  beforeEach(() => {
    getStrategyExecutionsMock.mockReset();
    getStrategyExecutionsMock.mockImplementation(async (params) => ({
      items: [strategyExecutionFixtures[params.page % strategyExecutionFixtures.length]],
      page: params.page + 1,
      size: params.size,
      totalElements: 25,
      totalPages: 3,
      first: params.page === 0,
      last: params.page === 2,
    }));
  });

  it('uses a one-based URL page, sends a zero-based API page, and restores browser history', async () => {
    renderPage('/execution?page=2');

    expect(await screen.findByText('2 / 3 페이지')).toBeInTheDocument();
    expect(getStrategyExecutionsMock).toHaveBeenCalledWith({ page: 1, size: 10 }, expect.any(AbortSignal));

    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent('?page=3'));
    expect(await screen.findByText('3 / 3 페이지')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '브라우저 뒤로' }));
    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent('?page=2'));
    expect(await screen.findByText('2 / 3 페이지')).toBeInTheDocument();
  });

  it('resets to the first page when a search condition changes', async () => {
    renderPage('/execution?page=2');
    await screen.findByText('2 / 3 페이지');

    fireEvent.change(screen.getByLabelText('전략 코드, 상품명 또는 SKU 코드 검색'), {
      target: { value: '  왕교자  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent(''));
    await waitFor(() =>
      expect(getStrategyExecutionsMock).toHaveBeenLastCalledWith(
        { page: 0, size: 10, query: '왕교자' },
        expect.any(AbortSignal),
      ),
    );
  });

  it('clamps an out-of-range URL page to the last server page', async () => {
    renderPage('/execution?page=999');

    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent('?page=3'));
    expect(await screen.findByText('3 / 3 페이지')).toBeInTheDocument();
    expect(getStrategyExecutionsMock).toHaveBeenLastCalledWith({ page: 2, size: 10 }, expect.any(AbortSignal));
  });
});
