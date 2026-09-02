import { describe, expect, it } from 'vitest';
import {
  buildStrategyAdjustmentPayload,
  buildStrategyChartData,
  buildStrategySelectionPayload,
  getStrategyAdjustmentValidationError,
  getStrategyAdjustmentDefaults,
  getStrategyEndDateMaximum,
  getSimulationComparisonRows,
  resolveStrategyActionType,
  resolveStrategyLocationPresentation,
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

  it('재할당과 실물 이동의 위치 표현을 구분한다', () => {
    expect(
      resolveStrategyLocationPresentation({
        actionType: 'REALLOCATION',
        sourceLocation: { locationName: '압구정본점', locationType: 'SALES_POINT' },
        targetLocation: { locationName: '무역센터점', locationType: 'SALES_POINT' },
      }),
    ).toMatchObject({
      sourceLabel: '기존 할당 판매처',
      targetLabel: '변경 할당 판매처',
      badge: '물리적 이동 없음',
      sourceValue: '압구정본점',
      targetValue: '무역센터점',
    });
    expect(
      resolveStrategyLocationPresentation({
        actionType: 'RT_TRANSFER',
        sourceLocation: { locationName: '경인센터', locationType: 'WAREHOUSE' },
        targetLocation: { locationName: '무역센터점', locationType: 'SALES_POINT' },
        physicalSourceLocation: { locationName: '경인센터', locationType: 'WAREHOUSE', locationId: 501 },
        physicalDestinationLocation: { locationName: '수지센터', locationType: 'WAREHOUSE', locationId: 502 },
        allocationSourceSalesPoint: { locationName: '압구정본점', locationType: 'SALES_POINT', locationId: 10 },
        allocationTargetSalesPoint: { locationName: '무역센터점', locationType: 'SALES_POINT', locationId: 20 },
      }),
    ).toMatchObject({
      sourceLabel: '출발 물류센터',
      targetLabel: '도착 물류센터',
      badge: '실물 재고 이동',
      sourceValue: '경인센터 (물류센터)',
      targetValue: '수지센터 (물류센터)',
      supplementaryConditions: [
        { label: '기존 할당 판매처', value: '압구정본점' },
        { label: '대상 판매처', value: '무역센터점' },
      ],
    });
  });

  it('위치가 같거나 누락되어도 표시값을 안전하게 만든다', () => {
    expect(
      resolveStrategyLocationPresentation({
        actionType: 'REALLOCATION',
        sourceLocation: { locationName: '압구정본점' },
        targetLocation: { locationName: '압구정본점' },
      }),
    ).toMatchObject({ sourceValue: '압구정본점', targetValue: '압구정본점' });
    expect(resolveStrategyLocationPresentation({ actionType: 'RT_TRANSFER' })).toMatchObject({
      sourceLabel: '출발 위치',
      targetLabel: '도착 위치',
      sourceValue: '서버 자동 선택',
      targetValue: '서버 자동 선택',
    });
    expect(
      resolveStrategyLocationPresentation({
        actionType: 'RT_TRANSFER',
        physicalSourceLocation: { locationName: '압구정본점', locationType: 'SALES_POINT', locationId: 10 },
        physicalDestinationLocation: { locationName: '무역센터점', locationType: 'SALES_POINT', locationId: 20 },
        allocationSourceSalesPoint: { locationName: '압구정본점', locationType: 'SALES_POINT', locationId: 10 },
        allocationTargetSalesPoint: { locationName: '무역센터점', locationType: 'SALES_POINT', locationId: 20 },
      }),
    ).toMatchObject({ supplementaryConditions: [] });
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

  it('서버가 지정한 차트 범위에 포함된 날짜만 합친다', () => {
    const result = buildStrategyChartData(
      {
        baselineSimulation: {
          dailySeries: [
            { date: '2026-08-20', expectedRemainingQty: 10 },
            { date: '2026-08-21', expectedRemainingQty: 9 },
            { date: '2026-08-22', expectedRemainingQty: 8 },
          ],
        },
        options: [],
      },
      { startDate: '2026-08-21', endDate: '2026-08-22' },
    );

    expect(result.map(({ date }) => date)).toEqual(['2026-08-21', '2026-08-22']);
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

  it('기준 대비 경제효과를 무전략 공헌이익 대비 비율로 계산한다', () => {
    const rows = getSimulationComparisonRows(
      { baselineSimulation: { summary: { totalContributionMargin: 200_000 } } },
      { simulationSummary: { netEffect: 50_000, comparisonToBaseline: { incrementalEconomicBenefit: 50_000 } } },
    );
    const economicEffect = rows.find(({ key }) => key === 'netEffect');

    expect(economicEffect).toMatchObject({ kind: 'economicEffect', value: 0.25, amount: 50_000 });
  });

  it('무전략 공헌이익이 0 이하이면 경제효과 비율을 산정하지 않는다', () => {
    const rows = getSimulationComparisonRows(
      { baselineSimulation: { summary: { totalContributionMargin: 0 } } },
      { simulationSummary: { netEffect: 50_000, comparisonToBaseline: {} } },
    );

    expect(rows.find(({ key }) => key === 'netEffect')).toMatchObject({ value: null, amount: 50_000 });
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

  it('서버가 제공한 소비기한과 최대 기간 범위를 조정 요청에도 적용한다', () => {
    const option = {
      adjustmentConstraints: {
        minimumStartDate: '2026-08-20',
        latestSelectableEndDate: '2026-08-25',
        maximumPeriodDays: 4,
      },
      actions: [
        {
          actionOrder: 1,
          actionType: 'REALLOCATION',
          actionQuantity: 10,
          startDate: '2026-08-20',
          endDate: '2026-08-24',
        },
      ],
    };
    const validAdjustment = {
      actions: { 1: { quantity: 8, startDate: '2026-08-21', endDate: '2026-08-24' } },
    };

    expect(getStrategyEndDateMaximum(option)).toBe('2026-08-24');
    expect(getStrategyAdjustmentValidationError(option, validAdjustment)).toBeNull();
    expect(buildStrategyAdjustmentPayload(option, validAdjustment)).toEqual({
      actionQuantity: 8,
      discountRate: null,
      startDate: '2026-08-21',
      endDate: '2026-08-24',
    });
    expect(
      getStrategyAdjustmentValidationError(option, {
        actions: { 1: { quantity: 8, startDate: '2026-08-20', endDate: '2026-08-25' } },
      }),
    ).toBe('전략 종료일은 2026-08-25 이전이어야 합니다.');
    expect(
      getStrategyAdjustmentValidationError(option, {
        actions: { 1: { quantity: 8, startDate: '2026-08-20', endDate: '2026-08-24' } },
      }),
    ).toBe('전략 기간은 최대 4일까지 선택할 수 있습니다.');
  });

  it('AI 추천값은 optionId만, 조정값은 네 가지 적용 조건을 모두 선택 payload에 포함한다', () => {
    const option = {
      optionId: 'CAND-1',
      actions: [
        {
          actionOrder: 1,
          actionType: 'RT_TRANSFER',
          actionQuantity: 29,
          startDate: '2026-08-25',
          endDate: '2026-08-31',
        },
        {
          actionOrder: 2,
          actionType: 'PRICE_DISCOUNT',
          actionQuantity: 29,
          discountRate: 0.1,
          strategyPrice: 9000,
          startDate: '2026-08-25',
          endDate: '2026-08-31',
        },
      ],
    };
    const defaults = getStrategyAdjustmentDefaults(option);

    expect(buildStrategySelectionPayload(option, defaults)).toEqual({ optionId: 'CAND-1' });
    expect(
      buildStrategySelectionPayload(option, {
        actions: {
          ...defaults.actions,
          1: { ...defaults.actions[1], quantity: 20 },
          2: { ...defaults.actions[2], quantity: 20 },
        },
      }),
    ).toEqual({
      optionId: 'CAND-1',
      adjustedConditions: {
        actionQuantity: 20,
        discountRate: 0.1,
        startDate: '2026-08-25',
        endDate: '2026-08-31',
      },
    });
  });
});
