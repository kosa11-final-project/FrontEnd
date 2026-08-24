import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession } from './auth-mocks.js';

function apiBody(data) {
  return JSON.stringify({ data, timestamp: '2026-08-24T00:00:00Z' });
}

const imageUrl = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="#27b06e"/></svg>',
)}`;

test('상품 이미지를 클릭하면 원래 위치에서 중앙으로 확대되고 Escape로 닫힌다', async ({ page }) => {
  test.setTimeout(20_000);
  await mockAuthenticatedSession(page);

  await page.route('**/api/v1/inventories?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: apiBody({
        items: [
          {
            rowId: 'SKU-IMAGE',
            skuCode: 'SKU-IMAGE',
            skuName: '1.05kg 단품팩',
            productName: '칠리 만두',
            imageUrl,
            storageType: 'ROOM_TEMP',
            storageName: '상온',
            riskGrade: 'SAFE',
            salesPoints: [],
          },
        ],
        totalCount: 1,
        page: 1,
        size: 20,
        totalPages: 1,
        isFilterEmpty: false,
      }),
    }),
  );

  await page.goto('/inventory');

  const imageButton = page.locator('button[aria-label="1.05kg 단품팩 이미지 크게 보기"]:visible');
  await expect(imageButton).toBeVisible();
  await imageButton.click();

  const dialog = page.getByRole('dialog', { name: '1.05kg 단품팩 크게 보기' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img[alt="1.05kg 단품팩"]')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden({ timeout: 3_000 });
});
