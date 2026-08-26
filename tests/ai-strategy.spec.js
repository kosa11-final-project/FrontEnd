import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession } from './auth-mocks.js';
import { strategyDetailFixtures } from '../src/pages/ai-strategy/model/strategyDetailFixtures.js';
import { strategyGenerationFixtures } from '../src/widgets/strategy-generation-list/model/strategyFixtures.js';

const LIST_PRODUCT_IMAGE_DATA_URL =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56"%3E%3Crect width="56" height="56" fill="%23d1fae5"/%3E%3C/svg%3E';

const listCases = strategyGenerationFixtures.map((fixture) => ({
  strategyCaseId: fixture.id,
  caseName: fixture.strategyName,
  caseStatus: fixture.generationStatus,
  generationStage: fixture.generationStage,
  sku: {
    skuId: fixture.product.skuId,
    skuCode: fixture.product.skuCode,
    skuName: fixture.product.name,
    imageUrl: fixture.id === 32 ? LIST_PRODUCT_IMAGE_DATA_URL : null,
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

function toBackendSimulation(option, baselineSummary) {
  const summary = option.simulationSummary;
  const comparison = summary.comparisonToBaseline;
  return {
    candidateId: option.optionKey,
    summary: {
      expectedSalesQty: summary.expectedSalesQty,
      expectedRevenue: summary.expectedRevenue,
      totalContributionMargin: summary.totalContributionMargin,
      contributionMarginRate: summary.contributionMarginRate,
      expectedSellThroughDays: summary.expectedSellThroughDays,
      expectedRemainingQty: summary.expectedRemainingQty,
      expectedDisposalQty: Math.max(0, baselineSummary.expectedDisposalQty - comparison.reducedDisposalQty),
      estimatedActionCost: summary.movementCost,
      netEffect: comparison.incrementalEconomicBenefit,
    },
    comparisonToBaseline: {
      salesQtyDelta: comparison.incrementalSalesQty,
      revenueDelta: comparison.incrementalRevenue,
      contributionMarginDelta: comparison.incrementalContributionMargin,
      remainingQtyReduction: comparison.reducedRemainingQty,
      disposalQtyReduction: comparison.reducedDisposalQty,
      netEffect: comparison.incrementalEconomicBenefit,
    },
    dailySeries: option.simulationDailySeries,
    assumptions: [],
  };
}

function toBackendDetail(strategyCase) {
  const conditions = strategyCase.requestConditions;
  return {
    strategyCaseId: strategyCase.strategyCaseId,
    caseName: strategyCase.caseName,
    caseStatus: strategyCase.caseStatus,
    generationStage: 'COMPARISON_READY',
    sku: strategyCase.sku,
    requester: strategyCase.requestedBy,
    createdAt: strategyCase.requestedAt,
    completedAt: strategyCase.completedAt,
    resultExpiresAt: strategyCase.resultExpiresAt,
    requestConditions: {
      sourceSalesPoint: conditions.sourceSalesPointId
        ? {
            salesPointId: conditions.sourceSalesPointId,
            salesPointCode: `SP-${conditions.sourceSalesPointId}`,
            salesPointName: conditions.sourceSalesPointName,
          }
        : null,
      lots: (conditions.lotIds ?? []).map((lotId, index) => ({
        lotId,
        lotCode: conditions.lotLabels?.[index] ?? `LOT-${lotId}`,
      })),
      candidateSalesPoints: (conditions.candidateSalesPointIds ?? []).map((salesPointId, index) => ({
        salesPointId,
        salesPointCode: `SP-${salesPointId}`,
        salesPointName: conditions.candidateSalesPointNames?.[index] ?? `판매처 ${salesPointId}`,
      })),
      strategyTypes: conditions.strategyTypes ?? [],
      preferredStartDate: conditions.preferredStartDate,
      preferredEndDate: conditions.preferredEndDate,
      forecastStartDate: conditions.preferredStartDate,
      forecastEndDate: conditions.preferredEndDate,
    },
    result: {
      generatedAt: strategyCase.completedAt,
      baselineSimulation: strategyCase.baselineSimulation,
      noRecommendation: strategyCase.noRecommendation ?? null,
      options: strategyCase.options.map((option) => ({
        rank: option.rank,
        optionName: option.optionName,
        recommendationReason: option.recommendationReason,
        advantage: option.advantage,
        caution: option.caution,
        adjustmentConstraints: option.adjustmentConstraints ?? {
          minimumStartDate: option.actions[0]?.startDate,
          latestSelectableEndDate: option.actions[0]?.endDate,
          maximumPeriodDays: 90,
          requiresPeriodAdjustment: false,
        },
        chartRange: option.chartRange ?? {
          startDate: option.actions[0]?.startDate,
          endDate: option.actions[0]?.endDate,
        },
        candidate: {
          candidateId: option.optionKey,
          strategyTypes: [...new Set(option.actions.map(({ actionType }) => actionType))],
          startDate: option.actions[0]?.startDate,
          endDate: option.actions.some(({ actionType }) => ['REALLOCATION', 'RT_TRANSFER'].includes(actionType))
            ? null
            : option.actions[0]?.endDate,
          assumptions: [],
          preference: null,
          maxExecutableQty: Math.max(...option.actions.map(({ actionQuantity }) => actionQuantity ?? 0)),
          actions: option.actions.map((action) => ({
            actionType: action.actionType,
            sourceLocation: action.sourceLocation,
            targetLocation: action.targetLocation,
            actionQuantity: action.actionQuantity,
            estimatedActionCost: action.estimatedActionCost,
            strategyPrice: action.strategyPrice,
            discountRate: action.discountRate,
            lotAllocations: (action.lotAllocations ?? []).map((allocation) => ({
              inventoryBalanceId: allocation.inventoryBalanceId ?? allocation.lotId,
              lotId: allocation.lotId,
              lotCode: allocation.lotCode,
              quantity: allocation.allocatedQuantity,
              priorityNo: allocation.priorityNo,
            })),
          })),
        },
        simulation: toBackendSimulation(option, strategyCase.baselineSimulation.summary),
      })),
    },
  };
}

async function mockAiStrategyDetail(page) {
  const teamsState = new Map();
  const failedOnce = new Set();

  await page.route('**/api/v1/ai-strategies/reviewers', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          reviewers: [
            {
              reviewerId: 101,
              reviewerName: '이주영',
              email: 'first@example.com',
              organizationName: 'System',
              roleName: '그린푸드 총괄',
            },
            {
              reviewerId: 102,
              reviewerName: '이주영',
              email: 'second@example.com',
              organizationName: 'System',
              roleName: '그린푸드 총괄',
            },
          ],
        },
      }),
    }),
  );

  await page.route(/\/api\/v1\/ai-strategies\/\d+\/selection-validations$/, async (route) => {
    const strategyCaseId = Number(
      route
        .request()
        .url()
        .match(/ai-strategies\/(\d+)\/selection-validations$/)?.[1],
    );
    const payload = route.request().postDataJSON();
    const strategyCase = strategyDetailFixtures.find((item) => item.strategyCaseId === strategyCaseId);
    const option = strategyCase?.options.find((item) => item.optionKey === payload.optionId);
    const quantityAction = option?.actions.find(({ actionQuantity }) => actionQuantity !== null);
    const conditions = payload.adjustedConditions ?? {
      actionQuantity: quantityAction?.actionQuantity,
      startDate: quantityAction?.startDate,
      endDate: quantityAction?.endDate,
    };

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          strategyCaseId,
          optionId: payload.optionId,
          valid: true,
          selectionSource: payload.adjustedConditions ? 'USER_SELECT' : 'AI_RECOMMENDED',
          actionQuantity: conditions.actionQuantity,
          startDate: conditions.startDate,
          endDate: conditions.endDate,
          validatedAt: '2026-08-25T18:30:00',
        },
      }),
    });
  });

  await page.route(/\/api\/v1\/ai-strategies\/\d+\/teams-requests$/, async (route) => {
    const strategyCaseId = Number(
      route
        .request()
        .url()
        .match(/ai-strategies\/(\d+)\/teams-requests$/)?.[1],
    );
    const payload = route.request().postDataJSON();
    const reviewers = payload.reviewerIds.map((reviewerId) => {
      const shouldFail = reviewerId === 102 && !failedOnce.has(reviewerId);
      if (shouldFail) failedOnce.add(reviewerId);
      return {
        reviewerId,
        reviewerName: '이주영',
        email: reviewerId === 101 ? 'first@example.com' : 'second@example.com',
        deliveryStatus: shouldFail ? 'FAILED' : 'SENT',
        failureCode: shouldFail ? 'POWER_AUTOMATE_FAILED' : null,
      };
    });
    const allSent = reviewers.every(({ deliveryStatus }) => deliveryStatus === 'SENT');
    const result = {
      strategyCaseId,
      selectedOptionId: payload.optionId,
      strategyOptionId: 55,
      finalSelectionId: 44,
      caseStatus: allSent ? 'READY_TO_EXECUTE' : 'GENERATED',
      deliveryStatus: allSent ? 'SENT' : 'PARTIAL_FAILED',
      reviewers,
    };
    teamsState.set(strategyCaseId, result);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: result }) });
  });

  await page.route(/\/api\/v1\/ai-strategies\/\d+$/, (route) => {
    const strategyCaseId = route
      .request()
      .url()
      .match(/\/(\d+)$/)?.[1];
    const strategyCase = strategyDetailFixtures.find((item) => String(item.strategyCaseId) === strategyCaseId);
    if (!strategyCase) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'AI_STRATEGY_CASE_NOT_FOUND', message: 'Case를 찾을 수 없습니다.' }),
      });
    }
    if (strategyCase.caseStatus === 'EXPIRED') {
      return route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'AI_STRATEGY_RESULT_EXPIRED', message: '결과가 만료되었습니다.' }),
      });
    }
    const detail = toBackendDetail(strategyCase);
    const sentState = teamsState.get(Number(strategyCaseId));
    if (sentState) {
      detail.caseStatus = sentState.caseStatus;
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: detail }),
    });
  });

  await page.route(/\/api\/v1\/ai-strategies\/\d+\/candidates\/[^/]+\/simulations$/, async (route) => {
    const request = route.request();
    const [, strategyCaseId, encodedCandidateId] = request
      .url()
      .match(/\/ai-strategies\/(\d+)\/candidates\/([^/]+)\/simulations$/);
    const candidateId = decodeURIComponent(encodedCandidateId);
    const strategyCase = strategyDetailFixtures.find((item) => String(item.strategyCaseId) === strategyCaseId);
    const option = strategyCase?.options.find((item) => item.optionKey === candidateId);
    const conditions = request.postDataJSON();
    const original = toBackendSimulation(option, strategyCase.baselineSimulation.summary);
    const initialStock = strategyCase.baselineSimulation.dailySeries[0].expectedRemainingQty;
    const originalActionQuantity = Math.max(...option.actions.map(({ actionQuantity }) => actionQuantity ?? 0));
    const reducedActionQuantity = Math.max(0, originalActionQuantity - Number(conditions.actionQuantity));
    const expectedSalesQty = Math.max(0, original.summary.expectedSalesQty - Math.ceil(reducedActionQuantity / 10));
    const expectedRemainingQty = Math.max(0, initialStock - expectedSalesQty);
    const resultRatio = expectedSalesQty / original.summary.expectedSalesQty;
    const expectedRevenue = Math.round(original.summary.expectedRevenue * resultRatio);
    const totalContributionMargin = Math.round(original.summary.totalContributionMargin * resultRatio);
    const baselineSummary = strategyCase.baselineSimulation.summary;
    const dailyCount = original.dailySeries.length;
    const dailySeries = original.dailySeries.map((point, index) => {
      const progress = index / Math.max(1, dailyCount - 1);
      return {
        ...point,
        expectedRemainingQty: Math.round(initialStock - expectedSalesQty * progress),
        cumulativeRevenue: Math.round(expectedRevenue * progress),
        cumulativeContributionMargin: Math.round(totalContributionMargin * progress),
      };
    });

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          strategyCaseId: Number(strategyCaseId),
          candidateId,
          adjustedConditions: {
            ...conditions,
            strategyPrice: option.actions.find(({ actionType }) => actionType === 'PRICE_DISCOUNT')?.strategyPrice,
            maximumExecutableQuantity: 40,
            salesPointGroup: 'GENERAL',
            maximumDiscountRate: 0.3,
          },
          adjustmentConstraints: {
            minimumStartDate: conditions.startDate,
            latestSelectableEndDate: conditions.endDate,
            maximumPeriodDays: 90,
            requiresPeriodAdjustment: false,
          },
          chartRange: { startDate: conditions.startDate, endDate: conditions.endDate },
          simulation: {
            ...original,
            summary: {
              ...original.summary,
              expectedSalesQty,
              expectedRemainingQty,
              expectedRevenue,
              totalContributionMargin,
              contributionMarginRate: expectedRevenue === 0 ? 0 : totalContributionMargin / expectedRevenue,
            },
            comparisonToBaseline: {
              ...original.comparisonToBaseline,
              salesQtyDelta: expectedSalesQty - baselineSummary.expectedSalesQty,
              revenueDelta: expectedRevenue - baselineSummary.expectedRevenue,
              contributionMarginDelta: totalContributionMargin - baselineSummary.totalContributionMargin,
              remainingQtyReduction: baselineSummary.expectedRemainingQty - expectedRemainingQty,
            },
            dailySeries,
          },
        },
      }),
    });
  });
}

