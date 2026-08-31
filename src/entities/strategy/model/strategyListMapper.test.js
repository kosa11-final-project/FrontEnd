import { describe, expect, it } from 'vitest';
import { mapAiStrategyListItem, mapAiStrategyListResponse } from './strategyListMapper.js';

describe('AI strategy list mapper', () => {
  it('maps backend case fields to the list UI model', () => {
    expect(
      mapAiStrategyListItem({
        strategyCaseId: 42,
        caseName: '재고 재할당 전략',
        caseStatus: 'GENERATION_FAILED',
        generationStage: 'STRATEGY_GENERATING',
        recommendationOutcome: null,
        sku: {
          skuId: 7,
          skuCode: 'SKU-7',
          skuName: '국산콩 두부',
          imageUrl: null,
          categoryPathLabel: '신선식품 > 두부·콩나물 > 두부',
          category: { categoryId: 3, categoryName: '두부', categoryLevel: 3 },
        },
        requester: { userId: 9, userName: '요청자' },
        createdAt: '2026-08-24T10:00:00',
        completedAt: '2026-08-24T10:01:00',
        resultExpiresAt: null,
        failure: { code: 'FORECAST_UNAVAILABLE', message: '수요예측 실패', failedAt: '2026-08-24T10:01:00' },
      }),
    ).toEqual({
      id: 42,
      strategyNumber: '#42',
      strategyName: '재고 재할당 전략',
      caseStatus: 'GENERATION_FAILED',
      generationStage: 'STRATEGY_GENERATING',
      recommendationOutcome: null,
      category: { id: 3, name: '두부', level: 3, pathLabel: '신선식품 > 두부·콩나물 > 두부' },
      product: { skuId: 7, skuCode: 'SKU-7', name: '국산콩 두부', imageUrl: null },
      requester: { userId: 9, userName: '요청자' },
      createdAt: '2026-08-24T10:00:00',
      completedAt: '2026-08-24T10:01:00',
      resultExpiresAt: null,
      failure: { code: 'FORECAST_UNAVAILABLE', summary: '수요예측 실패', failedAt: '2026-08-24T10:01:00' },
    });
  });

  it('maps only supported recommendation outcomes and keeps legacy values null', () => {
    expect(mapAiStrategyListItem({ recommendationOutcome: 'MAINTAIN_CURRENT_STATE' }).recommendationOutcome).toBe(
      'MAINTAIN_CURRENT_STATE',
    );
    expect(mapAiStrategyListItem({ recommendationOutcome: 'OPTIONS_GENERATED' }).recommendationOutcome).toBe(
      'OPTIONS_GENERATED',
    );
    expect(mapAiStrategyListItem({ recommendationOutcome: 'UNKNOWN' }).recommendationOutcome).toBeNull();
    expect(mapAiStrategyListItem({}).recommendationOutcome).toBeNull();
  });

  it('keeps server status counts instead of recalculating them from content', () => {
    const result = mapAiStrategyListResponse({
      data: {
        content: [],
        statusCounts: { all: 38, generating: 3, generated: 30, generationFailed: 5 },
        page: 0,
        size: 10,
        totalElements: 38,
        totalPages: 4,
        first: true,
        last: false,
      },
    });

    expect(result.statusCounts).toEqual({ all: 38, generating: 3, generated: 30, generationFailed: 5 });
  });
});
