import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCsrfToken } from '@/entities/auth';
import { markNotificationRead, notificationKeys } from '@/entities/notification';
import { NotificationMenu } from './NotificationMenu.jsx';

const mocks = vi.hoisted(() => ({
  getCsrfToken: vi.fn(),
  markNotificationRead: vi.fn(),
  notifications: [],
  unreadCount: 0,
}));

vi.mock('@/entities/auth', () => ({
  getCsrfToken: mocks.getCsrfToken,
}));

vi.mock('@/entities/notification', () => {
  const notificationKeys = {
    all: ['notifications'],
    list: () => ['notifications', 'list'],
    unreadCount: () => ['notifications', 'unread-count'],
    transient: () => ['notifications', 'transient'],
  };

  return {
    notificationKeys,
    notificationListQueryOptions: ({ enabled = true } = {}) => ({
      queryKey: notificationKeys.list(),
      queryFn: () => Promise.resolve(mocks.notifications),
      enabled,
      staleTime: Infinity,
    }),
    unreadNotificationCountQueryOptions: () => ({
      queryKey: notificationKeys.unreadCount(),
      queryFn: () => Promise.resolve(mocks.unreadCount),
      staleTime: Infinity,
    }),
    markNotificationRead: mocks.markNotificationRead,
    getNotificationTarget: (notification) => {
      if (!Number.isInteger(notification.strategyCaseId)) return null;
      if (notification.severity === 'ERROR' || notification.notificationType.endsWith('_FAILED')) {
        return `/ai-strategy?q=${notification.strategyCaseId}&drawer=${notification.strategyCaseId}`;
      }
      return `/ai-strategy/${notification.strategyCaseId}`;
    },
    isFailureNotification: (notification) =>
      notification.severity === 'ERROR' || notification.notificationType.endsWith('_FAILED'),
  };
});

const strategyNotification = {
  notificationId: 1,
  notificationType: 'AI_STRATEGY_GENERATION_COMPLETED',
  severity: 'INFO',
  title: 'AI 전략 생성 완료',
  message: '치킨 전략 생성이 완료되었습니다.',
  strategyCaseId: 123,
  forecastRunId: null,
  read: false,
  createdAt: '2026-08-26T15:00:00',
};

const forecastNotification = {
  notificationId: 2,
  notificationType: 'FORECAST_COMPLETED',
  severity: 'INFO',
  title: '수요예측 완료',
  message: '기존 수요예측 작업이 완료되었습니다.',
  strategyCaseId: null,
  forecastRunId: 77,
  read: false,
  createdAt: '2026-08-26T14:00:00',
};

const failedStrategyNotification = {
  ...strategyNotification,
  notificationId: 3,
  notificationType: 'AI_STRATEGY_GENERATION_FAILED',
  severity: 'ERROR',
  title: 'AI 전략 생성 실패',
  strategyCaseId: 456,
};

function StrategyDetail() {
  const { strategyCaseId } = useParams();
  return <p>전략 상세 {strategyCaseId}</p>;
}

function StrategyList() {
  const [searchParams] = useSearchParams();
  return <p>전략 목록 드로어 {searchParams.get('drawer')}</p>;
}

function renderMenu({ seedCache = true } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (seedCache) {
    queryClient.setQueryData(notificationKeys.list(), mocks.notifications);
    queryClient.setQueryData(notificationKeys.unreadCount(), mocks.unreadCount);
  }

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<NotificationMenu />} />
          <Route path="/ai-strategy" element={<StrategyList />} />
          <Route path="/ai-strategy/:strategyCaseId" element={<StrategyDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
}

describe('NotificationMenu', () => {
  beforeEach(() => {
    mocks.notifications = [strategyNotification, forecastNotification];
    mocks.unreadCount = 2;
    mocks.getCsrfToken.mockReset();
    mocks.getCsrfToken.mockResolvedValue({ token: 'csrf-token', headerName: 'X-XSRF-TOKEN' });
    mocks.markNotificationRead.mockReset();
    mocks.markNotificationRead.mockImplementation(async (notificationId) => {
      mocks.notifications = mocks.notifications.map((notification) =>
        notification.notificationId === notificationId ? { ...notification, read: true } : notification,
      );
      mocks.unreadCount -= 1;
    });
  });

  it('shows the API unread count and restores all notification types in the menu', async () => {
    const user = userEvent.setup();
    renderMenu({ seedCache: false });

    await user.click(await screen.findByRole('button', { name: '알림, 미확인 2개' }));

    expect(screen.getByRole('dialog', { name: '최근 알림' })).toBeInTheDocument();
    expect(screen.getByText('AI 전략 생성 완료')).toBeInTheDocument();
    expect(screen.getByText('수요예측 완료')).toBeInTheDocument();
    expect(screen.getAllByLabelText('미확인 알림')).toHaveLength(2);
  });

  it('marks an unread AI strategy notification and moves to the existing detail route', async () => {
    const user = userEvent.setup();
    const { queryClient } = renderMenu();
    await user.click(screen.getByRole('button', { name: '알림, 미확인 2개' }));

    await user.click(screen.getByRole('button', { name: /AI 전략 생성 완료/ }));

    expect(getCsrfToken).toHaveBeenCalledOnce();
    expect(mocks.markNotificationRead).toHaveBeenCalledWith(1, {
      csrf: { token: 'csrf-token', headerName: 'X-XSRF-TOKEN' },
    });
    expect(getCsrfToken.mock.invocationCallOrder[0]).toBeLessThan(markNotificationRead.mock.invocationCallOrder[0]);
    expect(await screen.findByText('전략 상세 123')).toBeInTheDocument();
    await waitFor(() => expect(queryClient.getQueryData(notificationKeys.unreadCount())).toBe(1));
  });

  it('keeps an existing forecast notification visible and readable without inventing a route', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: '알림, 미확인 2개' }));

    await user.click(screen.getByRole('button', { name: /수요예측 완료/ }));

    expect(markNotificationRead).toHaveBeenCalledWith(2, {
      csrf: { token: 'csrf-token', headerName: 'X-XSRF-TOKEN' },
    });
    expect(screen.getByRole('dialog', { name: '최근 알림' })).toBeInTheDocument();
  });

  it('moves a failed strategy notification to the matching list drawer', async () => {
    const user = userEvent.setup();
    mocks.notifications = [failedStrategyNotification];
    mocks.unreadCount = 1;
    renderMenu();
    await user.click(screen.getByRole('button', { name: '알림, 미확인 1개' }));

    await user.click(screen.getByRole('button', { name: /AI 전략 생성 실패/ }));

    expect(await screen.findByText('전략 목록 드로어 456')).toBeInTheDocument();
  });

  it('shows only the latest transient strategy notification below the bell and moves on click', async () => {
    const user = userEvent.setup();
    const { queryClient } = renderMenu();
    queryClient.setQueryData(notificationKeys.transient(), {
      eventId: 'completed-1',
      notificationType: 'AI_STRATEGY_GENERATION_COMPLETED',
      severity: 'INFO',
      title: 'AI 전략 생성 완료',
      message: "'치킨 전략' 생성이 완료되었습니다.",
      strategyCaseId: 123,
    });

    const transient = await screen.findByRole('button', { name: /AI 전략 생성 완료: '치킨 전략'/ });
    await user.click(transient);

    expect(await screen.findByText('전략 상세 123')).toBeInTheDocument();
    expect(queryClient.getQueryData(notificationKeys.transient())).toBeUndefined();
  });
});
