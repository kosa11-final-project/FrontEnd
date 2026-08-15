import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getJson, postJson } = vi.hoisted(() => ({
  getJson: vi.fn(),
  postJson: vi.fn(),
}));

vi.mock('@/shared/api', () => ({ getJson, postJson }));

import { getCurrentUser, login, logout } from './authApi.js';

// API 호출과 응답 매핑 검증에만 사용하는 테스트 전용 사용자
const userResponse = {
  data: {
    userId: 1,
    loginId: 'greenfood-admin',
    userName: '전체 총괄',
    email: 'admin@example.com',
    organizationId: 10,
    organizationName: '그린푸드',
    roleCode: 'GREENFOOD_ADMIN',
  },
};

const mappedUser = { ...userResponse.data, roleName: '그린푸드 총괄' };

describe('auth API', () => {
  beforeEach(() => {
    getJson.mockReset();
    postJson.mockReset();
  });

  it('issues a CSRF token before posting login credentials', async () => {
    getJson.mockResolvedValueOnce({ data: { token: 'csrf-token', headerName: 'X-XSRF-TOKEN' } });
    postJson.mockResolvedValueOnce(userResponse);

    await expect(login({ loginId: 'greenfood-admin', password: 'password' })).resolves.toEqual(mappedUser);

    expect(getJson).toHaveBeenCalledWith({
      path: 'v1/auth/csrf',
      signal: undefined,
      skipSessionExpirationHandling: true,
    });
    expect(postJson).toHaveBeenCalledWith({
      path: 'v1/auth/login',
      body: { loginId: 'greenfood-admin', password: 'password' },
      signal: undefined,
      skipSessionExpirationHandling: true,
    });
    expect(getJson.mock.invocationCallOrder[0]).toBeLessThan(postJson.mock.invocationCallOrder[0]);
  });

  it('maps the current session user envelope', async () => {
    getJson.mockResolvedValueOnce(userResponse);

    await expect(getCurrentUser()).resolves.toEqual(mappedUser);
    expect(getJson).toHaveBeenCalledWith({
      path: 'v1/auth/me',
      signal: undefined,
      skipSessionExpirationHandling: true,
    });
  });

  it('issues a CSRF token before requesting logout', async () => {
    getJson.mockResolvedValueOnce({ data: { token: 'csrf-token', headerName: 'X-XSRF-TOKEN' } });
    postJson.mockResolvedValueOnce({ data: null });

    await expect(logout()).resolves.toBeUndefined();

    expect(getJson).toHaveBeenCalledWith({
      path: 'v1/auth/csrf',
      signal: undefined,
      skipSessionExpirationHandling: true,
    });
    expect(postJson).toHaveBeenCalledWith({ path: 'v1/auth/logout', signal: undefined });
    expect(getJson.mock.invocationCallOrder[0]).toBeLessThan(postJson.mock.invocationCallOrder[0]);
  });
});
