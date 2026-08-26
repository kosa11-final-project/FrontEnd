const assumptionLabels = Object.freeze({
  SAFETY_STOCK_DEFAULTED_TO_ZERO: '안전재고 정보가 없어 0으로 계산했습니다.',
  TRANSFER_COST_EXCLUDED: '재고 이동비가 계산에서 제외되었습니다.',
  DISCOUNT_DEMAND_UPLIFT_NOT_APPLIED: '할인에 따른 추가 수요를 반영하지 않았습니다.',
  TARGET_COMMERCIAL_TERMS_COPIED_FROM_SOURCE: '대상 판매처의 거래 조건은 출발 판매처와 동일하게 계산했습니다.',
  INVENTORY_RESERVED_UNTIL_STRATEGY_START: '전략 시작일까지 대상 재고가 유지되는 것으로 계산했습니다.',
});

function requireDetailData(response) {
  const data = response?.data;
  if (!data || !Number.isInteger(data.strategyCaseId) || !data.caseStatus) {
    throw new Error('AI 전략 상세 응답 형식이 올바르지 않습니다.');
  }
  return data;
}

function mapSimulation(simulation) {
  if (!simulation?.summary || !simulation?.comparisonToBaseline || !Array.isArray(simulation.dailySeries)) {
    return null;
  }

  const summary = simulation.summary;
  const comparison = simulation.comparisonToBaseline;
  return {
    simulationSummary: {
      ...summary,
      movementCost: summary.estimatedActionCost,
      comparisonToBaseline: {
        incrementalSalesQty: comparison.salesQtyDelta,
        incrementalRevenue: comparison.revenueDelta,
        incrementalContributionMargin: comparison.contributionMarginDelta,
        reducedRemainingQty: comparison.remainingQtyReduction,
        reducedDisposalQty: comparison.disposalQtyReduction,
        incrementalEconomicBenefit: comparison.netEffect,
      },
    },
    simulationDailySeries: simulation.dailySeries,
  };
}

function mapAdjustmentConstraints(constraints) {
  if (!constraints) return null;

  return {
    minimumStartDate: constraints.minimumStartDate ?? null,
    latestSelectableEndDate: constraints.latestSelectableEndDate ?? null,
    maximumPeriodDays: Number.isInteger(constraints.maximumPeriodDays) ? constraints.maximumPeriodDays : null,
    requiresPeriodAdjustment: Boolean(constraints.requiresPeriodAdjustment),
  };
}

function mapChartRange(chartRange) {
  if (!chartRange?.startDate || !chartRange?.endDate) return null;
  return {
    startDate: chartRange.startDate,
    endDate: chartRange.endDate,
  };
}

function mapAction(action, candidate, chartRange, index) {
  return {
    actionOrder: index + 1,
    actionType: action.actionType,
    sourceLocation: action.sourceLocation ?? null,
    targetLocation: action.targetLocation ?? null,
    physicalSourceLocation: action.physicalSourceLocation ?? null,
    physicalDestinationLocation: action.physicalDestinationLocation ?? null,
    allocationSourceSalesPoint: action.allocationSourceSalesPoint ?? null,
    allocationTargetSalesPoint: action.allocationTargetSalesPoint ?? null,
    actionQuantity: action.actionQuantity,
    estimatedActionCost: action.estimatedActionCost,
    movementCost: action.movementCost ?? null,
    strategyPrice: action.strategyPrice,
    discountRate: action.discountRate,
    startDate: candidate.startDate ?? chartRange?.startDate ?? null,
    endDate: candidate.endDate ?? chartRange?.endDate ?? null,
    lotAllocations: (action.lotAllocations ?? []).map((allocation) => ({
      ...allocation,
      allocatedQuantity: allocation.quantity,
    })),
  };
}

function replaceLocationCodesWithNames(value, actions) {
  if (typeof value !== 'string' || !value) return value;

  const replacements = [
    ...new Map(
      actions
        .flatMap((action) => [
          action.sourceLocation,
          action.targetLocation,
          action.physicalSourceLocation,
          action.physicalDestinationLocation,
          action.allocationSourceSalesPoint,
          action.allocationTargetSalesPoint,
        ])
        .filter(Boolean)
        .flatMap((location) => {
          const idAlias =
            location.locationId == null
              ? null
              : `${location.locationType === 'WAREHOUSE' ? 'W' : 'S'}${location.locationId}`;
          return [
            [location.locationCode, location.locationName],
            [idAlias, location.locationName],
          ];
        }),
    ).entries(),
  ]
    .filter(([code, name]) => code && name && code !== name)
    .sort(([left], [right]) => right.length - left.length);

  return replacements.reduce((text, [code, name]) => {
    const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const codeToken = new RegExp(`(^|[^A-Za-z0-9_])${escapedCode}(?=$|[^A-Za-z0-9_])`, 'g');
    return text.replace(codeToken, (_, prefix) => `${prefix}${name}`);
  }, value);
}

