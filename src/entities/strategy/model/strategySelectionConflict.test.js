import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SELECTION_CONFLICT_MESSAGE,
  isAiStrategySelectionConflict,
  resolveAiStrategySelectionConflict,
} from './strategySelectionConflict.js';

describe('AI strategy selection conflict', () => {
  it('409 selection conflict만 전용 오류로 판별한다', () => {
    expect(isAiStrategySelectionConflict({ status: 409, code: 'AI_STRATEGY-017' })).toBe(true);
    expect(isAiStrategySelectionConflict({ status: 409, code: 'AI_STRATEGY-028' })).toBe(true);
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
      strategyCaseId: null,
      optionId: null,
      validatedAt: null,
      changes: [],
      hasStructuredChanges: false,
      suggestedAdjustments: {},
    });
  });

  it('구조화된 변경 내역을 우선순위대로 정렬하고 자동 조정값을 추출한다', () => {
    const result = resolveAiStrategySelectionConflict({
      details: {
        details: {
          strategyCaseId: 4057,
          optionId: 13,
          validatedAt: '2026-08-31T16:37:54+09:00',
          changes: [
            {
              type: 'SELLABLE_END_DATE_CHANGED',
              field: 'endDate',
              label: '판매 가능 종료일',
              previousValue: '2026-09-15',
              currentValue: '2026-09-10',
              requestedValue: '2026-09-15',
              suggestedValue: '2026-09-10',
              reason: 'LOT 판매 가능 기간이 단축되었습니다.',
            },
            {
              type: 'AVAILABLE_QUANTITY_DECREASED',
              field: 'availableQuantity',
              label: 'LOT 가용재고',
              subject: { inventoryBalanceId: 31, lotId: 7, warehouseId: 2, salesPointId: 10 },
              previousValue: 42,
              currentValue: 31,
              unit: '개',
            },
            {
              type: 'AVAILABLE_QUANTITY_DECREASED',
              field: 'actionQuantity',
              label: '실행 가능 재고',
              requestedValue: 42,
              suggestedValue: 31,
              unit: '개',
            },
          ],
        },
      },
    });

    expect(result).toMatchObject({
      strategyCaseId: 4057,
      optionId: 13,
      hasStructuredChanges: true,
      retryableWithAdjustment: true,
      suggestedAdjustments: { actionQuantity: 31, endDate: '2026-09-10' },
    });
    expect(result.changes.map(({ field }) => field)).toEqual(['actionQuantity', 'endDate', 'availableQuantity']);
    expect(result.changes[2].subject).toEqual({
      inventoryBalanceId: 31,
      lotId: 7,
      warehouseId: 2,
      salesPointId: 10,
    });
  });

  it('구조 변경이 섞였거나 제안 수량이 0이면 자동 조정을 막는다', () => {
    const structural = resolveAiStrategySelectionConflict({
      details: {
        details: {
          changes: [
            {
              type: 'INVENTORY_LOCATION_CHANGED',
              field: 'sourceLocation',
              label: '출발 위치',
              suggestedValue: 20,
            },
          ],
        },
      },
    });
    const depleted = resolveAiStrategySelectionConflict({
      details: {
        details: {
          changes: [
            {
              type: 'AVAILABLE_QUANTITY_DECREASED',
              field: 'actionQuantity',
              label: '실행 가능 재고',
              suggestedValue: 0,
            },
          ],
        },
      },
    });

    expect(structural.retryableWithAdjustment).toBe(false);
    expect(structural.suggestedAdjustments).toEqual({});
    expect(depleted.retryableWithAdjustment).toBe(false);
  });

  it('details가 없거나 알 수 없는 사유면 기본 안내를 사용한다', () => {
    expect(resolveAiStrategySelectionConflict({}).reasonMessage).toBe(DEFAULT_SELECTION_CONFLICT_MESSAGE);
    expect(
      resolveAiStrategySelectionConflict({ details: { details: { reason: 'UNKNOWN_REASON' } } }).reasonMessage,
    ).toBe(DEFAULT_SELECTION_CONFLICT_MESSAGE);
  });
});
