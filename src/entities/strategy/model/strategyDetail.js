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

function subtractOrNull(left, right) {
  return Number.isFinite(left) && Number.isFinite(right) ? left - right : null;
}

function negateOrNull(value) {
  return Number.isFinite(value) ? -value : null;
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

export function buildStrategyChartData(strategyCase) {
  const baseline = strategyCase?.baselineSimulation?.dailySeries ?? [];
  const options = sortStrategyOptions(strategyCase?.options);
  const optionSeriesByDate = Object.fromEntries(
    options.map((option) => [
      option.optionKey,
      new Map((option.simulationDailySeries ?? []).map((point) => [point.date, point])),
    ]),
  );

  return baseline.map((point) => {
    const row = {
      date: point.date,
      baselineRemainingQty: point.expectedRemainingQty,
      baselineRevenue: point.cumulativeRevenue,
      baselineContributionMargin: point.cumulativeContributionMargin,
    };

    options.forEach((option) => {
      const optionPoint = optionSeriesByDate[option.optionKey].get(point.date);
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
