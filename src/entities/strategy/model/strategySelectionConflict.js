const selectionConflictReasonMessages = Object.freeze({
  INSUFFICIENT_INVENTORY: '현재 가용재고가 부족합니다.',
  LOT_UNAVAILABLE: '선택한 LOT가 더 이상 판매 가능한 상태가 아닙니다.',
  PRICE_CHANGED: '판매가 또는 최저판매가가 변경되었습니다.',
  SALES_POINT_UNAVAILABLE: '대상 판매처를 현재 이용할 수 없습니다.',
  COST_CHANGED: '상품 원가 또는 관련 비용이 변경되었습니다.',
});

export const AI_STRATEGY_SELECTION_CONFLICT_CODE = 'AI_STRATEGY_SELECTION_CONFLICT';
export const DEFAULT_SELECTION_CONFLICT_MESSAGE = '재고 또는 판매 조건이 변경되었습니다.';

export function isAiStrategySelectionConflict(error) {
  return error?.status === 409 && error?.code === AI_STRATEGY_SELECTION_CONFLICT_CODE;
}

export function resolveAiStrategySelectionConflict(error) {
  const details = error?.details?.details;
  const reason = typeof details?.reason === 'string' ? details.reason : null;

  return {
    reason,
    reasonMessage: selectionConflictReasonMessages[reason] ?? DEFAULT_SELECTION_CONFLICT_MESSAGE,
    requestedQuantity: Number.isFinite(details?.requestedQuantity) ? details.requestedQuantity : null,
    currentAvailableQuantity: Number.isFinite(details?.currentAvailableQuantity)
      ? details.currentAvailableQuantity
      : null,
    retryableWithAdjustment:
      typeof details?.retryableWithAdjustment === 'boolean' ? details.retryableWithAdjustment : null,
  };
}
