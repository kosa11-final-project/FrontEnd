import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock('./authApi.js', () => ({ getCurrentUser }));

import { authKeys, cacheAuthenticatedUser, isAuthenticationError, resolveCurrentUser } from './authQueries.js';

describe('current user query rules', () => {
  it('returns the authenticated user', async () => {
    const user = { userId: 1, userName: '김영만' };
    getCurrentUser.mockResolvedValueOnce(user);

    await expect(resolveCurrentUser()).resolves.toBe(user);
  });

  it('treats AUTH-001 as an anonymous session', async () => {
    getCurrentUser.mockRejectedValueOnce(new ApiError('인증에 실패했습니다.', { status: 401, code: 'AUTH-001' }));

    await expect(resolveCurrentUser()).resolves.toBeNull();
  });

  it('keeps unexpected errors visible to the route boundary', async () => {
    const error = new ApiError('서버 오류', { status: 500, code: 'COMMON-006' });
    getCurrentUser.mockRejectedValueOnce(error);

    await expect(resolveCurrentUser()).rejects.toBe(error);
  });

  it('recognizes authentication errors by status or code', () => {
    expect(isAuthenticationError({ status: 401 })).toBe(true);
    expect(isAuthenticationError({ code: 'AUTH-001' })).toBe(true);
    expect(isAuthenticationError({ status: 403, code: 'COMMON-003' })).toBe(false);
  });

  it('keeps the login user when an earlier current-user request is cancelled', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = { userId: 1, userName: '김영만' };
    let resolveAnonymousRequest;

    const pendingQuery = queryClient
      .fetchQuery({
        queryKey: authKeys.currentUser(),
        queryFn: ({ signal }) =>
          new Promise((resolve, reject) => {
            resolveAnonymousRequest = resolve;
            signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
          }),
      })
      .catch(() => undefined);

    await cacheAuthenticatedUser(queryClient, user);
    resolveAnonymousRequest(null);
    await pendingQuery;

    expect(queryClient.getQueryData(authKeys.currentUser())).toBe(user);
  });
});
