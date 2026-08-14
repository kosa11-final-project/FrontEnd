import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api';

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock('./authApi.js', () => ({ getCurrentUser }));

import { isAuthenticationError, resolveCurrentUser } from './authQueries.js';

describe('current user query rules', () => {
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
});
