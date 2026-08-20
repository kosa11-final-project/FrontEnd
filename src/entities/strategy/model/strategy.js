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
