import { describe, expect, it } from 'vitest';
import {
  notificationKeys,
  notificationListQueryOptions,
  unreadNotificationCountQueryOptions,
} from './notificationQueries.js';

describe('notification query options', () => {
  it('uses separate stable keys for the list and unread count', () => {
    expect(notificationKeys.list()).toEqual(['notifications', 'list']);
    expect(notificationKeys.unreadCount()).toEqual(['notifications', 'unread-count']);
    expect(notificationListQueryOptions().queryKey).toEqual(notificationKeys.list());
    expect(unreadNotificationCountQueryOptions().queryKey).toEqual(notificationKeys.unreadCount());
  });

  it('can defer the notification list until the menu opens', () => {
    expect(notificationListQueryOptions({ enabled: false }).enabled).toBe(false);
  });
});
