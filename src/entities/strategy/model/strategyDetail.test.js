import { describe, expect, it } from 'vitest';
import {
  buildStrategyChartData,
  getStrategyAdjustmentDefaults,
  getSimulationComparisonRows,
  resolveStrategyActionType,
  resolveStrategyOption,
  sortStrategyOptions,
} from './strategyDetail.js';

const options = [
  { optionKey: 'second', rank: 2 },
  { optionKey: 'first', rank: 1 },
];

describe('strategy detail model', () => {
  it('대안을 추천 순위로 정렬하고 잘못된 key는 1순위로 보정한다', () => {
    expect(sortStrategyOptions(options).map(({ optionKey }) => optionKey)).toEqual(['first', 'second']);
    expect(resolveStrategyOption(options, 'second')?.optionKey).toBe('second');
    expect(resolveStrategyOption(options, 'unknown')?.optionKey).toBe('first');
  });

  it('대안이 없으면 빈 결과와 null을 반환한다', () => {
    expect(sortStrategyOptions()).toEqual([]);
    expect(resolveStrategyOption([], 'first')).toBeNull();
    expect(resolveStrategyActionType(undefined)).toEqual({ label: '전략 액션', variant: 'neutral' });
  });

  it('지원하지 않는 액션 타입도 안전한 표시 메타데이터를 반환한다', () => {
    expect(resolveStrategyActionType('RT_TRANSFER').label).toBe('재고 이동');
    expect(resolveStrategyActionType('UNKNOWN')).toEqual({ label: 'UNKNOWN', variant: 'neutral' });
  });

  it('기준 시계열과 옵션 시계열을 같은 날짜 행으로 합친다', () => {
    const result = buildStrategyChartData({
      baselineSimulation: {
        dailySeries: [
          { date: '2026-08-20', expectedRemainingQty: 10, cumulativeRevenue: 100, cumulativeContributionMargin: 30 },
          { date: '2026-08-21', expectedRemainingQty: 9, cumulativeRevenue: 200, cumulativeContributionMargin: 60 },
        ],
      },
      options: [
        {
          optionKey: 'opt-a',
          rank: 1,
          simulationDailySeries: [
            { date: '2026-08-21', expectedRemainingQty: 7, cumulativeRevenue: 300, cumulativeContributionMargin: 90 },
            { date: '2026-08-20', expectedRemainingQty: 8, cumulativeRevenue: 200, cumulativeContributionMargin: 70 },
            { date: '2026-08-22', expectedRemainingQty: 6, cumulativeRevenue: 400, cumulativeContributionMargin: 120 },
          ],
        },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ baselineRemainingQty: 10, 'opt-aRemainingQty': 8, 'opt-aRevenue': 200 });
    expect(result[1]).toMatchObject({ date: '2026-08-21', 'opt-aRemainingQty': 7, 'opt-aRevenue': 300 });
  });

  it('요약 결과를 기준 시나리오 비교 행으로 만든다', () => {
    const rows = getSimulationComparisonRows(
      {
        baselineSimulation: {
          summary: {
            expectedSalesQty: 10,
            expectedRevenue: 100,
            totalContributionMargin: 20,
            contributionMarginRate: 0.2,
            expectedSellThroughDays: 12,
            expectedRemainingQty: 30,
          },
        },
      },
      {
        simulationSummary: {
          expectedSalesQty: 15,
          expectedRevenue: 180,
          totalContributionMargin: 45,
          contributionMarginRate: 0.25,
          expectedSellThroughDays: 8,
          expectedRemainingQty: 25,
          movementCost: 5,
          avoidedHoldingCost: 7,
          avoidedDisposalCost: 9,
          comparisonToBaseline: {
            incrementalSalesQty: 5,
            incrementalRevenue: 80,
            incrementalContributionMargin: 25,
            reducedRemainingQty: 5,
            sellThroughDaysChange: -4,
          },
        },
      },
    );

    expect(rows.find(({ key }) => key === 'expectedRemainingQty')?.change).toBe(-5);
    expect(rows.find(({ key }) => key === 'expectedRevenue')?.baselineValue).toBe(100);
  });

  it('비교 기준값이 없으면 NaN 대신 null을 반환한다', () => {
    const rows = getSimulationComparisonRows(
      { baselineSimulation: null },
      {
        simulationSummary: {
          contributionMarginRate: 0.3,
          expectedRemainingQty: 10,
          comparisonToBaseline: {},
        },
      },
    );

    expect(rows.find(({ key }) => key === 'contributionMarginRate')?.change).toBeNull();
    expect(rows.find(({ key }) => key === 'expectedRemainingQty')?.change).toBeNull();
  });

  it('재할당 액션 기본값에는 할인 조건을 포함하지 않는다', () => {
    const defaults = getStrategyAdjustmentDefaults({
      actions: [
        {
          actionOrder: 1,
          actionType: 'REALLOCATION',
          actionQuantity: 20,
          strategyPrice: 1000,
          startDate: '2026-08-20',
          endDate: '2026-08-27',
          estimatedActionCost: 500,
        },
      ],
    });

    expect(defaults.actions[1]).toMatchObject({ actionType: 'REALLOCATION', quantity: 20, actionCost: 500 });
    expect(defaults.actions[1]).not.toHaveProperty('discountPercent');
    expect(defaults.actions[1]).not.toHaveProperty('strategyPrice');
  });
});
