import { describe, expect, it } from 'vitest';
import { strategyStatisticsFixture } from './strategyStatisticsFixtures.js';
import { buildStrategyStatisticsView } from './strategyStatisticsModel.js';

describe('strategyStatisticsModel', () => {
  it('선택 기간에 종료된 전략의 핵심 성과와 목표 달성 전략 비율을 집계한다', () => {
    const view = buildStrategyStatisticsView(
      strategyStatisticsFixture,
      { from: '2026-07-18', to: '2026-08-16' },
      'NATIONAL',
    );

    expect(view).not.toHaveProperty('previousRange');
    expect(view).not.toHaveProperty('previous');
    expect(view.current.completedCount).toBeGreaterThan(0);
    expect(view.current.goalAchievedCount).toBeGreaterThan(0);
    expect(view.current.goalAchievedCount).toBeLessThanOrEqual(view.current.completedCount);
    expect(view.current.goalAchievedStrategyRate).toBeGreaterThan(0);
    expect(view.current.averageAchievementRate).toBeGreaterThan(0);
    expect(view.current.riskStockReductionQty).toBeGreaterThan(0);
    expect(view.current.avoidedDisposalQty).toBeGreaterThan(0);
    expect(view.current.estimatedLossSavingsAmount).toBeGreaterThan(0);
  });

  it('복합 액션을 대표 유형으로 나누지 않고 조합 단위로 유지한다', () => {
    const view = buildStrategyStatisticsView(
      strategyStatisticsFixture,
      { from: '2026-07-18', to: '2026-08-16' },
      'NATIONAL',
    );

    expect(view.actionCombinationBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'REALLOCATION+PRICE_DISCOUNT', label: '재고 이동 + 할인' }),
        expect.objectContaining({
          code: 'CHANNEL_EXPANSION+PRICE_DISCOUNT+REALLOCATION',
          label: '채널 확장 + 할인 + 재고 이동',
        }),
      ]),
    );
  });
});
