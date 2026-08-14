import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession } from './auth-mocks.js';

test.describe('기본 앱 셸', () => {
  test('기본 경로는 대시보드로 이동한다', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible();
    await expect(page.getByRole('link', { name: '대시보드' })).toHaveAttribute('aria-current', 'page');
  });

  test('사이드바 메뉴가 각 기본 페이지로 이동한다', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await page.goto('/inventory');
    await page.getByRole('link', { name: 'AI 전략 및 시뮬레이션' }).click();
    await expect(page).toHaveURL(/\/ai-strategy$/);
    await expect(page.getByRole('heading', { name: 'AI 전략 및 시뮬레이션' })).toBeVisible();

    await page.getByRole('link', { name: '통계' }).click();
    await expect(page).toHaveURL(/\/statistics$/);
    await expect(page.getByRole('link', { name: '통계' })).toHaveAttribute('aria-current', 'page');
  });
});
