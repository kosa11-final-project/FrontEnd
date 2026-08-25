import { describe, expect, it } from 'vitest';
import { applyAdjustedSimulationResult, mapAiStrategyDetailResponse } from './strategyDetailMapper.js';

const simulation = {
  candidateId: 'CAND-1',
  summary: {
    expectedSalesQty: 8,
    expectedRevenue: 680000,
    totalContributionMargin: 120000,
    contributionMarginRate: 0.1765,
    expectedSellThroughDays: 8,
    expectedRemainingQty: 2,
    expectedDisposalQty: 0,
    estimatedActionCost: 10000,
    netEffect: 20000,
  },
  comparisonToBaseline: {
    salesQtyDelta: 2,
    revenueDelta: 80000,
    contributionMarginDelta: 30000,
    remainingQtyReduction: 2,
    disposalQtyReduction: 1,
    netEffect: 20000,
  },
  dailySeries: [
    {
      date: '2026-08-24',
      expectedSalesQty: 8,
      expectedRemainingQty: 2,
      cumulativeRevenue: 680000,
      cumulativeContributionMargin: 120000,
    },
  ],
  assumptions: [],
};

function detailResponse() {
  return {
    data: {
      strategyCaseId: 123,
      caseName: '떡볶이 재고 전략',
      caseStatus: 'GENERATED',
      generationStage: 'COMPARISON_READY',
      sku: {
        skuId: 10,
        skuCode: 'SKU-10',
        skuName: '치즈 떡볶이',
        imageUrl: null,
        category: { categoryId: 3, categoryName: '간편식', categoryLevel: 3 },
      },
      requester: { userId: 7, userName: '이주영' },
      createdAt: '2026-08-24T10:00:00',
      completedAt: '2026-08-24T10:02:00',
      resultExpiresAt: '2026-08-27T10:02:00',
      requestConditions: {
        sourceSalesPoint: { salesPointId: 1, salesPointCode: 'DEPT_MOKDONG', salesPointName: '목동점' },
        lots: [{ lotId: 11, lotCode: 'LOT-11' }],
        candidateSalesPoints: [{ salesPointId: 2, salesPointCode: 'DEPT_PANGYO', salesPointName: '판교점' }],
        strategyTypes: ['RT_TRANSFER', 'PRICE_DISCOUNT'],
        preferredStartDate: '2026-08-24',
        preferredEndDate: '2026-08-31',
        forecastStartDate: '2026-08-24',
        forecastEndDate: '2026-09-30',
      },
      result: {
        generatedAt: '2026-08-24T10:02:00',
        baselineSimulation: {
          summary: { expectedSalesQty: 6, expectedRemainingQty: 4 },
          dailySeries: [{ date: '2026-08-24', expectedRemainingQty: 4 }],
        },
        options: [
          {
            rank: 1,
            optionName: '재배치 전략 (S1 → S11, 수량 10개)',
            recommendationReason: 'S1보다 S11의 예상 수요가 높습니다.',
            advantage: 'S11의 판매 기회를 활용합니다.',
            caution: 'S1 출고 전 재고를 확인해야 합니다.',
            candidate: {
              candidateId: 'CAND-1',
              strategyTypes: ['RT_TRANSFER', 'PRICE_DISCOUNT'],
              startDate: '2026-08-24',
              endDate: '2026-08-31',
              maxExecutableQty: 10,
              assumptions: ['INVENTORY_RESERVED_UNTIL_STRATEGY_START'],
              actions: [
                {
                  actionType: 'RT_TRANSFER',
                  sourceLocation: {
                    locationType: 'SALES_POINT',
                    locationId: 1,
                    locationCode: 'DEPT_MOKDONG',
                    locationName: '목동점',
                  },
                  targetLocation: {
                    locationType: 'SALES_POINT',
                    locationId: 11,
                    locationCode: 'DEPT_PANGYO',
                    locationName: '판교점',
                  },
                  actionQuantity: 10,
                  estimatedActionCost: 10000,
                  strategyPrice: null,
                  discountRate: null,
                  lotAllocations: [{ inventoryBalanceId: 31, lotId: 11, lotCode: 'LOT-11', quantity: 10 }],
                },
              ],
            },
            simulation,
          },
        ],
        noRecommendation: null,
      },
    },
  };
}

describe('AI strategy detail mapper', () => {
  it('maps enriched detail fields and candidate simulations to the UI model', () => {
    const result = mapAiStrategyDetailResponse(detailResponse());

    expect(result).toMatchObject({
      strategyCaseId: 123,
      caseCode: '#123',
      requestedBy: { userId: 7, userName: '이주영' },
      requestConditions: {
        sourceSalesPointName: '목동점',
        lotLabels: ['LOT-11'],
        candidateSalesPointNames: ['판교점'],
      },
      options: [
        {
          optionId: 'CAND-1',
          optionKey: 'CAND-1',
          maxExecutableQty: 10,
          actions: [{ actionOrder: 1, startDate: '2026-08-24' }],
          simulationSummary: {
            expectedSalesQty: 8,
            movementCost: 10000,
            comparisonToBaseline: { incrementalEconomicBenefit: 20000 },
          },
        },
      ],
    });
    expect(result.options[0].actions[0].lotAllocations[0]).toMatchObject({
      lotCode: 'LOT-11',
      allocatedQuantity: 10,
    });
    expect(result.options[0]).toMatchObject({
      optionName: '재배치 전략 (목동점 → 판교점, 수량 10개)',
      recommendationReason: '목동점보다 판교점의 예상 수요가 높습니다.',
      advantage: '판교점의 판매 기회를 활용합니다.',
      caution: '목동점 출고 전 재고를 확인해야 합니다.',
    });
  });

  it('applies the server-calculated conditions and simulation without changing the original option', () => {
    const option = mapAiStrategyDetailResponse(detailResponse()).options[0];
    const adjusted = applyAdjustedSimulationResult(option, {
      strategyCaseId: 123,
      candidateId: 'CAND-1',
      adjustedConditions: {
        actionQuantity: 7,
        discountRate: null,
        strategyPrice: null,
        startDate: '2026-08-25',
        endDate: '2026-08-30',
        maximumExecutableQuantity: 8,
        salesPointGroup: null,
        maximumDiscountRate: null,
      },
      simulation: { ...simulation, summary: { ...simulation.summary, expectedSalesQty: 8 } },
    });

    expect(adjusted.actions[0]).toMatchObject({ actionQuantity: 7, startDate: '2026-08-25', endDate: '2026-08-30' });
    expect(adjusted.maxExecutableQty).toBe(8);
    expect(adjusted.simulationSummary.expectedSalesQty).toBe(8);
    expect(adjusted.simulationSummary.expectedSalesQty).toBeGreaterThan(adjusted.actions[0].actionQuantity);
    expect(option.actions[0].actionQuantity).toBe(10);
  });
});
