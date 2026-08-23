import { describe, expect, it } from 'vitest';
import {
  buildStrategyRequestPayload,
  createStrategyRequestDraft,
  hasStrategyRequestPreference,
  validateStrategyRequestDraft,
} from './strategyRequest.js';

describe('AI 전략 생성 요청 모델', () => {
  it('선택 SKU로 빈 요청 초안을 만든다', () => {
    expect(createStrategyRequestDraft({ skuId: 1001, skuCode: 'SKU-001' })).toMatchObject({
      skuId: 1001,
      skuCode: 'SKU-001',
      lotIds: [],
      strategyTypes: [],
      recommendAllConditions: false,
    });
  });

  it('상품별로 직접 조건 하나 또는 전체 AI 추천 선택을 요구한다', () => {
    const emptyDraft = createStrategyRequestDraft({ skuId: 1001 });

    expect(hasStrategyRequestPreference(emptyDraft)).toBe(false);
    expect(validateStrategyRequestDraft(emptyDraft, '2026-08-23')).toMatchObject({
      requestPreference: expect.any(String),
    });
    expect(validateStrategyRequestDraft({ ...emptyDraft, recommendAllConditions: true }, '2026-08-23')).toEqual({});
    expect(hasStrategyRequestPreference({ ...emptyDraft, strategyTypes: ['REALLOCATION'] })).toBe(true);
  });

  it('명세의 날짜 경계와 전략명 길이를 검증한다', () => {
    expect(
      validateStrategyRequestDraft(
        {
          ...createStrategyRequestDraft(),
          caseName: 'a'.repeat(201),
          preferredStartDate: '2026-08-22',
          preferredEndDate: '2027-01-01',
        },
        '2026-08-23',
      ),
    ).toMatchObject({
      caseName: expect.any(String),
      preferredStartDate: expect.any(String),
    });

    expect(
      validateStrategyRequestDraft(
        {
          ...createStrategyRequestDraft(),
          preferredStartDate: '2026-08-23',
          preferredEndDate: '2026-11-20',
        },
        '2026-08-23',
      ),
    ).toEqual({});
  });

  it('비어 있는 선택값은 null로 직렬화하고 선택 순서를 보존한다', () => {
    const payload = buildStrategyRequestPayload({
      ...createStrategyRequestDraft({ skuId: 1001 }),
      strategyTypes: ['RT_TRANSFER', 'PRICE_DISCOUNT'],
      candidateSalesPointIds: [30, 20],
    });

    expect(payload).toEqual({
      caseName: null,
      skuId: 1001,
      sourceSalesPointId: null,
      lotIds: null,
      candidateSalesPointIds: [30, 20],
      strategyTypes: ['RT_TRANSFER', 'PRICE_DISCOUNT'],
      preferredStartDate: null,
      preferredEndDate: null,
    });
  });
});
