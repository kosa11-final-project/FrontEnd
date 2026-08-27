const EMPTY_STATUS_COUNTS = Object.freeze({
  all: 0,
  generating: 0,
  generated: 0,
  generationFailed: 0,
});

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function assertValidPage(data) {
  const hasValidMetadata =
    isNonNegativeInteger(data?.page) &&
    Number.isInteger(data?.size) &&
    data.size > 0 &&
    isNonNegativeInteger(data?.totalElements) &&
    isNonNegativeInteger(data?.totalPages) &&
    typeof data?.first === 'boolean' &&
    typeof data?.last === 'boolean';

  if (!Array.isArray(data?.content) || !hasValidMetadata) {
    throw new Error('AI 전략 생성 목록 응답 형식이 올바르지 않습니다.');
  }
}

function toCount(value) {
  return isNonNegativeInteger(value) ? value : 0;
}

function mapRecommendationOutcome(value) {
  return ['OPTIONS_GENERATED', 'MAINTAIN_CURRENT_STATE'].includes(value) ? value : null;
}

export function mapAiStrategyListItem(item = {}) {
  const strategyCaseId = item.strategyCaseId;
  const category = item.sku?.category;

  return {
    id: strategyCaseId,
    strategyNumber: `#${strategyCaseId}`,
    strategyName: item.caseName || '이름 없는 AI 전략',
    caseStatus: item.caseStatus,
    generationStage: item.generationStage,
    recommendationOutcome: mapRecommendationOutcome(item.recommendationOutcome),
    category: category
      ? {
          id: category.categoryId,
          name: category.categoryName,
          level: category.categoryLevel,
        }
      : null,
    product: {
      skuId: item.sku?.skuId ?? null,
      skuCode: item.sku?.skuCode || '-',
      name: item.sku?.skuName || '상품 정보 없음',
      imageUrl: item.sku?.imageUrl || null,
    },
    requester: item.requester
      ? {
          userId: item.requester.userId,
          userName: item.requester.userName,
        }
      : null,
    createdAt: item.createdAt,
    completedAt: item.completedAt,
    resultExpiresAt: item.resultExpiresAt,
    failure: item.failure
      ? {
          code: item.failure.code,
          summary: item.failure.message,
          failedAt: item.failure.failedAt,
        }
      : null,
  };
}

export function mapAiStrategyListResponse(response) {
  const data = response?.data;
  assertValidPage(data);

  const statusCounts = data.statusCounts ?? EMPTY_STATUS_COUNTS;
  return {
    content: data.content.map(mapAiStrategyListItem),
    statusCounts: {
      all: toCount(statusCounts.all),
      generating: toCount(statusCounts.generating),
      generated: toCount(statusCounts.generated),
      generationFailed: toCount(statusCounts.generationFailed),
    },
    page: data.page,
    size: data.size,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    first: data.first,
    last: data.last,
  };
}
