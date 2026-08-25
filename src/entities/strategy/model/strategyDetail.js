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

const locationTypeLabels = Object.freeze({
  WAREHOUSE: '물류센터',
  SALES_POINT: '판매처',
});

function resolveLocationValue(location, includeType) {
  if (!location?.locationName) return '서버 자동 선택';
  const typeLabel = locationTypeLabels[location.locationType];
  return includeType && typeLabel ? `${location.locationName} (${typeLabel})` : location.locationName;
}

export function resolveStrategyLocationPresentation(action = {}) {
  if (action.actionType === 'REALLOCATION') {
    return {
      quantityLabel: '재할당 수량',
      sourceLabel: '기존 할당 판매처',
      targetLabel: '변경 할당 판매처',
      sourceValue: resolveLocationValue(action.sourceLocation, false),
      targetValue: resolveLocationValue(action.targetLocation, false),
      badge: '물리적 이동 없음',
      badgeVariant: 'neutral',
      description: '같은 물류센터에서 재고 보관 위치는 유지하고 판매처 할당량만 변경합니다.',
    };
  }

  if (action.actionType === 'RT_TRANSFER') {
    const sourceType = locationTypeLabels[action.sourceLocation?.locationType];
    const targetType = locationTypeLabels[action.targetLocation?.locationType];
    return {
      quantityLabel: '이동 수량',
      sourceLabel: sourceType ? `출발 ${sourceType}` : '출발 위치',
      targetLabel: targetType ? `도착 ${targetType}` : '도착 위치',
      sourceValue: resolveLocationValue(action.sourceLocation, true),
      targetValue: resolveLocationValue(action.targetLocation, true),
      badge: '실물 재고 이동',
      badgeVariant: 'warning',
      description: '출발 위치에서 도착 위치로 재고를 실제 운송합니다.',
    };
  }

  return null;
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

function inclusiveDateCount(startDate, endDate) {
  const parseDate = (value) => {
    const [year, month, day] = String(value ?? '')
      .split('-')
      .map(Number);
    if (!year || !month || !day) return null;
    return Date.UTC(year, month - 1, day);
  };
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (start === null || end === null) return null;
  return Math.floor((end - start) / 86_400_000) + 1;
}

export function getStrategyAdjustmentValidationError(option, adjustment) {
  const defaults = getStrategyAdjustmentDefaults(option);
  const actions = option?.actions ?? [];
  const quantityAction = actions.find(
    (action) => action.actionQuantity !== null && action.actionQuantity !== undefined,
  );
  const periodAction = quantityAction ?? actions[0];
  const quantityValues =
    adjustment?.actions?.[quantityAction?.actionOrder] ?? defaults.actions[quantityAction?.actionOrder];
  const periodValues = adjustment?.actions?.[periodAction?.actionOrder] ?? defaults.actions[periodAction?.actionOrder];
  const actionQuantity = Number(quantityValues?.quantity);

  if (!Number.isInteger(actionQuantity) || actionQuantity <= 0) return '적용 수량을 1개 이상 입력해 주세요.';
  if (!periodValues?.startDate || !periodValues?.endDate) return '전략 시작일과 종료일을 입력해 주세요.';
  if (periodValues.startDate > periodValues.endDate) return '전략 종료일은 시작일보다 빠를 수 없습니다.';

  const constraints = option?.adjustmentConstraints;
  if (constraints?.minimumStartDate && periodValues.startDate < constraints.minimumStartDate) {
    return `전략 시작일은 ${constraints.minimumStartDate} 이후여야 합니다.`;
  }
  if (constraints?.latestSelectableEndDate && periodValues.endDate > constraints.latestSelectableEndDate) {
    return `전략 종료일은 ${constraints.latestSelectableEndDate} 이전이어야 합니다.`;
  }

  const periodDays = inclusiveDateCount(periodValues.startDate, periodValues.endDate);
  if (constraints?.maximumPeriodDays && periodDays > constraints.maximumPeriodDays) {
    return `전략 기간은 최대 ${constraints.maximumPeriodDays}일까지 선택할 수 있습니다.`;
  }
  return null;
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

  const validationError = getStrategyAdjustmentValidationError(option, adjustment);
  if (validationError) throw new Error(validationError);

  return {
    actionQuantity,
    discountRate: discountAction ? Number(discountValues?.discountPercent ?? 0) / 100 : null,
    startDate: periodValues.startDate,
    endDate: periodValues.endDate,
  };
}

export function buildStrategySelectionPayload(option, appliedAdjustment) {
  if (!option?.optionId) throw new Error('선택할 전략 정보를 확인할 수 없습니다.');

  const recommendedConditions = buildStrategyAdjustmentPayload(option, getStrategyAdjustmentDefaults(option));
  const appliedConditions = buildStrategyAdjustmentPayload(option, appliedAdjustment);
  const adjusted = Object.keys(recommendedConditions).some(
    (key) => recommendedConditions[key] !== appliedConditions[key],
  );

  return adjusted
    ? { optionId: option.optionId, adjustedConditions: appliedConditions }
    : { optionId: option.optionId };
}

export function buildStrategyChartData(strategyCase, chartRange = null) {
  const baseline = strategyCase?.baselineSimulation?.dailySeries ?? [];
  const options = sortStrategyOptions(strategyCase?.options);
  const optionSeriesByDate = Object.fromEntries(
    options.map((option) => [
      option.optionKey,
      new Map((option.simulationDailySeries ?? []).map((point) => [point.date, point])),
    ]),
  );

  return baseline
    .filter(
      (point) =>
        (!chartRange?.startDate || point.date >= chartRange.startDate) &&
        (!chartRange?.endDate || point.date <= chartRange.endDate),
    )
    .map((point) => {
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
  const netEffect = summary.netEffect ?? comparison.incrementalEconomicBenefit;

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
      label: '기준 대비 경제효과',
      kind: 'economicEffect',
      value:
        Number.isFinite(netEffect) && Number.isFinite(baseline.totalContributionMargin)
          ? baseline.totalContributionMargin > 0
            ? netEffect / baseline.totalContributionMargin
            : null
          : null,
      baselineValue: null,
      change: null,
      amount: netEffect,
    },
  ].filter((row) => row.value !== undefined);
}
