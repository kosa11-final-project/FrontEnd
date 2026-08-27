// Playwright에서 백엔드 응답을 대신하는 테스트 전용 사용자이며 실제 로그인 계정과 무관함
export const authenticatedUser = Object.freeze({
  userId: 1,
  loginId: 'greenfood-admin',
  userName: '김영만',
  email: 'admin@example.com',
  organizationId: 10,
  organizationName: '그린푸드',
  roleCode: 'GREENFOOD_ADMIN',
});

const emptyInventoryListBody = JSON.stringify({
  data: {
    items: [],
    totalCount: 0,
    page: 1,
    size: 20,
    totalPages: 1,
    isFilterEmpty: false,
  },
  timestamp: '2026-08-14T00:00:00Z',
});

const emptyInventorySummaryBody = JSON.stringify({
  data: {
    totalCurrentQuantity: 0,
    totalAvailableQuantity: 0,
    totalReservedQuantity: 0,
    underSafetyCount: 0,
    dangerRiskCount: 0,
    cautionRiskCount: 0,
    safeRiskCount: 0,
    lastSyncTime: null,
  },
  timestamp: '2026-08-14T00:00:00Z',
});

const emptyInventoryFilterOptionsBody = JSON.stringify({
  data: {
    channels: [],
    salesPoints: [],
    warehouses: [],
    regions: [],
    categories: [],
    storageTypes: [],
    riskGrades: [],
    assessmentStatuses: [],
  },
  timestamp: '2026-08-14T00:00:00Z',
});

const emptyDashboardBody = JSON.stringify({
  data: {
    summary: {},
    warehouses: [],
    offlineStores: [],
    riskSalesPointsTop10: [],
    urgentSkusTop5: [],
    calculatedAt: null,
  },
  timestamp: '2026-08-14T00:00:00Z',
});

const emptyStatisticsBody = JSON.stringify({
  data: {},
  timestamp: '2026-08-14T00:00:00Z',
});

const emptyInventorySyncLatestBody = JSON.stringify({
  data: null,
  timestamp: '2026-08-14T00:00:00Z',
});

const emptyAiStrategyListBody = JSON.stringify({
  data: {
    content: [],
    statusCounts: { all: 0, generating: 0, generated: 0, generationFailed: 0 },
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  },
  timestamp: '2026-08-24T00:00:00Z',
});

// 실제 백엔드 ApiResponse<T>와 같은 data/timestamp 봉투를 사용해 계약 차이를 테스트에서 드러냄
function jsonBody(data) {
  return JSON.stringify(data);
}

/** 보호 라우트 회귀 테스트가 실제 백엔드 상태에 영향을 받지 않도록 읽기 API를 비움 */
export async function mockInventoryReadSlice(page) {
  // 목록 요청에는 page/size/sort 쿼리가 붙으므로 query string까지 매칭한다.
  // 이 route는 보호 라우팅 테스트가 실행 중인 백엔드 인증 상태에 의존하지 않게 한다.
  await page.route('**/api/v1/inventories?*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyInventoryListBody }),
  );
  await page.route('**/api/v1/inventories/summary', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyInventorySummaryBody }),
  );
  await page.route('**/api/v1/inventories/filter-options', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyInventoryFilterOptionsBody }),
  );
  await page.route('**/api/v1/inventories', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyInventoryListBody }),
  );
  await page.route('**/api/v1/dashboard', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyDashboardBody }),
  );
  await page.route('**/api/v1/statistics/inventory**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyStatisticsBody }),
  );
  await page.route('**/api/v1/inventory-sync-runs/latest', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyInventorySyncLatestBody }),
  );
  await page.route('**/api/v1/ai-strategies?*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyAiStrategyListBody }),
  );
}

export async function mockAuthenticatedSession(page) {
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: jsonBody({ data: authenticatedUser, timestamp: '2026-08-14T00:00:00Z' }),
    }),
  );
  await page.addInitScript(() => {
    class MockEventSource {
      constructor(url, options = {}) {
        this.url = url;
        this.withCredentials = Boolean(options.withCredentials);
        this.readyState = 1;
        this.listeners = new Map();
      }

      addEventListener(eventName, listener) {
        const listeners = this.listeners.get(eventName) ?? new Set();
        listeners.add(listener);
        this.listeners.set(eventName, listeners);
      }

      removeEventListener(eventName, listener) {
        this.listeners.get(eventName)?.delete(listener);
      }

      close() {
        this.readyState = 2;
      }
    }

    window.EventSource = MockEventSource;
  });
  await page.route('**/api/v1/notifications/unread-count', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: jsonBody({ data: { unreadCount: 0 }, timestamp: '2026-08-26T00:00:00Z' }),
    }),
  );
  await page.route('**/api/v1/notifications', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: jsonBody({ data: [], timestamp: '2026-08-26T00:00:00Z' }),
    }),
  );
  await mockInventoryReadSlice(page);
}

export async function mockAnonymousSession(page) {
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: jsonBody({
        code: 'AUTH-001',
        message: '인증에 실패했습니다.',
        fieldErrors: [],
        path: '/api/v1/auth/me',
        timestamp: '2026-08-14T00:00:00Z',
      }),
    }),
  );
}

// 백엔드가 CSRF 응답과 함께 설정하는 쿠키를 재현해 Axios의 X-XSRF-TOKEN 헤더 생성을 검증함
export async function mockCsrfToken(page) {
  await page.route('**/api/v1/auth/csrf', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'set-cookie': 'XSRF-TOKEN=csrf-token; Path=/; SameSite=Lax' },
      body: jsonBody({
        data: { token: 'csrf-token', headerName: 'X-XSRF-TOKEN' },
        timestamp: '2026-08-14T00:00:00Z',
      }),
    }),
  );
}

export function successfulLoginBody() {
  return jsonBody({ data: authenticatedUser, timestamp: '2026-08-14T00:00:00Z' });
}
