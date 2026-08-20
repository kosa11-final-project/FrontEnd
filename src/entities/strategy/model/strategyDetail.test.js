import { describe, expect, it } from 'vitest';
import {
  buildAdjustedStrategyOption,
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

  it('지원하지 않는 액션 타입도 안전한 표시 메타데이터를 반환한다', () => {
    expect(resolveStrategyActionType('RT_TRANSFER').label).toBe('재고 이동');
    expect(resolveStrategyActionType('UNKNOWN')).toEqual({ label: 'UNKNOWN', variant: 'neutral' });
  });

  it('기준 시계열과 옵션 시계열을 같은 날짜 행으로 합친다', () => {
    const result = buildStrategyChartData({
      baselineSimulation: {
        dailySeries: [
          { date: '2026-08-20', expectedRemainingQty: 10, cumulativeRevenue: 100, cumulativeContributionMargin: 30 },
        ],
      },
      options: [
        {
          optionKey: 'opt-a',
          rank: 1,
          simulationDailySeries: [
            { date: '2026-08-20', expectedRemainingQty: 8, cumulativeRevenue: 200, cumulativeContributionMargin: 70 },
          ],
        },
      ],
    });

    expect(result[0]).toMatchObject({ baselineRemainingQty: 10, 'opt-aRemainingQty': 8, 'opt-aRevenue': 200 });
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

  it('조건 조정값으로 예상 수량과 금액 시계열을 다시 계산한다', () => {
    const strategyCase = {
      baselineSimulation: {
        summary: {
          expectedSalesQty: 10,
          expectedRevenue: 1000,
          totalContributionMargin: 300,
          contributionMarginRate: 0.3,
          expectedSellThroughDays: 12,
          expectedRemainingQty: 30,
        },
        dailySeries: [{ expectedRemainingQty: 40 }],
      },
    };
    const option = {
      optionKey: 'adjustable',
      actions: [
        {
          actionType: 'PRICE_DISCOUNT',
          actionQuantity: 30,
          discountRate: 0.1,
          strategyPrice: 900,
          startDate: '2026-08-20',
          endDate: '2026-08-27',
          estimatedActionCost: 100,
        },
      ],
      simulationSummary: {
        expectedSalesQty: 20,
        expectedRevenue: 18000,
        totalContributionMargin: 6000,
        contributionMarginRate: 1 / 3,
        expectedSellThroughDays: null,
        expectedRemainingQty: 20,
        avoidedHoldingCost: 100,
        avoidedDisposalCost: 200,
        comparisonToBaseline: {},
      },
      simulationDailySeries: [
        { date: '2026-08-20', expectedRemainingQty: 40, cumulativeRevenue: 0, cumulativeContributionMargin: 0 },
        { date: '2026-08-27', expectedRemainingQty: 20, cumulativeRevenue: 18000, cumulativeContributionMargin: 6000 },
      ],
    };
    const defaults = getStrategyAdjustmentDefaults(option);
    const adjusted = buildAdjustedStrategyOption(strategyCase, option, {
      ...defaults,
      quantity: 15,
      strategyPrice: 800,
    });

    expect(defaults.discountPercent).toBe(10);
    expect(adjusted.simulationSummary.expectedSalesQty).toBeLessThanOrEqual(15);
    expect(adjusted.simulationSummary.expectedRevenue).toBe(adjusted.simulationSummary.expectedSalesQty * 800);
    expect(adjusted.simulationDailySeries.at(-1).expectedRemainingQty).toBe(
      adjusted.simulationSummary.expectedRemainingQty,
    );
  });
});
