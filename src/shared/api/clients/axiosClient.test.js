import { describe, expect, it, vi } from 'vitest';
import { subscribeSessionExpiration } from '../sessionExpiration.js';
import { axiosClient } from './axiosClient.js';

function rejectingAdapter(status, code) {
  return (config) =>
    Promise.reject({
      config,
      message: `Request failed with status ${status}`,
      response: {
        status,
        data: { code, message: '요청을 처리하지 못했습니다.' },
      },
    });
}

describe('axios session-expiration handling', () => {
  it('notifies subscribers for a business API 401 AUTH-001 and keeps the normalized rejection', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSessionExpiration(listener);

    const request = axiosClient.get('v1/inventories', {
      adapter: rejectingAdapter(401, 'AUTH-001'),
    });

    await expect(request).rejects.toMatchObject({ name: 'ApiError', status: 401, code: 'AUTH-001' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: 401, code: 'AUTH-001' }));
    unsubscribe();
  });

  it('does not notify subscribers when session-expiration handling is skipped', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSessionExpiration(listener);

    await expect(
      axiosClient.get('v1/auth/me', {
        adapter: rejectingAdapter(401, 'AUTH-001'),
        skipSessionExpirationHandling: true,
      }),
    ).rejects.toMatchObject({ status: 401, code: 'AUTH-001' });

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it.each([
    [403, 'COMMON-003'],
    [500, 'COMMON-006'],
    [401, 'AUTH-999'],
  ])('does not notify subscribers for status %s and code %s', async (status, code) => {
    const listener = vi.fn();
    const unsubscribe = subscribeSessionExpiration(listener);

    await expect(
      axiosClient.get('v1/inventories', {
        adapter: rejectingAdapter(status, code),
      }),
    ).rejects.toMatchObject({ status, code });

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('stops notifying a subscriber after unsubscription', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSessionExpiration(listener);
    unsubscribe();

    await expect(
      axiosClient.get('v1/inventories', {
        adapter: rejectingAdapter(401, 'AUTH-001'),
      }),
    ).rejects.toMatchObject({ status: 401, code: 'AUTH-001' });

    expect(listener).not.toHaveBeenCalled();
  });
});
