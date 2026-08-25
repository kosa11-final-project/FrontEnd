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
    await expect.poll(() => detailRequestCount, { timeout: 12_000 }).toBeGreaterThanOrEqual(2);
    await expect(page.getByRole('button', { name: '재고 동기화', exact: true })).toBeEnabled();
    await expect(
      page.getByText(/동기화 완료 · 원천 33,358건 · 동기화 대상 0건 · 반영 0건 · 오류 0건 · 2026.08.21 22:48/),
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
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));
    });
    const lockedButton = page.getByRole('button', { name: '재고 동기화 중입니다', exact: true });
    await expect(lockedButton).toBeDisabled({ timeout: 8_000 });
    await expect(lockedButton.locator('svg')).toHaveClass(/animate-spin/);
    await expect(
      page.getByText('재고 동기화 중입니다. 이 화면의 실행 버튼을 잠그고 서버에서 중복 실행을 차단합니다.'),
    ).toBeVisible();
    expect(startRequestCount).toBe(0);
  });

  test('모바일 상세에서 DB 저장 판정 이유와 산식을 툴팁으로 확인한다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAuthenticatedSession(page);
    await mockCsrfToken(page);

    const persistedReason =
      '[ASSESSED/v1.1.0/SHORTAGE_D30] D+30 예상 수요가 가용재고를 초과합니다. | 산식: 가용재고=100, D+30부족량=max(0, 140-100)=40';
    const inventory = {
      rowId: 'SKU-TOOLTIP',
      productCode: 'P-TOOLTIP',
      productName: '툴팁 검증 상품',
      skuCode: 'SKU-TOOLTIP',
      skuName: '툴팁 검증 규격',
      salesPointCode: 'GREETING',
      salesPointName: '그리팅',
      channelType: 'GREETING',
      storageType: 'FROZEN',
      currentQuantity: 110,
      availableQuantity: 100,
      reservedQuantity: 10,
      safetyQuantity: 30,
      risk: { assessmentStatus: 'ASSESSED', grade: 'CAUTION', reason: persistedReason },
      salesPoints: [
        {
          salesPointCode: 'GREETING',
          salesPointName: '그리팅',
          channelType: 'GREETING',
          currentQuantity: 110,
          availableQuantity: 100,
          reservedQuantity: 10,
          riskGrade: 'CAUTION',
        },
      ],
      locations: [],
      lots: [],
      lotCount: 0,
      updatedAt: '2026-08-22T12:00:00Z',
    };

    await page.route('**/api/v1/inventory-sync-runs/latest', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: apiBody(null) }),
    );
    await page.route('**/api/v1/inventories/SKU-TOOLTIP/sales-points/GREETING/lots', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: apiBody({ items: [], totalCount: 0 }) }),
    );
    await page.route('**/api/v1/inventories/SKU-TOOLTIP/sales-points/GREETING/risk', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: apiBody({
          assessmentStatus: 'ASSESSED',
          riskGrade: 'CAUTION',
          reasonMessage: persistedReason,
          ruleVersion: 'v1.1.0',
          availableQty: 100,
          safetyStockQty: 30,
          shortageQty30: 40,
          shortageYn: 'Y',
          reasons: [],
        }),
      }),
    );
    await page.route('**/api/v1/inventories/SKU-TOOLTIP/sales-points/GREETING', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: apiBody(inventory) }),
    );
    await page.route('**/api/v1/inventories/summary**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: apiBody({ totalCurrentQuantity: 110, totalAvailableQuantity: 100, totalReservedQuantity: 10 }),
      }),
    );
    await page.route('**/api/v1/inventories/filter-options', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: apiBody({
          channels: [],
          salesPoints: [],
          warehouses: [],
          regions: [],
          categories: [],
          storageTypes: [],
          riskGrades: [],
          assessmentStatuses: [],
        }),
      }),
    );
    await page.route(/\/api\/v1\/inventories(?:\?.*)?$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: apiBody({ items: [inventory], totalCount: 1, page: 1, size: 20 }),
      }),
    );

    await page.goto('/inventory?detailSkuCode=SKU-TOOLTIP&detailSalesPointCode=GREETING&detailTab=OVERVIEW');

    await expect(page.getByRole('dialog')).toBeVisible();
    const trigger = page.getByRole('button', { name: '재고 위험 판정 이유 보기' });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('D+30 예상 수요가 가용재고를 초과합니다.');
    await expect(tooltip).toContainText('가용 재고: 100개, 30일 부족 수량: 40개');
    await expect(tooltip).toContainText('마지막 재고 동기화에서 서버 규칙으로 판정해 DB에 저장한 결과입니다.');
  });
});
