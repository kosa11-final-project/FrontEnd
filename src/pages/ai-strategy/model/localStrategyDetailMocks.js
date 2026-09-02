import { getStrategyDetailFixture } from './strategyDetailFixtures.js';

const MOCK_STRATEGY_CASE_ID = 970000000588;
const template = getStrategyDetailFixture(32);

// 백엔드 DB와 무관하게 로컬 개발 환경에서만 노출되는 화면 확인용 목입니다.
const localStrategyDetails = Object.freeze({
  [MOCK_STRATEGY_CASE_ID]: {
    ...template,
    strategyCaseId: MOCK_STRATEGY_CASE_ID,
    caseCode: `#${MOCK_STRATEGY_CASE_ID}`,
    caseName: '초코하임 AI 전략',
    sku: {
      ...template.sku,
      skuId: MOCK_STRATEGY_CASE_ID,
      skuCode: 'CHOCO-HAIM',
      skuName: '초코하임',
      imageUrl: null,
      category: { categoryId: 401, categoryName: '과자·간식', level: 3 },
    },
    requestedAt: '2026-09-02T10:00:00+09:00',
    completedAt: '2026-09-02T10:01:42+09:00',
    resultExpiresAt: '2026-09-05T10:01:42+09:00',
  },
});

export function getLocalStrategyDetailMock(strategyCaseId) {
  if (!import.meta.env.DEV) return null;
  return localStrategyDetails[String(strategyCaseId)] ?? null;
}

export function getLocalStrategyListMocks() {
  if (!import.meta.env.DEV) return [];

  return Object.values(localStrategyDetails).map((strategy) => ({
    id: strategy.strategyCaseId,
    strategyNumber: `#${strategy.strategyCaseId}`,
    strategyName: strategy.caseName,
    caseStatus: strategy.caseStatus,
    generationStage: 'COMPARISON_READY',
    recommendationOutcome: 'OPTIONS_GENERATED',
    category: {
      id: strategy.sku.category.categoryId,
      name: strategy.sku.category.categoryName,
      level: strategy.sku.category.level,
      pathLabel: strategy.sku.category.categoryName,
    },
    product: {
      skuId: strategy.sku.skuId,
      skuCode: strategy.sku.skuCode,
      name: strategy.sku.skuName,
      imageUrl: strategy.sku.imageUrl,
    },
    requester: strategy.requestedBy,
    createdAt: strategy.requestedAt,
    completedAt: strategy.completedAt,
    resultExpiresAt: strategy.resultExpiresAt,
    failure: null,
  }));
}
