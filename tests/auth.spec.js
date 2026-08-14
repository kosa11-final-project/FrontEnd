import { expect, test } from '@playwright/test';
import { mockAnonymousSession, mockAuthenticatedSession, mockCsrfToken, successfulLoginBody } from './auth-mocks.js';

async function fillLoginForm(page) {
  await page.getByLabel('아이디').fill('greenfood-admin');
  await page.getByLabel('비밀번호', { exact: true }).fill('password');
}

async function mockSuccessfulLogin(page) {
  await mockCsrfToken(page);
  await page.route('**/api/v1/auth/login', async (route) => {
    // 백엔드 JsonLoginAuthenticationFilter와 CSRF 설정이 요구하는 요청 계약을 함께 검증함
    expect(route.request().method()).toBe('POST');
    expect(route.request().headers()['x-xsrf-token']).toBe('csrf-token');
    expect(route.request().postDataJSON()).toEqual({ loginId: 'greenfood-admin', password: 'password' });

    await route.fulfill({ status: 200, contentType: 'application/json', body: successfulLoginBody() });
  });
}

test.describe('세션 로그인과 보호 라우팅', () => {
  test('로그인한 사용자가 로그인 화면에 접근하면 기본 업무 화면으로 이동한다', async ({ page }) => {
    await mockAuthenticatedSession(page);

    await page.goto('/login');

    await expect(page).toHaveURL(/\/inventory$/);
    await expect(page.getByRole('heading', { name: '통합 재고 조회' })).toBeVisible();
  });

  test('비로그인 사용자는 보호된 화면 대신 로그인 화면을 본다', async ({ page }) => {
    await mockAnonymousSession(page);

    await page.goto('/inventory');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  test('로그인 성공 후 기본 업무 화면으로 이동한다', async ({ page }) => {
    await mockAnonymousSession(page);
    await mockSuccessfulLogin(page);
    await page.goto('/login');
    await fillLoginForm(page);

    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL(/\/inventory$/);
    await expect(page.getByRole('heading', { name: '통합 재고 조회' })).toBeVisible();
  });

  test('로그인 성공 후 처음 접근했던 화면으로 돌아간다', async ({ page }) => {
    await mockAnonymousSession(page);
    await mockSuccessfulLogin(page);
    await page.goto('/statistics');
    await expect(page).toHaveURL(/\/login$/);
    await fillLoginForm(page);

    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL(/\/statistics$/);
    await expect(page.getByRole('heading', { name: '통계' })).toBeVisible();
  });

  test('잘못된 로그인 정보에는 계정을 구분하지 않는 오류를 표시한다', async ({ page }) => {
    await mockAnonymousSession(page);
    await mockCsrfToken(page);
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'AUTH-001',
          message: '인증에 실패했습니다.',
          fieldErrors: [],
          path: '/api/v1/auth/login',
          timestamp: '2026-08-14T00:00:00Z',
        }),
      }),
    );
    await page.goto('/login');
    await fillLoginForm(page);

    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page.getByRole('alert')).toContainText('아이디 또는 비밀번호를 확인해 주세요.');
    await expect(page).toHaveURL(/\/login$/);
  });
});
