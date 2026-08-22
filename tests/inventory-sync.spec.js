import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession, mockCsrfToken } from './auth-mocks.js';

function apiBody(data) {
  return JSON.stringify({ data, timestamp: '2026-08-14T00:00:00Z' });
}

test.describe('통합재고 동기화', () => {
  test('버튼 한 번으로 실행을 등록하고 상태 완료까지 추적한다', async ({ page }) => {
    test.setTimeout(20_000);
    await mockAuthenticatedSession(page);
    await mockCsrfToken(page);

    let detailRequestCount = 0;
    let startRequest;

    await page.route('**/api/v1/inventory-sync-runs/latest', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: apiBody(null) }),
    );
    await page.route('**/api/v1/inventory-sync-runs/42', (route) => {
      detailRequestCount += 1;
      const status = detailRequestCount === 1 ? 'RUNNING' : 'SUCCEEDED';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: apiBody({
          syncRunId: 42,
          status,
          readCount: status === 'SUCCEEDED' ? 0 : 12000,
          changedCount: 0,
          errorCount: 0,
          completedAt: status === 'SUCCEEDED' ? '2026-08-21T22:48:05+09:00' : null,
          sourceStates: [
            { sourceType: 'OFFLINE', currentRecordCount: 23392 },
            { sourceType: 'ECOMMERCE', currentRecordCount: 325 },
            { sourceType: 'GREETING', currentRecordCount: 1416 },
            { sourceType: 'WAREHOUSE', currentRecordCount: 8225 },
          ],
        }),
      });
    });
    await page.route('**/api/v1/inventory-sync-runs', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();

      startRequest = route.request();
      return route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: apiBody({ syncRunId: 42, status: 'RUNNING' }),
      });
    });

    await page.goto('/inventory');
    await page.context().addCookies([{ name: 'XSRF-TOKEN', value: 'csrf-token', url: 'http://127.0.0.1:5173' }]);

    const startButton = page.getByRole('button', { name: '재고 동기화', exact: true });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    await startButton.click();

    await expect(page.getByRole('button', { name: '재고 동기화 중입니다', exact: true })).toBeDisabled();
    await expect.poll(() => detailRequestCount, { timeout: 4_000 }).toBeGreaterThanOrEqual(1);
    await expect.poll(() => detailRequestCount, { timeout: 8_000 }).toBeGreaterThanOrEqual(2);
    await expect(page.getByRole('button', { name: '재고 동기화', exact: true })).toBeEnabled();
    await expect(
      page.getByText('동기화 완료 · 원천 33,358건 · 동기화 대상 0건 · 반영 0건 · 오류 0건 · 2026.08.21 22:48'),
    ).toBeVisible();
    await expect(page.getByText('동기화 실행을 등록하는 중입니다.')).toHaveCount(0);

    expect(startRequest).toBeTruthy();
    expect(startRequest.method()).toBe('POST');
    expect(startRequest.headers()['x-xsrf-token']).toBe('csrf-token');
    expect(startRequest.postDataJSON()).toEqual({ clientRequestId: expect.any(String) });
  });

  test('다른 세션의 실행을 감지하면 전역 동기화 버튼을 로딩 상태로 잠근다', async ({ page }) => {
    test.setTimeout(15_000);
    await mockAuthenticatedSession(page);
    await mockCsrfToken(page);

    let latestRequestCount = 0;
    let startRequestCount = 0;

    await page.route('**/api/v1/inventory-sync-runs/latest', (route) => {
      latestRequestCount += 1;
      const data = latestRequestCount === 1 ? null : { syncRunId: 77, status: 'RUNNING' };
      return route.fulfill({ status: 200, contentType: 'application/json', body: apiBody(data) });
    });
    await page.route('**/api/v1/inventory-sync-runs/77', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: apiBody({ syncRunId: 77, status: 'RUNNING' }),
      }),
    );
    await page.route('**/api/v1/inventory-sync-runs', (route) => {
      if (route.request().method() === 'POST') startRequestCount += 1;
      return route.fallback();
    });

    await page.goto('/inventory');

    await expect(page.getByRole('button', { name: '재고 동기화', exact: true })).toBeEnabled();
    const lockedButton = page.getByRole('button', { name: '재고 동기화 중입니다', exact: true });
    await expect(lockedButton).toBeDisabled({ timeout: 8_000 });
    await expect(lockedButton.locator('svg')).toHaveClass(/animate-spin/);
    await expect(page.getByText('완료될 때까지 모든 사용자의 실행 버튼이 잠깁니다.')).toBeVisible();
    expect(startRequestCount).toBe(0);
  });
});
