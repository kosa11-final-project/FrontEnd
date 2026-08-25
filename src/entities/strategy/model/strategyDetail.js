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

function getStrategyDuration(actionItems, valueKey) {
  const ranges = actionItems
    .map((item) => item[valueKey])
    .filter(({ startDate, endDate } = {}) => startDate && endDate);
  if (ranges.length === 0) return 1;

  const startDate = ranges.map((range) => range.startDate).sort()[0];
  const endDate = ranges
    .map((range) => range.endDate)
    .sort()
    .at(-1);
  return getInclusiveDays(startDate, endDate);
}

function subtractOrNull(left, right) {
  return Number.isFinite(left) && Number.isFinite(right) ? left - right : null;
}

function negateOrNull(value) {
  return Number.isFinite(value) ? -value : null;
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

export function buildStrategyAdjustmentPayload(option, adjustment) {
  const defaults = getStrategyAdjustmentDefaults(option);
  const actions = option?.actions ?? [];
  const quantityAction = actions.find(
    (action) => action.actionQuantity !== null && action.actionQuantity !== undefined,
  );
  const discountAction = actions.find((action) => action.actionType === 'PRICE_DISCOUNT');
  const periodAction = quantityAction ?? actions[0];
  const quantityOrder = quantityAction?.actionOrder;
  const discountOrder = discountAction?.actionOrder;
  const periodOrder = periodAction?.actionOrder;
  const quantityValues = adjustment?.actions?.[quantityOrder] ?? defaults.actions[quantityOrder];
  const discountValues = adjustment?.actions?.[discountOrder] ?? defaults.actions[discountOrder];
  const periodValues = adjustment?.actions?.[periodOrder] ?? defaults.actions[periodOrder];
  const actionQuantity = Number(quantityValues?.quantity);

  if (!Number.isInteger(actionQuantity) || actionQuantity <= 0 || !periodValues?.startDate || !periodValues?.endDate) {
    throw new Error('적용 수량과 전략 기간을 확인해 주세요.');
  }

  return {
    actionQuantity,
    discountRate: discountAction ? Number(discountValues?.discountPercent ?? 0) / 100 : null,
    startDate: periodValues.startDate,
    endDate: periodValues.endDate,
  };
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
  const baseSales = option.simulationSummary.expectedSalesQty || 1;
  const inferredUnitRevenue = (option.simulationSummary.expectedRevenue || 0) / baseSales;
  const defaultStrategyPrice =
    discountAction?.defaults.strategyPrice ??
    quantityAction?.action.strategyPrice ??
    option.actions[0]?.strategyPrice ??
    inferredUnitRevenue;
  const strategyPrice = Math.max(
    Number(discountAction?.values.strategyPrice ?? quantityAction?.action.strategyPrice ?? defaultStrategyPrice) || 0,
    0,
  );
  const actionCost = adjustedActions.reduce(
    (sum, item) => sum + Math.max(Number(item.values.actionCost ?? item.action.estimatedActionCost) || 0, 0),
    0,
  );
  const baseQuantity = quantityAction?.defaults.quantity || 1;
  const baseDuration = getStrategyDuration(quantityActions, 'defaults');
  const adjustedDuration = getStrategyDuration(quantityActions, 'values');
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
  const baseline = strategyCase.baselineSimulation?.summary ?? {};
  const avoidedHoldingCost = Math.max(
    0,
    Math.round((Number(option.simulationSummary.avoidedHoldingCost) || 0) * salesRatio),
  );
  const avoidedDisposalCost = Math.max(
    0,
    Math.round((Number(option.simulationSummary.avoidedDisposalCost) || 0) * salesRatio),
  );

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
      incrementalSalesQty: subtractOrNull(expectedSalesQty, baseline.expectedSalesQty),
      incrementalRevenue: subtractOrNull(expectedRevenue, baseline.expectedRevenue),
      incrementalContributionMargin: subtractOrNull(totalContributionMargin, baseline.totalContributionMargin),
      reducedRemainingQty: subtractOrNull(baseline.expectedRemainingQty, expectedRemainingQty),
      sellThroughDaysChange:
        expectedSellThroughDays == null || baseline.expectedSellThroughDays == null
          ? null
          : expectedSellThroughDays - baseline.expectedSellThroughDays,
      incrementalEconomicBenefit: Number.isFinite(baseline.totalContributionMargin)
        ? totalContributionMargin -
          baseline.totalContributionMargin +
          avoidedHoldingCost +
          avoidedDisposalCost -
          actionCost
        : null,
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
      change: subtractOrNull(summary.contributionMarginRate, baseline.contributionMarginRate),
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
      change: negateOrNull(comparison.reducedRemainingQty),
    },
    {
      key: 'expectedDisposalQty',
      label: '예상 폐기수량',
      kind: 'quantity',
      value: summary.expectedDisposalQty,
      baselineValue: baseline.expectedDisposalQty,
      change: negateOrNull(comparison.reducedDisposalQty),
    },
    {
      key: 'movementCost',
      label: '예상 실행비',
      kind: 'currency',
      value: summary.movementCost,
      baselineValue: 0,
      change: summary.movementCost,
    },
    {
      key: 'netEffect',
      label: '기준 대비 순효과',
      kind: 'currency',
      value: summary.netEffect,
      baselineValue: 0,
      change: comparison.incrementalEconomicBenefit,
    },
  ].filter((row) => row.value !== undefined);
}
