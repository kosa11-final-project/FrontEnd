import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession } from './auth-mocks.js';
import { strategyGenerationFixtures } from '../src/widgets/strategy-generation-list/model/strategyFixtures.js';

const listCases = strategyGenerationFixtures.map((fixture) => ({
  strategyCaseId: fixture.id,
  caseName: fixture.strategyName,
  caseStatus: fixture.generationStatus,
  generationStage: fixture.generationStage,
  sku: {
    skuId: fixture.product.skuId,
    skuCode: fixture.product.skuCode,
    skuName: fixture.product.name,
    imageUrl: fixture.product.imageUrl,
    category: fixture.category
      ? {
          categoryId: fixture.category.id,
          categoryName: fixture.category.name,
          categoryLevel: fixture.category.level,
        }
      : null,
  },
  requester: { userId: 17, userName: '이주영' },
  createdAt: fixture.createdAt,
  completedAt: fixture.failure?.failedAt ?? null,
  resultExpiresAt: fixture.generationStatus === 'GENERATED' ? '2026-08-27T14:34:20+09:00' : null,
  failure: fixture.failure
    ? {
        code: 'GENERATION_FAILED',
        message: fixture.failure.summary,
        failedAt: fixture.failure.failedAt,
      }
    : null,
}));

function filterListCases(searchParams, { includeStatus = true } = {}) {
  const query = (searchParams.get('query') ?? '').trim().toLocaleLowerCase('ko-KR');
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  return listCases.filter((item) => {
    const searchable =
      `${item.strategyCaseId} ${item.caseName} ${item.sku.skuCode} ${item.sku.skuName}`.toLocaleLowerCase('ko-KR');
    if (query && !searchable.includes(query)) return false;
    const createdDate = item.createdAt.slice(0, 10);
    if (from && createdDate < from) return false;
    if (to && createdDate > to) return false;
    return !includeStatus || !status || item.caseStatus === status;
  });
}

async function mockAiStrategyList(page) {
  await page.route('**/api/v1/ai-strategies?*', (route) => {
    const url = new URL(route.request().url());
    const searchResult = filterListCases(url.searchParams, { includeStatus: false });
    const filtered = filterListCases(url.searchParams);
    const pageIndex = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 10);
    const content = filtered.slice(pageIndex * size, pageIndex * size + size);
    const totalPages = filtered.length ? Math.ceil(filtered.length / size) : 0;

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          content,
          statusCounts: {
            all: searchResult.length,
            generating: searchResult.filter(({ caseStatus }) => caseStatus === 'GENERATING').length,
            generated: searchResult.filter(({ caseStatus }) => caseStatus === 'GENERATED').length,
            generationFailed: searchResult.filter(({ caseStatus }) => caseStatus === 'GENERATION_FAILED').length,
          },
          page: pageIndex,
          size,
          totalElements: filtered.length,
          totalPages,
          first: pageIndex === 0,
          last: totalPages === 0 || pageIndex >= totalPages - 1,
        },
      }),
    });
  });
}

