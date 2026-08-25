import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SELECTION_CONFLICT_MESSAGE,
  isAiStrategySelectionConflict,
  resolveAiStrategySelectionConflict,
} from './strategySelectionConflict.js';

describe('AI strategy selection conflict', () => {
  it('409 selection conflict만 전용 오류로 판별한다', () => {
    expect(isAiStrategySelectionConflict({ status: 409, code: 'AI_STRATEGY-017' })).toBe(true);
    expect(isAiStrategySelectionConflict({ status: 409, code: 'OTHER_CONFLICT' })).toBe(false);
    expect(isAiStrategySelectionConflict({ status: 500, code: 'AI_STRATEGY-017' })).toBe(false);
  });

  it('details의 사유와 수량을 안내 모델로 변환한다', () => {
    expect(
      resolveAiStrategySelectionConflict({
        details: {
          details: {
            reason: 'INSUFFICIENT_INVENTORY',
            requestedQuantity: 29,
            currentAvailableQuantity: 18,
            retryableWithAdjustment: true,
          },
        },
      }),
    ).toEqual({
      reason: 'INSUFFICIENT_INVENTORY',
      reasonMessage: '현재 가용재고가 부족합니다.',
      requestedQuantity: 29,
      currentAvailableQuantity: 18,
      retryableWithAdjustment: true,
    });
  });

  it('details가 없거나 알 수 없는 사유면 기본 안내를 사용한다', () => {
    expect(resolveAiStrategySelectionConflict({}).reasonMessage).toBe(DEFAULT_SELECTION_CONFLICT_MESSAGE);
    expect(
      resolveAiStrategySelectionConflict({ details: { details: { reason: 'UNKNOWN_REASON' } } }).reasonMessage,
    ).toBe(DEFAULT_SELECTION_CONFLICT_MESSAGE);
  });
});
