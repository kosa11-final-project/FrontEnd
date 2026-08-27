import { queryOptions } from '@tanstack/react-query';
import { getNotifications, getUnreadNotificationCount } from './notificationApi.js';

export const notificationKeys = Object.freeze({
  all: ['notifications'],
  list: () => [...notificationKeys.all, 'list'],
  unreadCount: () => [...notificationKeys.all, 'unread-count'],
  transient: () => [...notificationKeys.all, 'transient'],
});

const retryServerErrorOnly = (failureCount, error) => error?.status >= 500 && failureCount < 1;

export function notificationListQueryOptions({ enabled = true } = {}) {
  return queryOptions({
    queryKey: notificationKeys.list(),
    queryFn: ({ signal }) => getNotifications(signal),
    enabled,
    staleTime: 30_000,
    retry: retryServerErrorOnly,
  });
}

export function unreadNotificationCountQueryOptions() {
  return queryOptions({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => getUnreadNotificationCount(signal),
    staleTime: 30_000,
    retry: retryServerErrorOnly,
  });
}