test.describe('AI 전략 생성 목록', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockAiStrategyList(page);
    await page.goto('/ai-strategy');
  });

  test('필수 정보와 상품 이미지를 포함하고 번들 항목은 표시하지 않는다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'AI 전략 및 시뮬레이션' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '전략 번호' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '전략명 · 최종 카테고리' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '상품' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '상태' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '생성일자' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '상세' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '구분' })).toHaveCount(0);
    await expect(page.getByText('번들', { exact: true })).toHaveCount(0);
    await expect(page.locator('[data-product-fallback="GF-SOUP-BEEF-06"]')).toBeVisible();
  });

  test('상태·검색·기간 필터를 URL과 목록에 반영한다', async ({ page }) => {
    await page.getByRole('button', { name: /생성중/ }).click();
    await expect(page).toHaveURL(/status=GENERATING/);
    await expect(page.getByRole('row').filter({ hasText: '#31' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: '#32' })).toHaveCount(0);

    await page.getByRole('button', { name: /^전체/ }).click();
    await page.getByPlaceholder('Case ID, 전략명, SKU·상품명 검색').fill('닭가슴살 샐러드');
    await expect(page).toHaveURL(/q=/);
    await expect(page.getByRole('row').filter({ hasText: '#22' })).toBeVisible();
    await expect(page.getByText('총 1건')).toBeVisible();

    await page.getByPlaceholder('Case ID, 전략명, SKU·상품명 검색').fill('');
    await page.getByLabel('시작일').fill('2026-08-16');
    await page.getByLabel('종료일').fill('2026-08-17');
    await expect(page).toHaveURL(/from=2026-08-16/);
    await expect(page).toHaveURL(/to=2026-08-17/);
    await expect(page.getByText('총 3건')).toBeVisible();
  });

  test('서버가 제공한 전체 상태 건수를 탭에 표시하고 EXPIRED는 노출하지 않는다', async ({ page }) => {
    await expect(page.getByRole('button', { name: /전체.*12/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /생성완료.*6/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /생성중.*3/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /생성실패.*3/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /만료/ })).toHaveCount(0);
  });

  test('화면 페이지를 API 0-based 페이지로 변환하고 필터 변경 시 첫 페이지로 돌아간다', async ({ page }) => {
    const requestedUrls = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/v1/ai-strategies') requestedUrls.push(request.url());
    });

    await page.goto('/ai-strategy?page=2');
    await expect.poll(() => requestedUrls.some((url) => new URL(url).searchParams.get('page') === '1')).toBe(true);

    await page.getByRole('button', { name: /생성완료/ }).click();
    await expect(page).toHaveURL(/status=GENERATED/);
    await expect(page).not.toHaveURL(/page=/);
    await expect
      .poll(() =>
        requestedUrls.some((url) => {
          const params = new URL(url).searchParams;
          return params.get('page') === '0' && params.get('status') === 'GENERATED';
        }),
      )
      .toBe(true);
  });

  test('목록 API 오류와 전체·검색 빈 상태를 구분한다', async ({ page }) => {
    await page.unroute('**/api/v1/ai-strategies?*');
    await page.route('**/api/v1/ai-strategies?*', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'INTERNAL_ERROR', message: '목록 조회 실패' }),
      }),
    );
    await page.reload();
    await expect(page.getByRole('alert')).toContainText('AI 전략 생성 목록을 불러오지 못했습니다.');
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();

    await page.unroute('**/api/v1/ai-strategies?*');
    await page.route('**/api/v1/ai-strategies?*', (route) => {
      const url = new URL(route.request().url());
      const pageIndex = Number(url.searchParams.get('page') ?? 0);
      const size = Number(url.searchParams.get('size') ?? 10);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            content: [],
            statusCounts: { all: 0, generating: 0, generated: 0, generationFailed: 0 },
            page: pageIndex,
            size,
            totalElements: 0,
            totalPages: 0,
            first: true,
            last: true,
          },
        }),
      });
    });
    await page.reload();
    await expect(page.getByText('아직 생성 요청한 AI 전략이 없습니다.')).toBeVisible();

    await page.goto('/ai-strategy?q=없는상품');
    await expect(page.getByText('검색 조건에 맞는 AI 전략이 없습니다.')).toBeVisible();
  });

  test('첫 목록 응답을 기다리는 동안 loading 상태를 표시한다', async ({ page }) => {
    await page.unroute('**/api/v1/ai-strategies?*');
    let pendingRoute;
    await page.route('**/api/v1/ai-strategies?*', (route) => {
      pendingRoute = route;
    });

    await page.reload();
    await expect(page.getByText('AI 전략 생성 목록을 불러오고 있습니다.')).toBeVisible();
    await expect.poll(() => Boolean(pendingRoute)).toBe(true);
    await pendingRoute.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
      }),
    });
    await expect(page.getByText('AI 전략 생성 목록을 불러오고 있습니다.')).toHaveCount(0);
  });

  test('생성완료 전략은 비교·시뮬레이션 상세 경로로 이동한다', async ({ page }) => {
    await page.getByRole('button', { name: '#32 비교·시뮬레이션으로 이동' }).click();
    await expect(page).toHaveURL(/\/ai-strategy\/32$/);
    await expect(page.getByRole('heading', { name: '버섯 들깨탕 수도권 재배치 전략' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '추천 전략 요약 비교' })).toBeVisible();
    await expect(page.getByRole('link', { name: /시뮬레이션 보기/ })).toHaveCount(4);
    await expect(page.getByText(/9개 중/)).toHaveCount(0);
  });

  test('상세 화면에서 목록으로 돌아오면 URL 검색 조건을 복원한다', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Case ID, 전략명, SKU·상품명 검색');
    await searchInput.fill('버섯 들깨탕');
    await expect(page).toHaveURL(/q=/);
    await page.getByRole('button', { name: '#32 비교·시뮬레이션으로 이동' }).click();

    await page.getByRole('link', { name: '목록으로' }).click();

    await expect(page).toHaveURL(/\/ai-strategy\?q=/);
    await expect(page.getByPlaceholder('Case ID, 전략명, SKU·상품명 검색')).toHaveValue('버섯 들깨탕');
    await expect(page.getByRole('row').filter({ hasText: '#32' })).toBeVisible();
  });

  test('전략 요약에서 기존 데모형 시뮬레이션으로 이동하고 대안을 전환한다', async ({ page }) => {
    await page.goto('/ai-strategy/32');
    await page
      .getByRole('link', { name: /시뮬레이션 보기/ })
      .first()
      .click();

    await expect(page).toHaveURL(/\/ai-strategy\/32\/simulation\?option=opt-transfer-discount/);
    await expect(page.getByRole('heading', { name: '전략 비교 시뮬레이션' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '조건 조정' })).toBeVisible();
    await expect(page.getByTestId('strategy-simulation-chart')).toBeVisible();
    await expect(page.getByLabel('이동 수량')).toBeEnabled();
    await expect(page.getByLabel('할인 적용 수량')).toBeEnabled();
    await expect(page.getByLabel('할인율')).toBeEnabled();
    await expect(page.getByRole('button', { name: /조정안 저장/ })).toBeEnabled();
    await expect(page.getByRole('button', { name: /Teams 검토 요청/ })).toBeDisabled();

    const expectedSalesRow = page.getByRole('row').filter({ hasText: '예상 판매량' });
    const recommendedResult = await expectedSalesRow.textContent();
    await page.getByLabel('이동 수량').fill('10');
    await expect(expectedSalesRow).not.toHaveText(recommendedResult);

    await page.getByRole('button', { name: /조정안 저장/ }).click();
    await expect(page.getByText('조정안 저장됨')).toBeVisible();

    await page.getByRole('button', { name: /고수요 판매처 중심 재고 재할당/ }).click();
    await expect(page).toHaveURL(/option=opt-reallocation/);
    await expect(
      page.getByText('같은 물류센터 권역 안에서 판매속도가 높은 판매처에 할당량을 우선 배분합니다.'),
    ).toBeVisible();
    await expect(page.getByLabel('재할당 수량')).toBeEnabled();
    await expect(page.getByLabel('할인율')).toHaveCount(0);
    await expect(page.getByLabel(/전략 판매가/)).toHaveCount(0);
  });

  test('전략별 조건 조정값을 전환 후에도 유지한다', async ({ page }) => {
    await page.goto('/ai-strategy/32/simulation?option=opt-reallocation');

    await page.getByLabel('재할당 수량').fill('12');
    await page.getByRole('button', { name: /백화점·그리팅몰 판매채널 확대/ }).click();
    await expect(page.getByLabel('채널 적용 수량')).toBeVisible();
    await page.getByRole('button', { name: /고수요 판매처 중심 재고 재할당/ }).click();

    await expect(page.getByLabel('재할당 수량')).toHaveValue('12');
  });

  test('활성 전략과 최종안 선택을 독립적으로 유지한다', async ({ page }) => {
    await page.goto('/ai-strategy/32/simulation?option=opt-transfer-discount');

    await expect(page.getByRole('radio')).toHaveCount(0);
    await page.getByRole('button', { name: /이 전략을 최종안으로 선택/ }).click();
    await expect(page.getByText('1안을 최종안으로 표시 중입니다.')).toBeVisible();
    await page.getByRole('button', { name: /백화점·그리팅몰 판매채널 확대/ }).click();

    await expect(page).toHaveURL(/option=opt-channel-expansion/);
    await expect(page.getByText('1안을 최종안으로 표시 중입니다.')).toBeVisible();
    await expect(page.getByText('최종', { exact: true })).toHaveCount(1);
  });

  test('만료되거나 존재하지 않는 Case의 전용 상태를 표시한다', async ({ page }) => {
    await page.goto('/ai-strategy/999');
    await expect(page.getByText('AI 전략 결과가 만료되었습니다.')).toBeVisible();

    await page.goto('/ai-strategy/404');
    await expect(page.getByText('AI 전략 결과를 찾을 수 없습니다.')).toBeVisible();
  });

  test('좁은 화면에서 전략 카드와 조건 패널을 재배치하고 차트 폭을 화면에 맞춘다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ai-strategy/32/simulation?option=opt-transfer-discount');

    await expect(page.getByRole('heading', { name: '조건 조정' })).toBeVisible();
    await expect(page.getByRole('button', { name: /상위 수요 채널 집중 운영/ })).toBeVisible();

    const chart = page.getByTestId('strategy-simulation-chart');
    const panel = page.getByTestId('strategy-condition-panel');
    await expect.poll(() => chart.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect.poll(() => panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
      .toBe(true);
  });

  test('생성중 Drawer를 열고 Escape로 닫은 뒤 화살표로 포커스를 복귀한다', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '#31 생성 상태 상세 보기' });
    await trigger.click();
    await expect(page.getByRole('dialog', { name: '생성 진행 상세' })).toBeVisible();
    await expect(page.getByText('AI 전략 생성 단계가 진행 중입니다.')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('생성실패 Drawer에서 사유와 비활성 재시도를 표시한다', async ({ page }) => {
    await page.getByRole('button', { name: '#30 생성 상태 상세 보기' }).click();
    await expect(page.getByRole('dialog', { name: '생성 실패 상세' })).toBeVisible();
    await expect(
      page.getByText('수요예측 입력 데이터 일부를 불러오지 못했습니다. 데이터 상태를 확인해 주세요.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 생성' })).toBeDisabled();
    await expect(page.getByText('재시도 API 연결 후 사용할 수 있습니다.')).toBeVisible();
  });

  test('좁은 화면에서도 테이블을 가로로 탐색할 수 있다', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const table = page.getByRole('table', { name: 'AI 전략 생성 목록' });
    await expect(table).toBeVisible();
    expect(
      await table.evaluate((element) => element.parentElement.scrollWidth > element.parentElement.clientWidth),
    ).toBe(true);
  });
});
