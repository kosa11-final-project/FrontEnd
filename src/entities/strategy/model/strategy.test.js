import { describe, expect, it } from 'vitest';
import { strategyExecutionFixtures } from '../testing/fixtures.js';
import {
  actionTypeMeta,
  filterStrategies,
  formatAchievementRateText,
  formatKpiValue,
  getExecutionSummary,
  getStrategyGenerationProgress,
  resolveStrategyGenerationStage,
  resolveStrategyGenerationStatus,
} from './strategy.js';

describe('AI 전략 생성 상태 모델', () => {
  it('알 수 없는 상태와 단계를 안전한 표시값으로 정규화한다', () => {
    expect(resolveStrategyGenerationStatus('EXECUTING')).toBe('UNKNOWN');
    expect(resolveStrategyGenerationStage('UNKNOWN_STAGE')).toBe('FORECASTING');
  });

  it('생성중인 현재 단계와 이전·다음 단계를 구분한다', () => {
    expect(getStrategyGenerationProgress('GENERATING', 'STRATEGY_GENERATING')).toEqual([
      { stage: 'FORECASTING', state: 'complete' },
      { stage: 'STRATEGY_GENERATING', state: 'current' },
      { stage: 'COMPARISON_READY', state: 'upcoming' },
    ]);
  });

  it('실패한 단계와 생성완료 상태를 구분한다', () => {
    expect(getStrategyGenerationProgress('GENERATION_FAILED', 'FORECASTING')[0].state).toBe('error');
    expect(getStrategyGenerationProgress('GENERATED', 'COMPARISON_READY').map(({ state }) => state)).toEqual([
      'complete',
      'complete',
      'complete',
    ]);
  });

  it('빈 입력과 마지막 단계 실패를 안전하게 처리한다', () => {
    expect(resolveStrategyGenerationStatus('')).toBe('UNKNOWN');
    expect(resolveStrategyGenerationStatus(null)).toBe('UNKNOWN');
    expect(resolveStrategyGenerationStage(undefined)).toBe('FORECASTING');
    expect(getStrategyGenerationProgress('GENERATION_FAILED', 'COMPARISON_READY').map(({ state }) => state)).toEqual([
      'complete',
      'complete',
      'error',
    ]);
  });
});

const filters = { strategyStatus: 'ALL', actionType: 'ALL', query: '' };
describe('strategy execution model', () => {
  it('exposes price discount as a supported user-facing action type', () => {
    expect(actionTypeMeta.PRICE_DISCOUNT).toEqual({ label: '가격 할인', shortLabel: '할인' });
  });

  it('filters by supported action type and search query', () => {
    expect(filterStrategies(strategyExecutionFixtures, { ...filters, actionType: 'RT_TRANSFER' })).toHaveLength(1);
    expect(filterStrategies(strategyExecutionFixtures, { ...filters, query: '도시락' })[0].id).toBe(103);
  });
  it('distinguishes zero from missing KPI data', () => {
    expect(formatKpiValue({ value: 0, unit: '개' })).toBe('0개');
    expect(formatKpiValue({ value: null })).toBe('미수집');
  });
  it('localizes the EA quantity unit for KPI display', () => {
    expect(formatKpiValue({ value: 9, unit: 'EA' })).toBe('9개');
  });
  it('rounds numeric and embedded achievement rates to one decimal place', () => {
    expect(formatKpiValue({ label: '목표 달성률', value: 103.092784, unit: '%' })).toBe('103.1%');
    expect(formatKpiValue({ value: '실제 판매 63 / 목표 61.11 (달성률 103.092784%)' })).toBe(
      '실제 판매 63 / 목표 61.11 (달성률 103.1%)',
    );
    expect(formatAchievementRateText('실제 판매 200 / 목표 180 (달성률 111.111111%)')).toBe(
      '실제 판매 200 / 목표 180 (달성률 111.1%)',
    );
  });
  it('summarizes known strategy and action data', () => {
    expect(getExecutionSummary(strategyExecutionFixtures)).toEqual({
      strategyCount: 3,
      actionCount: 9,
      inProgressActionCount: 1,
      attentionActionCount: 3,
    });
  });
});
