export const STRATEGY_REQUEST_TYPES = Object.freeze([
  {
    value: 'REALLOCATION',
    label: '재고 재할당',
    description: '같은 물류센터 재고의 판매처별 할당량을 조정합니다.',
  },
  {
    value: 'RT_TRANSFER',
    label: '재고 이동',
    description: '판매처 또는 물류센터 사이의 실제 재고 이동을 검토합니다.',
  },
  {
    value: 'PRICE_DISCOUNT',
    label: '가격 할인',
    description: '일정 기간 판매가 인하 대안을 검토합니다.',
  },
  {
    value: 'CHANNEL_EXPANSION',
    label: '채널 확대',
    description: '다른 온라인몰·오프라인 판매처로 노출을 확대합니다.',
  },
  {
    value: 'CHANNEL_CONCENTRATION',
    label: '채널 집중',
    description: '판매속도가 빠른 채널에 재고와 노출을 집중합니다.',
  },
]);

const DAY_MS = 86_400_000;

function parseIsoDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(value, days) {
  const date = parseIsoDate(value);
  if (!date) return '';
  return new Date(date.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function createStrategyRequestDraft(item = {}) {
  return {
    caseName: '',
    skuId: item.skuId ?? null,
    skuCode: item.skuCode ?? '',
    sourceSalesPointCode: '',
    sourceSalesPointId: null,
    lotIds: [],
    candidateSalesPointCodes: [],
    candidateSalesPointIds: [],
    strategyTypes: [],
    preferredStartDate: '',
    preferredEndDate: '',
    recommendAllConditions: false,
  };
}

export function hasStrategyRequestPreference(draft = {}) {
  return Boolean(
    draft.sourceSalesPointCode ||
    draft.lotIds?.length ||
    draft.candidateSalesPointCodes?.length ||
    draft.strategyTypes?.length ||
    draft.preferredStartDate ||
    draft.preferredEndDate ||
    draft.recommendAllConditions,
  );
}

export function validateStrategyRequestDraft(draft, today) {
  const errors = {};
  const caseName = draft?.caseName?.trim() ?? '';
  const startDate = draft?.preferredStartDate ?? '';
  const endDate = draft?.preferredEndDate ?? '';

  if (!hasStrategyRequestPreference(draft)) {
    errors.requestPreference = '조건을 하나 이상 입력하거나 조건 전체를 AI에게 추천받기를 선택해 주세요.';
  }

  if (caseName.length > 200) {
    errors.caseName = '전략명은 200자 이하로 입력해 주세요.';
  }

  if (startDate && startDate < today) {
    errors.preferredStartDate = '시작일은 오늘보다 빠를 수 없습니다.';
  } else if (startDate && startDate > addDays(today, 90)) {
    errors.preferredStartDate = '시작일은 오늘부터 90일 이내여야 합니다.';
  }

  if (startDate && endDate && endDate < startDate) {
    errors.preferredEndDate = '종료일은 시작일보다 빠를 수 없습니다.';
  } else if (startDate && endDate && endDate > addDays(startDate, 89)) {
    errors.preferredEndDate = '시작일과 종료일을 포함해 최대 90일까지 선택할 수 있습니다.';
  } else if (!startDate && endDate && endDate < today) {
    errors.preferredEndDate = '종료일은 오늘보다 빠를 수 없습니다.';
  } else if (!startDate && endDate && endDate > addDays(today, 179)) {
    errors.preferredEndDate = '종료일만 지정할 때는 오늘부터 179일 이내여야 합니다.';
  }

  return errors;
}

export function buildStrategyRequestPayload(draft) {
  return {
    caseName: draft.caseName.trim() || null,
    skuId: draft.skuId,
    sourceSalesPointId: draft.sourceSalesPointId,
    lotIds: draft.lotIds.length ? draft.lotIds : null,
    candidateSalesPointIds: draft.candidateSalesPointIds.length ? draft.candidateSalesPointIds : null,
    strategyTypes: draft.strategyTypes.length ? draft.strategyTypes : null,
    preferredStartDate: draft.preferredStartDate || null,
    preferredEndDate: draft.preferredEndDate || null,
  };
}
