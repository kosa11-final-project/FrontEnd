export const strategyActionTypeMeta = Object.freeze({
  REALLOCATION: { label: '재고 재할당', variant: 'info' },
  RT_TRANSFER: { label: '재고 이동', variant: 'good' },
  PRICE_DISCOUNT: { label: '가격 할인', variant: 'warning' },
  CHANNEL_EXPANSION: { label: '채널 확대', variant: 'info' },
  CHANNEL_CONCENTRATION: { label: '채널 집중', variant: 'neutral' },
});

export function resolveStrategyActionType(type) {
  return strategyActionTypeMeta[type] ?? { label: type || '전략 액션', variant: 'neutral' };
}

export function sortStrategyOptions(options = []) {
  return [...options].sort((a, b) => a.rank - b.rank);
}

export function resolveStrategyOption(options = [], optionKey) {
  const sorted = sortStrategyOptions(options);
  return sorted.find((option) => option.optionKey === optionKey) ?? sorted[0] ?? null;
}

function getInclusiveDays(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Number.isFinite(days) && days > 0 ? days : 1;
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

export function getStrategyAdjustmentDefaults(option) {
  const actions = Object.fromEntries(
    (option?.actions ?? []).map((action, index) => {
      const actionOrder = action.actionOrder ?? index + 1;
      const values = {
        actionType: action.actionType,
        quantity: action.actionQuantity ?? 0,
        startDate: action.startDate ?? '',
        endDate: action.endDate ?? '',
        sourceLocation: action.sourceLocation ?? null,
        targetLocation: action.targetLocation ?? null,
      };

      if (action.actionType === 'PRICE_DISCOUNT') {
        values.discountPercent = (action.discountRate ?? 0) * 100;
        values.strategyPrice = action.strategyPrice ?? 0;
      } else {
        values.actionCost = action.estimatedActionCost ?? 0;
      }

      return [actionOrder, values];
    }),
  );

  return { actions };
}

export function buildAdjustedStrategyOption(strategyCase, option, adjustment) {
  if (!strategyCase || !option) return option;

  const defaults = getStrategyAdjustmentDefaults(option);
  const adjustedActions = option.actions.map((action, index) => {
    const actionOrder = action.actionOrder ?? index + 1;
    return {
      action: { ...action, actionOrder },
      defaults: defaults.actions[actionOrder],
      values: adjustment?.actions?.[actionOrder] ?? defaults.actions[actionOrder],
    };
  });
  const quantityActions = adjustedActions.filter(({ action }) => action.actionQuantity !== null);
  const quantityAction = quantityActions[0] ?? adjustedActions[0];
  const discountAction = adjustedActions.find(({ action }) => action.actionType === 'PRICE_DISCOUNT');
  const initialStock =
    strategyCase.baselineSimulation?.dailySeries?.[0]?.expectedRemainingQty ?? quantityAction?.defaults.quantity ?? 0;
  const quantity = Math.min(
    ...quantityActions.map(({ values }) => clamp(values.quantity, 0, initialStock)),
    initialStock,
  );
  const defaultDiscountPercent = discountAction?.defaults.discountPercent ?? 0;
  const discountPercent = clamp(discountAction?.values.discountPercent ?? 0, 0, 50);
  const defaultStrategyPrice =
    discountAction?.defaults.strategyPrice ??
    quantityAction?.action.strategyPrice ??
    option.actions[0]?.strategyPrice ??
    0;
  const strategyPrice = Math.max(
    Number(discountAction?.values.strategyPrice ?? quantityAction?.action.strategyPrice ?? defaultStrategyPrice) || 0,
    0,
  );
  const actionCost = adjustedActions.reduce(
    (sum, item) => sum + Math.max(Number(item.values.actionCost ?? item.action.estimatedActionCost) || 0, 0),
    0,
  );
  const baseSales = option.simulationSummary.expectedSalesQty || 1;
  const baseQuantity = quantityAction?.defaults.quantity || 1;
  const baseDuration = getInclusiveDays(quantityAction?.defaults.startDate, quantityAction?.defaults.endDate);
  const adjustedDuration = getInclusiveDays(quantityAction?.values.startDate, quantityAction?.values.endDate);
  const discountLift = Math.max(0.5, 1 + ((discountPercent - defaultDiscountPercent) / 100) * 1.5);
  const durationLift = Math.sqrt(adjustedDuration / baseDuration);
  const quantityLift = Math.sqrt(quantity / baseQuantity);
  const targetChanged = adjustedActions.some(
    ({ defaults: actionDefaults, values }) =>
      values.targetLocation?.locationId !== actionDefaults.targetLocation?.locationId,
  );
  const targetLift = targetChanged ? 1.06 : 1;
  const expectedSalesQty = Math.min(
    initialStock,
    quantity,
    Math.max(0, Math.round(baseSales * discountLift * durationLift * quantityLift * targetLift)),
  );
  const expectedRemainingQty = Math.max(0, initialStock - expectedSalesQty);
  const expectedRevenue = Math.round(expectedSalesQty * strategyPrice);
  const baseUnitMargin = option.simulationSummary.totalContributionMargin / baseSales;
  const adjustedUnitMargin = baseUnitMargin + (strategyPrice - defaultStrategyPrice);
  const totalContributionMargin = Math.round(expectedSalesQty * adjustedUnitMargin);
  const contributionMarginRate = expectedRevenue === 0 ? 0 : totalContributionMargin / expectedRevenue;
  const expectedSellThroughDays = expectedSalesQty >= quantity && quantity > 0 ? adjustedDuration : null;
  const salesRatio = expectedSalesQty / baseSales;
  const baseline = strategyCase.baselineSimulation.summary;
  const avoidedHoldingCost = Math.max(0, Math.round(option.simulationSummary.avoidedHoldingCost * salesRatio));
  const avoidedDisposalCost = Math.max(0, Math.round(option.simulationSummary.avoidedDisposalCost * salesRatio));

  const simulationSummary = {
    ...option.simulationSummary,
    expectedSalesQty,
    expectedRevenue,
    totalContributionMargin,
    contributionMarginRate,
    expectedSellThroughDays,
    expectedRemainingQty,
    movementCost: actionCost,
    avoidedHoldingCost,
    avoidedDisposalCost,
    comparisonToBaseline: {
      ...option.simulationSummary.comparisonToBaseline,
      incrementalSalesQty: expectedSalesQty - baseline.expectedSalesQty,
      incrementalRevenue: expectedRevenue - baseline.expectedRevenue,
      incrementalContributionMargin: totalContributionMargin - baseline.totalContributionMargin,
      reducedRemainingQty: baseline.expectedRemainingQty - expectedRemainingQty,
      sellThroughDaysChange:
        expectedSellThroughDays === null || baseline.expectedSellThroughDays === null
          ? null
          : expectedSellThroughDays - baseline.expectedSellThroughDays,
      incrementalEconomicBenefit:
        totalContributionMargin -
        baseline.totalContributionMargin +
        avoidedHoldingCost +
        avoidedDisposalCost -
        actionCost,
    },
  };

  const seriesLength = option.simulationDailySeries?.length ?? 0;
  const simulationDailySeries = (option.simulationDailySeries ?? []).map((point, index) => {
    const progress = seriesLength <= 1 ? 1 : index / (seriesLength - 1);
    return {
      ...point,
      expectedRemainingQty: Math.max(0, Math.round(initialStock - expectedSalesQty * progress)),
      cumulativeRevenue: Math.round(expectedRevenue * progress),
      cumulativeContributionMargin: Math.round(totalContributionMargin * progress),
    };
  });

  const actions = adjustedActions.map(({ action, values }) => {
    return {
      ...action,
      actionQuantity: clamp(values.quantity, 0, initialStock),
      sourceLocation: values.sourceLocation,
      targetLocation: values.targetLocation,
      discountRate:
        action.actionType === 'PRICE_DISCOUNT' ? clamp(values.discountPercent, 0, 50) / 100 : action.discountRate,
      strategyPrice:
        action.actionType === 'PRICE_DISCOUNT' ? Math.max(Number(values.strategyPrice) || 0, 0) : action.strategyPrice,
      startDate: values.startDate,
      endDate: values.endDate,
      estimatedActionCost:
        action.actionType === 'PRICE_DISCOUNT'
          ? action.estimatedActionCost
          : Math.max(Number(values.actionCost) || 0, 0),
    };
  });

  return { ...option, actions, simulationSummary, simulationDailySeries };
}

export function buildStrategyChartData(strategyCase) {
  const baseline = strategyCase?.baselineSimulation?.dailySeries ?? [];
  const options = sortStrategyOptions(strategyCase?.options);

  return baseline.map((point, index) => {
    const row = {
      date: point.date,
      baselineRemainingQty: point.expectedRemainingQty,
      baselineRevenue: point.cumulativeRevenue,
      baselineContributionMargin: point.cumulativeContributionMargin,
    };

    options.forEach((option) => {
      const optionPoint = option.simulationDailySeries?.[index];
      row[`${option.optionKey}RemainingQty`] = optionPoint?.expectedRemainingQty ?? null;
      row[`${option.optionKey}Revenue`] = optionPoint?.cumulativeRevenue ?? null;
      row[`${option.optionKey}ContributionMargin`] = optionPoint?.cumulativeContributionMargin ?? null;
    });

    return row;
  });
}

export function getSimulationComparisonRows(strategyCase, option) {
  if (!strategyCase || !option) return [];
  const baseline = strategyCase.baselineSimulation?.summary ?? {};
  const summary = option.simulationSummary ?? {};
  const comparison = summary.comparisonToBaseline ?? {};

  return [
    {
      key: 'expectedSalesQty',
      label: '예상 판매량',
      kind: 'quantity',
      value: summary.expectedSalesQty,
      baselineValue: baseline.expectedSalesQty,
      change: comparison.incrementalSalesQty,
    },
    {
      key: 'expectedRevenue',
      label: '예상 매출',
      kind: 'currency',
      value: summary.expectedRevenue,
      baselineValue: baseline.expectedRevenue,
      change: comparison.incrementalRevenue,
    },
    {
      key: 'totalContributionMargin',
      label: '예상 공헌이익',
      kind: 'currency',
      value: summary.totalContributionMargin,
      baselineValue: baseline.totalContributionMargin,
      change: comparison.incrementalContributionMargin,
    },
    {
      key: 'contributionMarginRate',
      label: '예상 공헌이익률',
      kind: 'rate',
      value: summary.contributionMarginRate,
      baselineValue: baseline.contributionMarginRate,
      change: summary.contributionMarginRate - baseline.contributionMarginRate,
    },
    {
      key: 'expectedSellThroughDays',
      label: '예상 재고 소진기간',
      kind: 'days',
      value: summary.expectedSellThroughDays,
      baselineValue: baseline.expectedSellThroughDays,
      change: comparison.sellThroughDaysChange,
    },
    {
      key: 'expectedRemainingQty',
      label: '전략 종료 후 잔여재고',
      kind: 'quantity',
      value: summary.expectedRemainingQty,
      baselineValue: baseline.expectedRemainingQty,
      change: -comparison.reducedRemainingQty,
    },
    {
      key: 'movementCost',
      label: '예상 이동비',
      kind: 'currency',
      value: summary.movementCost,
      baselineValue: 0,
      change: summary.movementCost,
    },
    {
      key: 'avoidedHoldingCost',
      label: '보관비 절감',
      kind: 'currency',
      value: summary.avoidedHoldingCost,
      baselineValue: 0,
      change: summary.avoidedHoldingCost,
    },
    {
      key: 'avoidedDisposalCost',
      label: '폐기비 절감',
      kind: 'currency',
      value: summary.avoidedDisposalCost,
      baselineValue: 0,
      change: summary.avoidedDisposalCost,
    },
  ];
}