test.describe('AI 전략 생성 목록', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockAiStrategyList(page);
    await mockAiStrategyDetail(page);
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

  test('생성중 Case 폴링 후에도 기존 상품 이미지를 재마운트하지 않는다', async ({ page }) => {
    const productImage = page.getByRole('row').filter({ hasText: '#32' }).locator('img');
    await expect(productImage).toBeVisible();
    await productImage.evaluate((element) => {
      element.dataset.pollingIdentity = 'preserved';
    });

    await page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === '/api/v1/ai-strategies' && response.request().method() === 'GET';
    });

    await expect.poll(() => productImage.getAttribute('data-polling-identity')).toBe('preserved');
  });

  test('상태·검색·기간 필터를 URL과 목록에 반영한다', async ({ page }) => {
    await page.getByRole('button', { name: /생성중/ }).click();
    await expect(page).toHaveURL(/status=GENERATING/);
    await expect(page.getByRole('row').filter({ hasText: '#31' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: '#32' })).toHaveCount(0);

    await page.getByRole('button', { name: /^전체/ }).click();
    const searchInput = page.getByPlaceholder('Case ID, 전략명, SKU·상품명 검색');
    await searchInput.fill('닭가슴살 샐러드');
    await expect(page).toHaveURL(/q=/);
    await expect(searchInput).toBeFocused();
    await expect(page.getByRole('row').filter({ hasText: '#22' })).toBeVisible();
    await expect(page.getByText('총 1건')).toBeVisible();

    await searchInput.fill('');
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
    await expect(page.getByRole('button', { name: /최종안/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Teams/ })).toHaveCount(0);
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

  test('최종안을 선택한 뒤 Reviewer를 다중 선택해 ID로 Teams 검토를 요청한다', async ({ page }) => {
    let reviewerRequested = false;
    const validationPayloads = [];
    const teamsPayloads = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname === '/api/v1/ai-strategies/reviewers') reviewerRequested = true;
      if (url.pathname.endsWith('/selection-validations')) validationPayloads.push(request.postDataJSON());
      if (url.pathname.endsWith('/teams-requests')) teamsPayloads.push(request.postDataJSON());
    });

    await page.goto('/ai-strategy/32');
    await expect(page.getByRole('button', { name: /최종안/ })).toHaveCount(0);
    await page
      .getByRole('link', { name: /시뮬레이션 보기/ })
      .first()
      .click();

    const teamsButton = page.getByRole('button', { name: 'Teams 검토 요청' });
    await expect(teamsButton).toBeDisabled();
    expect(reviewerRequested).toBe(false);

    await page.getByRole('button', { name: '이 전략을 최종안으로 선택' }).click();
    await expect(teamsButton).toBeEnabled();
    expect(validationPayloads).toEqual([{ optionId: 'opt-transfer-discount' }]);
    await teamsButton.click();
    await expect(page.getByRole('dialog', { name: 'Reviewer 선택' })).toBeVisible();
    await expect.poll(() => reviewerRequested).toBe(true);
    await expect(page.getByText('first@example.com')).toBeVisible();
    await expect(page.getByText('second@example.com')).toBeVisible();
    await expect(page.getByText(/reviewerId/i)).toHaveCount(0);

    const submitButton = page.getByRole('button', { name: 'Teams로 전송' }).last();
    await expect(submitButton).toBeDisabled();
    await page.getByLabel('이주영 first@example.com 선택').check();
    await page.getByLabel('이주영 second@example.com 선택').check();
    await page.getByRole('button', { name: 'Teams로 전송 (2명)' }).click();

    await expect
      .poll(() => teamsPayloads[0])
      .toEqual({
        optionId: 'opt-transfer-discount',
        reviewerIds: [101, 102],
      });
    await expect(page.getByText('1명에게 Teams 검토 요청을 전송했습니다.')).toBeVisible();
    await expect(page.getByText('1명에게 전송하지 못했습니다.')).toBeVisible();
    await expect(page.getByText('POWER_AUTOMATE_FAILED')).toBeVisible();
    await page.getByRole('button', { name: 'Reviewer 선택 모달 닫기' }).click();
    await expect(page.getByRole('button', { name: '최종안 선택됨' })).toBeDisabled();
    await page.getByRole('button', { name: 'Teams 전송 결과' }).click();
    await expect(page.getByText('POWER_AUTOMATE_FAILED')).toBeVisible();
    await page.getByRole('button', { name: '실패 대상 재시도 (1명)' }).click();
    await expect
      .poll(() => teamsPayloads[1])
      .toEqual({
        optionId: 'opt-transfer-discount',
        reviewerIds: [102],
      });
    await expect(page.getByText('2명에게 Teams 검토 요청을 전송했습니다.')).toBeVisible();
    await expect(page.getByText('Teams 검토 요청 완료')).toBeVisible();
  });

  test('사전 검증 성공 전에는 최종안을 표시하지 않고 검증 중 중복 클릭을 막는다', async ({ page }) => {
    let pendingRoute;
    let validationCalls = 0;
    await page.route('**/api/v1/ai-strategies/32/selection-validations', (route) => {
      validationCalls += 1;
      pendingRoute = route;
    });
    await page.goto('/ai-strategy/32/simulation?option=opt-transfer-discount');

    await page.getByRole('button', { name: '이 전략을 최종안으로 선택' }).click();
    await expect(page.getByRole('button', { name: '최종안 검증 중...' })).toBeDisabled();
    await expect(page.getByText('최종안이 선택되었습니다.')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Teams 검토 요청' })).toBeDisabled();
    expect(validationCalls).toBe(1);

    await pendingRoute.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          strategyCaseId: 32,
          optionId: 'opt-transfer-discount',
          valid: true,
          selectionSource: 'AI_RECOMMENDED',
          actionQuantity: 40,
          startDate: '2026-08-20',
          endDate: '2026-08-27',
          validatedAt: '2026-08-25T18:30:00',
        },
      }),
    });
    await expect(page.getByRole('button', { name: '최종안 선택됨' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Teams 검토 요청' })).toBeEnabled();
  });

  test('기존 최종안이 있어도 다른 전략 검증 중에는 Teams 요청을 차단한다', async ({ page }) => {
    let pendingValidationRoute;
    let reviewerRequested = false;
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/v1/ai-strategies/reviewers') reviewerRequested = true;
    });
    await page.route('**/api/v1/ai-strategies/32/selection-validations', async (route) => {
      const payload = route.request().postDataJSON();
      if (payload.optionId === 'opt-reallocation') {
        pendingValidationRoute = route;
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            strategyCaseId: 32,
            optionId: payload.optionId,
            valid: true,
            selectionSource: 'AI_RECOMMENDED',
            actionQuantity: 40,
            startDate: '2026-08-20',
            endDate: '2026-08-27',
            validatedAt: '2026-08-25T18:30:00',
          },
        }),
      });
    });
    await page.goto('/ai-strategy/32/simulation?option=opt-transfer-discount');

    const teamsButton = page.getByRole('button', { name: 'Teams 검토 요청' });
    await page.getByRole('button', { name: '이 전략을 최종안으로 선택' }).click();
    await expect(teamsButton).toBeEnabled();
    await page.getByRole('button', { name: /고수요 판매처 중심 재고 재할당/ }).click();
    await page.getByRole('button', { name: '이 전략을 최종안으로 선택' }).click();

    await expect(page.getByRole('button', { name: '최종안 검증 중...' })).toBeDisabled();
    await expect(teamsButton).toBeDisabled();
    expect(reviewerRequested).toBe(false);

    await pendingValidationRoute.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          strategyCaseId: 32,
          optionId: 'opt-reallocation',
          valid: true,
          selectionSource: 'AI_RECOMMENDED',
          actionQuantity: 32,
          startDate: '2026-08-20',
          endDate: '2026-08-27',
          validatedAt: '2026-08-25T18:31:00',
        },
      }),
    });

    await expect(page.getByText('2안을 최종안으로 표시 중입니다.')).toBeVisible();
    await expect(teamsButton).toBeEnabled();
  });

  test('사전 검증 실패 시 최종안과 Reviewer 흐름을 열지 않는다', async ({ page }) => {
    let reviewerRequested = false;
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/v1/ai-strategies/reviewers') reviewerRequested = true;
    });
    await page.route('**/api/v1/ai-strategies/32/selection-validations', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'INTERNAL_SERVER_ERROR', message: '검증 서버 오류' }),
      }),
    );
    await page.goto('/ai-strategy/32/simulation?option=opt-transfer-discount');

    await page.getByRole('button', { name: '이 전략을 최종안으로 선택' }).click();

    await expect(page.getByRole('alert')).toContainText('검증 서버 오류');
    await expect(page.getByRole('button', { name: 'Teams 검토 요청' })).toBeDisabled();
    await expect(page.getByRole('dialog', { name: 'Reviewer 선택' })).toHaveCount(0);
    expect(reviewerRequested).toBe(false);
  });

  test('조정 최종안은 사전 검증과 Teams 요청에 동일한 네 가지 조건을 보낸다', async ({ page }) => {
    const validationPayloads = [];
    const teamsPayloads = [];
    page.on('request', (request) => {
      const pathname = new URL(request.url()).pathname;
      if (pathname.endsWith('/selection-validations')) validationPayloads.push(request.postDataJSON());
      if (pathname.endsWith('/teams-requests')) teamsPayloads.push(request.postDataJSON());
    });
    await page.goto('/ai-strategy/32/simulation?option=opt-transfer-discount');

    await page.getByLabel('이동 수량').fill('10');
    await expect(page.getByText('서버 계산 완료')).toBeVisible();
    await page.getByRole('button', { name: '이 전략을 최종안으로 선택' }).click();
    await page.getByRole('button', { name: 'Teams 검토 요청' }).click();
    await page.getByLabel('이주영 first@example.com 선택').check();
    await page.getByRole('button', { name: 'Teams로 전송 (1명)' }).click();

    const expectedSelection = {
      optionId: 'opt-transfer-discount',
      adjustedConditions: {
        actionQuantity: 10,
        discountRate: 0.15,
        startDate: '2026-08-20',
        endDate: '2026-08-27',
      },
    };
    expect(validationPayloads).toEqual([expectedSelection]);
    await expect.poll(() => teamsPayloads[0]).toEqual({ ...expectedSelection, reviewerIds: [101] });
  });

  test('최종안 선택 후 해당 옵션의 조건을 바꾸면 선택을 즉시 무효화한다', async ({ page }) => {
    await page.goto('/ai-strategy/32/simulation?option=opt-transfer-discount');
    await page.getByRole('button', { name: '이 전략을 최종안으로 선택' }).click();
    await expect(page.getByRole('button', { name: 'Teams 검토 요청' })).toBeEnabled();

    await page.getByLabel('이동 수량').fill('10');

    await expect(page.getByText('최종안이 선택되었습니다.')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Teams 검토 요청' })).toBeDisabled();
    await expect(page.getByText('최종', { exact: true })).toHaveCount(0);
  });

  test('사전 검증의 선택 충돌은 일반 오류 대신 전용 모달로 안내한다', async ({ page }) => {
    await page.route('**/api/v1/ai-strategies/32/selection-validations', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'AI_STRATEGY-017',
          message: '전략 생성 이후 실행 조건이 변경되었습니다.',
          details: {
            reason: 'INSUFFICIENT_INVENTORY',
            requestedQuantity: 40,
            currentAvailableQuantity: 18,
            retryableWithAdjustment: true,
          },
        }),
      }),
    );
    await page.goto('/ai-strategy/32/simulation?option=opt-transfer-discount');

    await page.getByRole('button', { name: '이 전략을 최종안으로 선택' }).click();

    await expect(page.getByRole('dialog', { name: '전략을 실행할 수 없습니다' })).toBeVisible();
    await expect(page.getByText('Teams 검토 요청을 전송하지 못했습니다.')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Teams 검토 요청' })).toBeDisabled();
  });

  test('최종안 전송 조건이 변경되면 전용 안내 후 입력값을 유지한 채 다시 조정한다', async ({ page }) => {
    await page.route('**/api/v1/ai-strategies/32/teams-requests', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'AI_STRATEGY-017',
          message: '전략 생성 이후 실행 조건이 변경되었습니다.',
          details: {
            reason: 'INSUFFICIENT_INVENTORY',
            requestedQuantity: 29,
            currentAvailableQuantity: 18,
            retryableWithAdjustment: true,
          },
        }),
      }),
    );
    await page.goto('/ai-strategy/32/simulation?option=opt-transfer-discount');

    await page.getByLabel('이동 수량').fill('10');
    await page.getByRole('button', { name: '이 전략을 최종안으로 선택' }).click();
    await page.getByRole('button', { name: 'Teams 검토 요청' }).click();
    await page.getByLabel('이주영 first@example.com 선택').check();
    await page.getByRole('button', { name: 'Teams로 전송 (1명)' }).click();

    const conflictDialog = page.getByRole('dialog', { name: '전략을 실행할 수 없습니다' });
    await expect(conflictDialog).toBeVisible();
    await expect(conflictDialog.getByText('현재 가용재고가 부족합니다.')).toBeVisible();
    await expect(conflictDialog.getByText('요청 수량 29개 · 현재 가용재고 18개')).toBeVisible();
    await expect(page.getByText('Teams 검토 요청을 전송하지 못했습니다.')).toHaveCount(0);

    await conflictDialog.getByRole('button', { name: '최신 조건으로 다시 조정' }).click();
    await expect(conflictDialog).toHaveCount(0);
    await expect(page.getByLabel('이동 수량')).toHaveValue('10');
    await expect(page.getByText('서버 계산 완료')).toBeVisible();
  });

  test('실행 조건 충돌 안내에서 새 전략 생성 진입점으로 이동한다', async ({ page }) => {
    await page.route('**/api/v1/ai-strategies/32/teams-requests', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'AI_STRATEGY-017',
          message: '전략 생성 이후 실행 조건이 변경되었습니다.',
        }),
      }),
    );
    await page.goto('/ai-strategy/32/simulation?option=opt-transfer-discount');
    await page.getByRole('button', { name: '이 전략을 최종안으로 선택' }).click();
    await page.getByRole('button', { name: 'Teams 검토 요청' }).click();
    await page.getByLabel('이주영 first@example.com 선택').check();
    await page.getByRole('button', { name: 'Teams로 전송 (1명)' }).click();

    const conflictDialog = page.getByRole('dialog', { name: '전략을 실행할 수 없습니다' });
    await expect(conflictDialog.getByText('재고 또는 판매 조건이 변경되었습니다.', { exact: true })).toBeVisible();
    await conflictDialog.getByRole('button', { name: '새 전략 생성' }).click();
    await expect(page).toHaveURL(/\/inventory$/);
  });

  test('전략 요약에서 기존 데모형 시뮬레이션으로 이동하고 대안을 전환한다', async ({ page }) => {
    await page.goto('/ai-strategy/32');
    await page
      .getByRole('link', { name: /시뮬레이션 보기/ })
      .first()
      .click();

    await expect(page).toHaveURL(/\/ai-strategy\/32\/simulation\?option=opt-transfer-discount/);
    await expect(page.getByRole('heading', { name: '전략 비교 시뮬레이션' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'AI 최종 검토' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: '조건 조정' })).toBeVisible();
    await expect(page.getByTestId('strategy-simulation-chart')).toBeVisible();
    await expect(page.getByRole('tab', { name: '공헌이익' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: '재고 추이' })).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByLabel('이동 수량')).toBeEnabled();
    await expect(page.getByLabel('할인 적용 수량')).toBeEnabled();
    await expect(page.getByLabel('할인율')).toBeEnabled();
    const conditionPanel = page.getByTestId('strategy-condition-panel');
    await expect(conditionPanel.getByText('실물 재고 이동', { exact: true })).toBeVisible();
    await expect(conditionPanel.getByText('출발 판매처', { exact: true })).toBeVisible();
    await expect(conditionPanel.getByText('도착 판매처', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /조건 적용/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Teams 검토 요청/ })).toBeDisabled();
    await expect(page.getByText('8일 예측 평가 결과')).toBeVisible();
    await expect(page.getByLabel('액션 1 시작일')).toHaveValue('2026-08-20');
    await expect(page.getByLabel('액션 1 종료일')).toHaveValue('2026-08-27');
    await expect(page.getByLabel('액션 1 종료일')).toHaveAttribute('max', '2026-08-27');

    const resultTable = page.getByRole('table', { name: '현재 전략 예상 결과와 기준 시나리오 비교' });
    await expect(resultTable.getByRole('row').filter({ hasText: '예상 폐기수량' })).toBeVisible();
    await expect(resultTable.getByRole('row').filter({ hasText: '예상 재고 소진기간' })).toHaveCount(0);
    await expect(resultTable.getByRole('row').filter({ hasText: '전략 종료 후 잔여재고' })).toHaveCount(0);
    await expect(resultTable.getByRole('row').filter({ hasText: '예상 실행비' })).toHaveCount(0);

    const expectedSalesRow = page.getByRole('row').filter({ hasText: '예상 판매량' });
    const recommendedResult = await expectedSalesRow.textContent();
    const inventorySeries = page.getByTestId('strategy-simulation-chart').locator('.recharts-line-curve');
    const recommendedChartPaths = await inventorySeries.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('d')),
    );
    await page.getByLabel('이동 수량').fill('10');
    await expect(expectedSalesRow).toHaveText(recommendedResult);
    await expect(page.getByText('변경 미적용')).toBeVisible();
    await expect
      .poll(() => inventorySeries.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('d'))))
      .toEqual(recommendedChartPaths);

    await expect(page.getByText('서버 계산 완료')).toBeVisible();
    await expect(expectedSalesRow).toContainText('33개');
    await expect(expectedSalesRow).not.toHaveText(recommendedResult);
    await expect
      .poll(() => inventorySeries.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('d'))))
      .not.toEqual(recommendedChartPaths);
    await expect(page.getByText('8일 예측 평가 결과')).toBeVisible();

    await page.getByRole('button', { name: /고수요 판매처 중심 재고 재할당/ }).click();
    await expect(page).toHaveURL(/option=opt-reallocation/);
    await expect(
      page.getByText('같은 물류센터 권역 안에서 판매속도가 높은 판매처에 할당량을 우선 배분합니다.'),
    ).toBeVisible();
    await expect(page.getByLabel('재할당 수량')).toBeEnabled();
    await expect(page.getByLabel('할인율')).toHaveCount(0);
    await expect(page.getByLabel(/전략 판매가/)).toHaveCount(0);
    await expect(conditionPanel.getByText('기존 할당 판매처', { exact: true })).toBeVisible();
    await expect(conditionPanel.getByText('변경 할당 판매처', { exact: true })).toBeVisible();
    await expect(conditionPanel.getByText('물리적 이동 없음', { exact: true })).toBeVisible();
    await expect(conditionPanel.getByText('출발 위치', { exact: true })).toHaveCount(0);
    await expect(conditionPanel.getByText('도착 판매처', { exact: true })).toHaveCount(0);
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
    const teamsButton = page.getByRole('button', { name: 'Teams 검토 요청' });
    await expect(teamsButton).toBeDisabled();
    await page.getByRole('button', { name: /이 전략을 최종안으로 선택/ }).click();
    await expect(page.getByText('1안을 최종안으로 표시 중입니다.')).toBeVisible();
    await expect(teamsButton).toBeEnabled();
    await teamsButton.click();
    await expect(page.getByRole('dialog', { name: 'Reviewer 선택' })).toBeVisible();
    await page.getByRole('button', { name: 'Reviewer 선택 모달 닫기' }).click();
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

  test('실행 대안이 없으면 현상 유지 권장 상태를 별도로 안내한다', async ({ page }) => {
    await page.goto('/ai-strategy/33');

    await expect(page.getByText('현상 유지 권장', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '현재 운영 상태를 유지하는 것이 유리합니다.' })).toBeVisible();
    await expect(page.getByText(/추가 전략을 실행하는 것보다 현 상태를 유지/)).toBeVisible();
    await expect(page.getByRole('link', { name: /시뮬레이션 보기/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Teams/ })).toHaveCount(0);
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

  test('중간 화면 폭에서도 하단 액션바를 실제 사이드바 오른쪽에 정렬한다', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/ai-strategy/32/simulation?option=opt-transfer-discount');

    const sidebar = page.locator('.sidebar');
    const actionBar = page.getByTestId('strategy-simulation-action-bar');
    const [sidebarBox, actionBarBox] = await Promise.all([sidebar.boundingBox(), actionBar.boundingBox()]);

    expect(actionBarBox.x).toBe(sidebarBox.x + sidebarBox.width);
    expect(actionBarBox.x + actionBarBox.width).toBeLessThanOrEqual(1024);
    await expect(page.getByRole('button', { name: '이 전략을 최종안으로 선택' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Teams 검토 요청' })).toBeVisible();
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
