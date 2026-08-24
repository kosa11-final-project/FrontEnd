// AI 전략 생성 목록의 상태는 실행·성과 상태와 분리해서 관리합니다.
export const strategyGenerationStatuses = Object.freeze(['GENERATING', 'GENERATED', 'GENERATION_FAILED']);

export const strategyGenerationStages = Object.freeze(['FORECASTING', 'AI_STRATEGY_GENERATING', 'COMPARISON_READY']);

export const strategyGenerationStatusMeta = Object.freeze({
  GENERATING: { label: '생성중', variant: 'warning' },
  GENERATED: { label: '생성완료', variant: 'good' },
  GENERATION_FAILED: { label: '생성실패', variant: 'danger' },
  UNKNOWN: { label: '상태 미확인', variant: 'neutral' },
});

export const strategyGenerationStageMeta = Object.freeze({
  FORECASTING: { label: '수요예측' },
  AI_STRATEGY_GENERATING: { label: 'AI 전략 생성' },
  COMPARISON_READY: { label: '비교 준비' },
});

export function resolveStrategyGenerationStatus(status) {
  return strategyGenerationStatusMeta[status] ? status : 'UNKNOWN';
}

export function resolveStrategyGenerationStage(stage) {
  return strategyGenerationStageMeta[stage] ? stage : strategyGenerationStages[0];
}

export function getStrategyGenerationProgress(status, currentStage) {
  const resolvedStatus = resolveStrategyGenerationStatus(status);
  const resolvedStage = resolveStrategyGenerationStage(currentStage);
  const currentIndex = strategyGenerationStages.indexOf(resolvedStage);

  return strategyGenerationStages.map((stage, index) => {
    if (resolvedStatus === 'GENERATED') return { stage, state: 'complete' };
    if (index < currentIndex) return { stage, state: 'complete' };
    if (index > currentIndex) return { stage, state: 'upcoming' };
    return { stage, state: resolvedStatus === 'GENERATION_FAILED' ? 'error' : 'current' };
  });
}

export const STRATEGY_STATUSES = Object.freeze(['READY', 'EXECUTING', 'PARTIAL', 'COMPLETED', 'FAILED', 'CANCELLED']);
export const ACTION_STATUSES = Object.freeze([
  'NOT_STARTED',
  'REQUESTED',
  'BLOCKED',
  'IN_PROGRESS',
  'PARTIAL',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);
export const SUPPORTED_ACTION_TYPES = Object.freeze([
  'REALLOCATION',
  'RT_TRANSFER',
  'PRICE_DISCOUNT',
  'CHANNEL_EXPANSION',
  'CHANNEL_CONCENTRATION',
]);
export const ACTION_RELATIONSHIPS = Object.freeze(['SEQUENTIAL', 'PARALLEL', 'CONDITIONAL']);

export const strategyStatusMeta = Object.freeze({
  READY: { label: '실행 대기', variant: 'neutral' },
  EXECUTING: { label: '실행 중', variant: 'info' },
  PARTIAL: { label: '부분 완료', variant: 'warning' },
  COMPLETED: { label: '완료', variant: 'good' },
  FAILED: { label: '실패', variant: 'danger' },
  CANCELLED: { label: '취소', variant: 'neutral' },
});
export const actionStatusMeta = Object.freeze({
  NOT_STARTED: { label: '시작 전', variant: 'neutral' },
  REQUESTED: { label: '요청됨', variant: 'info' },
  BLOCKED: { label: '차단됨', variant: 'warning' },
  IN_PROGRESS: { label: '진행 중', variant: 'info' },
  PARTIAL: { label: '부분 완료', variant: 'warning' },
  COMPLETED: { label: '완료', variant: 'good' },
  FAILED: { label: '실패', variant: 'danger' },
  CANCELLED: { label: '취소', variant: 'neutral' },
});
export const actionTypeMeta = Object.freeze({
  REALLOCATION: { label: '재고 재할당', shortLabel: '재할당' },
  RT_TRANSFER: { label: 'RT 이동', shortLabel: 'RT 이동' },
  PRICE_DISCOUNT: { label: '가격 할인', shortLabel: '할인' },
  CHANNEL_EXPANSION: { label: '채널 확장', shortLabel: '채널 확장' },
  CHANNEL_CONCENTRATION: { label: '채널 집중', shortLabel: '채널 집중' },
});
export const relationshipMeta = Object.freeze({
  SEQUENTIAL: { label: '선행', description: '선행 액션 완료 후 실행' },
  PARALLEL: { label: '병렬', description: '다른 액션과 동시에 실행' },
  CONDITIONAL: { label: '조건부', description: '조건 충족 시 실행' },
});

export const getCompletedActionCount = (actions = []) =>
  actions.filter((action) => action.status === 'COMPLETED').length;
export const getBlockedActionCount = (actions = []) => actions.filter((action) => action.status === 'BLOCKED').length;
export const getRepresentativeKpis = (actions = []) =>
  actions.map((action) => ({
    actionId: action.id,
    type: action.type,
    target: action.target,
    kpi: action.kpis?.find((item) => item.representative) ?? action.kpis?.[0] ?? null,
  }));

export function getExecutionSummary(strategies = []) {
  const actions = strategies.flatMap((strategy) => strategy.actions);
  return {
    strategyCount: strategies.filter((strategy) => strategy.status && strategy.status !== 'READY').length,
    actionCount: actions.length,
    inProgressActionCount: actions.filter((action) => ['REQUESTED', 'IN_PROGRESS'].includes(action.status)).length,
    attentionActionCount: actions.filter((action) => ['BLOCKED', 'PARTIAL', 'FAILED'].includes(action.status)).length,
  };
}

export function filterStrategies(strategies, filters) {
  const query = filters.query.trim().toLocaleLowerCase('ko-KR');
  return strategies.filter((strategy) => {
    if (filters.strategyStatus !== 'ALL' && strategy.status !== filters.strategyStatus) return false;
    if (filters.actionType !== 'ALL' && !strategy.actions.some((action) => action.type === filters.actionType))
      return false;
    if (!query) return true;
    return [strategy.number, strategy.product.name, strategy.product.sku]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase('ko-KR').includes(query));
  });
}

export function formatAchievementRateText(value) {
  if (value === null || value === undefined) return value;
  return String(value).replace(/(달성률\s*)(-?\d+(?:\.\d+)?)(%)/g, (_, label, rate, unit) => {
    const roundedRate = Number(rate).toLocaleString('ko-KR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${label}${roundedRate}${unit}`;
  });
}

export function formatKpiValue(kpi) {
  if (!kpi || kpi.value === null || kpi.value === undefined) return kpi?.emptyLabel ?? '미수집';
  if (typeof kpi.value === 'number') {
    const isAchievementRate = kpi.unit === '%' && kpi.label?.includes('달성률');
    const value = isAchievementRate
      ? kpi.value.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : kpi.value.toLocaleString('ko-KR');
    return `${value}${kpi.unit ?? ''}`;
  }
  const value = formatAchievementRateText(kpi.value);
  return `${value}${kpi.unit ?? ''}`;
}

export const strategyStatuses = STRATEGY_STATUSES;