function mapOption(option) {
  const candidate = option?.candidate;
  const mappedSimulation = mapSimulation(option?.simulation);
  if (!candidate?.candidateId || !Array.isArray(candidate.actions) || !mappedSimulation) return null;

  const assumptions = candidate.assumptions ?? [];
  const chartRange = mapChartRange(option.chartRange);
  const actions = candidate.actions.map((action, index) => mapAction(action, candidate, chartRange, index));
  const displayText = (value) => replaceLocationCodesWithNames(value, actions);
  return {
    optionId: candidate.candidateId,
    optionKey: candidate.candidateId,
    rank: option.rank,
    optionName: displayText(option.optionName),
    recommendationReason: displayText(option.recommendationReason),
    advantage: displayText(option.advantage),
    caution: displayText(option.caution),
    constraints:
      assumptions.length > 0
        ? assumptions.map((assumption) => assumptionLabels[assumption] ?? assumption).join(' ')
        : null,
    strategyTypes: candidate.strategyTypes ?? [],
    startDate: candidate.startDate ?? chartRange?.startDate ?? null,
    endDate: candidate.endDate ?? chartRange?.endDate ?? null,
    maxExecutableQty: candidate.maxExecutableQty,
    preference: candidate.preference ?? null,
    assumptions,
    actions,
    adjustmentConstraints: mapAdjustmentConstraints(option.adjustmentConstraints),
    chartRange,
    ...mappedSimulation,
  };
}

function mapRequestConditions(conditions = {}) {
  conditions ??= {};
  const lots = conditions.lots ?? [];
  const candidateSalesPoints = conditions.candidateSalesPoints ?? [];
  return {
    sourceSalesPointId: conditions.sourceSalesPoint?.salesPointId ?? null,
    sourceSalesPointName: conditions.sourceSalesPoint?.salesPointName ?? null,
    lotIds: lots.map((lot) => lot.lotId),
    lotLabels: lots.map((lot) => lot.lotCode || `LOT ${lot.lotId}`),
    candidateSalesPointIds: candidateSalesPoints.map((point) => point.salesPointId),
    candidateSalesPointNames: candidateSalesPoints.map(
      (point) => point.salesPointName || `판매처 ${point.salesPointId}`,
    ),
    candidateSalesPoints,
    strategyTypes: conditions.strategyTypes ?? [],
    preferredStartDate: conditions.preferredStartDate,
    preferredEndDate: conditions.preferredEndDate,
    forecastStartDate: conditions.forecastStartDate,
    forecastEndDate: conditions.forecastEndDate,
  };
}

export function mapAiStrategyDetailResponse(response) {
  const data = requireDetailData(response);
  const options = (data.result?.options ?? []).map(mapOption).filter(Boolean);

  return {
    strategyCaseId: data.strategyCaseId,
    caseCode: `#${data.strategyCaseId}`,
    caseName: data.caseName || '이름 없는 AI 전략',
    caseStatus: data.caseStatus,
    selectedOptionId: data.selectedOptionId ?? null,
    generationStage: data.generationStage,
    sku: data.sku ?? {
      skuId: null,
      skuCode: '-',
      skuName: '상품 정보 없음',
      imageUrl: null,
      category: null,
    },
    requestedBy: data.requester ?? null,
    requestedAt: data.createdAt,
    completedAt: data.completedAt,
    resultExpiresAt: data.resultExpiresAt,
    requestConditions: mapRequestConditions(data.requestConditions),
    generatedAt: data.result?.generatedAt ?? null,
    baselineSimulation: data.result?.baselineSimulation ?? null,
    options,
    noRecommendation: data.result?.noRecommendation ?? null,
    failure:
      data.failureCode || data.failureMessage
        ? {
            code: data.failureCode,
            summary: data.failureMessage,
            failedAt: data.completedAt,
          }
        : null,
  };
}

export function applyAdjustedSimulationResult(option, response) {
  const data = response?.data ?? response;
  const mappedSimulation = mapSimulation(data?.simulation);
  if (!option || data?.candidateId !== option.optionKey || !data.adjustedConditions || !mappedSimulation) {
    throw new Error('AI 전략 조정 시뮬레이션 응답 형식이 올바르지 않습니다.');
  }

  const conditions = data.adjustedConditions;
  const adjustedActions = new Map((data.actions ?? []).map((action) => [action.actionOrder, action]));
  const actions = option.actions.map((action) => {
    const adjustedAction = adjustedActions.get(action.actionOrder);
    return {
      ...action,
      actionQuantity: adjustedAction?.actionQuantity ?? conditions.actionQuantity,
      estimatedActionCost: adjustedAction?.estimatedActionCost ?? action.estimatedActionCost,
      movementCost: adjustedAction?.movementCost
        ? {
            ...action.movementCost,
            ...adjustedAction.movementCost,
          }
        : action.movementCost,
      discountRate: action.actionType === 'PRICE_DISCOUNT' ? conditions.discountRate : action.discountRate,
      strategyPrice: action.actionType === 'PRICE_DISCOUNT' ? conditions.strategyPrice : action.strategyPrice,
      startDate: conditions.startDate,
      endDate: conditions.endDate,
    };
  });

  return {
    ...option,
    startDate: conditions.startDate,
    endDate: conditions.endDate,
    maxExecutableQty: conditions.maximumExecutableQuantity,
    adjustmentPolicy: {
      salesPointGroup: conditions.salesPointGroup,
      maximumDiscountRate: conditions.maximumDiscountRate,
    },
    adjustmentConstraints: mapAdjustmentConstraints(data.adjustmentConstraints) ?? option.adjustmentConstraints,
    chartRange: mapChartRange(data.chartRange) ?? option.chartRange,
    actions,
    ...mappedSimulation,
  };
}
