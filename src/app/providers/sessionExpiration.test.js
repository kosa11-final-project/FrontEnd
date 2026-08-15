import { describe, expect, it, vi } from 'vitest';
import { authKeys } from '@/entities/auth';
import { createSessionExpirationHandler } from './sessionExpiration.js';

function createDependencies(pathname = '/statistics') {
  const order = [];
  const queryClient = {
    cancelQueries: vi.fn(async () => {
      order.push('cancel');
    }),
    clear: vi.fn(() => {
      order.push('clear');
    }),
    setQueryData: vi.fn(() => {
      order.push('set-user');
    }),
  };
  const router = {
    state: {
      location: { pathname, search: '?period=month', hash: '#summary' },
    },
    navigate: vi.fn(async () => {
      order.push('navigate');
    }),
  };

  return { order, queryClient, router };
}

describe('global session-expiration handler', () => {
  it('clears server state and preserves the current location before login navigation', async () => {
    const { order, queryClient, router } = createDependencies();
    const handleSessionExpiration = createSessionExpirationHandler({ queryClient, router });

    await handleSessionExpiration();

    expect(order).toEqual(['cancel', 'clear', 'set-user', 'navigate']);
    expect(queryClient.setQueryData).toHaveBeenCalledWith(authKeys.currentUser(), null);
    expect(router.navigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: {
        from: { pathname: '/statistics', search: '?period=month', hash: '#summary' },
        authReason: 'session-expired',
      },
    });
  });

  it('coalesces concurrent expiration events into one cleanup and navigation', async () => {
    let finishCancellation;
    const { queryClient, router } = createDependencies();
    queryClient.cancelQueries.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishCancellation = resolve;
        }),
    );
    const handleSessionExpiration = createSessionExpirationHandler({ queryClient, router });

    const firstHandling = handleSessionExpiration();
    const secondHandling = handleSessionExpiration();

    expect(secondHandling).toBe(firstHandling);
    expect(queryClient.cancelQueries).toHaveBeenCalledTimes(1);
    finishCancellation();
    await Promise.all([firstHandling, secondHandling]);

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });

  it('ignores delayed expiration events after arriving at the login page', async () => {
    const { queryClient, router } = createDependencies('/login');
    const handleSessionExpiration = createSessionExpirationHandler({ queryClient, router });

    await handleSessionExpiration();

    expect(queryClient.cancelQueries).not.toHaveBeenCalled();
    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
