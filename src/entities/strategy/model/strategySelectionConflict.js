const selectionConflictReasonMessages = Object.freeze({
  INSUFFICIENT_INVENTORY: '현재 가용재고가 부족합니다.',
  LOT_UNAVAILABLE: '선택한 LOT가 더 이상 판매 가능한 상태가 아닙니다.',
  PRICE_CHANGED: '판매가 또는 최저판매가가 변경되었습니다.',
  SALES_POINT_UNAVAILABLE: '대상 판매처를 현재 이용할 수 없습니다.',
  COST_CHANGED: '상품 원가 또는 관련 비용이 변경되었습니다.',
});

const changePriority = Object.freeze({
  actionQuantity: 0,
  startDate: 1,
  endDate: 2,
  availableQuantity: 3,
});

const adjustableChangeTypes = new Set([
  'AVAILABLE_QUANTITY_DECREASED',
  'START_DATE_PASSED',
  'SELLABLE_END_DATE_CHANGED',
]);

const adjustableFields = new Set(['actionQuantity', 'startDate', 'endDate']);

export const AI_STRATEGY_SELECTION_CONFLICT_CODE = 'AI_STRATEGY-017';
export const AI_STRATEGY_EXECUTION_CONDITION_CHANGED_CODE = 'AI_STRATEGY-028';
export const DEFAULT_SELECTION_CONFLICT_MESSAGE = '재고 또는 판매 조건이 변경되었습니다.';

function isPresent(value) {
  return value !== null && value !== undefined && value !== '';
}

function normalizeSubject(subject) {
  if (!subject || typeof subject !== 'object') return null;
  const normalized = {
    inventoryBalanceId: subject.inventoryBalanceId ?? null,
    lotId: subject.lotId ?? null,
    warehouseId: subject.warehouseId ?? null,
    salesPointId: subject.salesPointId ?? null,
  };
  return Object.values(normalized).some(isPresent) ? normalized : null;
}

function normalizeChange(change, index) {
  if (!change || typeof change !== 'object') return null;
  const field = typeof change.field === 'string' ? change.field : '';
  const type = typeof change.type === 'string' ? change.type : '';
  if (!field && !type) return null;

  return {
    key: `${type || 'UNKNOWN'}-${field || 'unknown'}-${index}`,
    type,
    field,
    label: typeof change.label === 'string' && change.label.trim() ? change.label : field || '실행 조건',
    subject: normalizeSubject(change.subject),
    previousValue: change.previousValue ?? null,
    currentValue: change.currentValue ?? null,
    requestedValue: change.requestedValue ?? null,
    suggestedValue: change.suggestedValue ?? null,
    unit: typeof change.unit === 'string' ? change.unit : '',
    reason: typeof change.reason === 'string' ? change.reason : '',
  };
}

function resolveSuggestedAdjustments(changes) {
  return changes.reduce((adjustments, change) => {
    if (!adjustableChangeTypes.has(change.type) || !adjustableFields.has(change.field)) return adjustments;
    if (!isPresent(change.suggestedValue)) return adjustments;
    if (change.field === 'startDate' && adjustments.startDate) {
      return { ...adjustments, startDate: [adjustments.startDate, change.suggestedValue].sort().at(-1) };
    }
    if (change.field === 'endDate' && adjustments.endDate) {
      return { ...adjustments, endDate: [adjustments.endDate, change.suggestedValue].sort()[0] };
    }
    return { ...adjustments, [change.field]: change.suggestedValue };
  }, {});
}

export function isAiStrategySelectionConflict(error) {
  return (
    error?.status === 409 &&
    [AI_STRATEGY_SELECTION_CONFLICT_CODE, AI_STRATEGY_EXECUTION_CONDITION_CHANGED_CODE].includes(error?.code)
  );
}

export function resolveAiStrategySelectionConflict(error) {
  const details = error?.details?.details;
  const reason = typeof details?.reason === 'string' ? details.reason : null;
  const changes = (Array.isArray(details?.changes) ? details.changes : [])
    .map(normalizeChange)
    .filter(Boolean)
    .sort((left, right) => (changePriority[left.field] ?? 100) - (changePriority[right.field] ?? 100));
  const suggestedAdjustments = resolveSuggestedAdjustments(changes);
  const hasStructuredChanges = changes.length > 0;
  const suggestedQuantity = Number(suggestedAdjustments.actionQuantity);
  const hasInvalidSuggestedQuantity =
    Object.hasOwn(suggestedAdjustments, 'actionQuantity') &&
    (!Number.isFinite(suggestedQuantity) || suggestedQuantity <= 0);
  const hasNonAdjustableChange = changes.some((change) => {
    const informationalAvailableQuantity =
      change.type === 'AVAILABLE_QUANTITY_DECREASED' && change.field === 'availableQuantity';
    return (
      !adjustableChangeTypes.has(change.type) ||
      (!adjustableFields.has(change.field) && !informationalAvailableQuantity)
    );
  });
  const legacyRetryable =
    typeof details?.retryableWithAdjustment === 'boolean' ? details.retryableWithAdjustment : true;

  return {
    reason,
    reasonMessage: hasStructuredChanges
      ? `${changes.length}개의 실행 조건 변경이 감지되었습니다.`
      : (selectionConflictReasonMessages[reason] ?? DEFAULT_SELECTION_CONFLICT_MESSAGE),
    requestedQuantity: Number.isFinite(details?.requestedQuantity) ? details.requestedQuantity : null,
    currentAvailableQuantity: Number.isFinite(details?.currentAvailableQuantity)
      ? details.currentAvailableQuantity
      : null,
    retryableWithAdjustment: hasStructuredChanges
      ? Object.keys(suggestedAdjustments).length > 0 && !hasInvalidSuggestedQuantity && !hasNonAdjustableChange
      : legacyRetryable,
    strategyCaseId: details?.strategyCaseId ?? null,
    optionId: details?.optionId ?? null,
    validatedAt: details?.validatedAt ?? null,
    changes,
    hasStructuredChanges,
    suggestedAdjustments,
  };
}
