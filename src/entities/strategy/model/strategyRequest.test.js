import { describe, expect, it } from 'vitest';
import {
  STRATEGY_REQUEST_TYPES,
  buildStrategyRequestPayload,
  createStrategyRequestDraft,
  hasStrategyRequestPreference,
  validateStrategyRequestDraft,
} from './strategyRequest.js';

describe('AI 전략 생성 요청 모델', () => {
  it('생성 요청에서 채널 집중 전략을 제외한다', () => {
    expect(STRATEGY_REQUEST_TYPES.map((type) => type.value)).toEqual([
      'REALLOCATION',
      'RT_TRANSFER',
      'PRICE_DISCOUNT',
      'CHANNEL_EXPANSION',
    ]);
  });

  it('선택 SKU로 빈 요청 초안을 만든다', () => {
    expect(createStrategyRequestDraft({ skuId: 1001, skuCode: 'SKU-001' })).toMatchObject({
      skuId: 1001,
      skuCode: 'SKU-001',
      lotIds: [],
      strategyTypes: [],
      recommendAllConditions: false,
    });
  });

  it('API 요청에 필요한 숫자형 식별자 누락을 검증한다', () => {
    const errors = validateStrategyRequestDraft(
      {
        ...createStrategyRequestDraft({ skuCode: 'SKU-001' }),
        sourceSalesPointCode: 'STORE-1',
        candidateSalesPointCodes: ['STORE-2'],
        recommendAllConditions: true,
      },
      '2026-08-24',
    );

    expect(errors).toMatchObject({
      skuId: expect.any(String),
      sourceSalesPointId: expect.any(String),
      candidateSalesPointIds: expect.any(String),
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
          ...createStrategyRequestDraft({ skuId: 1001 }),
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
          ...createStrategyRequestDraft({ skuId: 1001 }),
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
      sourceSalesPointId: 10,
      strategyTypes: ['RT_TRANSFER', 'PRICE_DISCOUNT'],
      candidateSalesPointIds: [30, 20],
    });

    expect(payload).toEqual({
      caseName: null,
      skuId: 1001,
      sourceSalesPointId: 10,
      lotIds: null,
      candidateSalesPointIds: [30, 20],
      strategyTypes: ['RT_TRANSFER', 'PRICE_DISCOUNT'],
      preferredStartDate: null,
      preferredEndDate: null,
    });
  });
});
