import { FORECAST_STATUS } from './forecast.js';
import { getSafetyStockCrossing } from './forecastTimeline.js';

function unwrapApiResponse(response = {}) {
  return response && typeof response === 'object' && response.data !== undefined ? response.data : response;
}

function nullableNumber(...values) {
  const value = values.find((candidate) => candidate !== undefined && candidate !== null && candidate !== '');
  if (value === undefined || value === null || value === '') return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * 수요예측 API를 미래 수요·예상 잔고·안전재고 기준만 사용하는 뷰 모델로 정규화합니다.
 * 실제 판매 시계열과 LOT 일정은 각각 ML 입력·재고 상세 영역의 책임이므로 이 모델에 포함하지 않습니다.
 */
export function mapDemandForecastResponse(response) {
  const dto = unwrapApiResponse(response);
  if (!dto || typeof dto !== 'object') return null;

  const status = dto.status || FORECAST_STATUS.NO_DATA;
  const scope = dto.scope || 'SALES_POINT';
  const skuCode = dto.skuCode || dto.sku_code || '';
  const skuName = dto.skuName || dto.sku_name || '';
  const salesPointCode = dto.salesPointCode || dto.sales_point_code || '';
  const salesPointName = dto.salesPointName || dto.sales_point_name || salesPointCode || '판매처 미지정';
  const baseDate = dto.baseDate || dto.base_date || null;
  const modelVersion = dto.modelVersion || dto.model_version || null;
  const forecastSource = dto.forecastSource || dto.forecast_source || null;
  const confidence = nullableNumber(dto.confidence);
  const confidenceLevel = dto.confidenceLevel || dto.confidence_level || null;
  const availableQty = nullableNumber(dto.availableQty, dto.available_qty);
  const safetyStockQty = nullableNumber(dto.safetyStockQty, dto.safety_stock_qty);

  const rawCum = dto.cumulativeForecast || dto.cumulative_forecast || {};
  const cumulativeForecast = {
    predictedQtyD7: nullableNumber(rawCum.predictedQtyD7, rawCum.predicted_qty_d7, dto.predictedQtyD7),
    predictedQtyD14: nullableNumber(rawCum.predictedQtyD14, rawCum.predicted_qty_d14, dto.predictedQtyD14),
    predictedQtyD30: nullableNumber(rawCum.predictedQtyD30, rawCum.predicted_qty_d30, dto.predictedQtyD30),
    predictedQtyD60: nullableNumber(rawCum.predictedQtyD60, rawCum.predicted_qty_d60, dto.predictedQtyD60),
    predictedQtyD90: nullableNumber(rawCum.predictedQtyD90, rawCum.predicted_qty_d90, dto.predictedQtyD90),
  };

  const rawProj = dto.projectedInventories || dto.projected_inventories || {};
  const projectedInventories = {
    projectedD7: nullableNumber(rawProj.projectedD7, rawProj.projected_d7),
    projectedD14: nullableNumber(rawProj.projectedD14, rawProj.projected_d14),
    projectedD30: nullableNumber(rawProj.projectedD30, rawProj.projected_d30),
    projectedD60: nullableNumber(rawProj.projectedD60, rawProj.projected_d60),
    projectedD90: nullableNumber(rawProj.projectedD90, rawProj.projected_d90),
    stockoutPeriod: rawProj.stockoutPeriod || rawProj.stockout_period || null,
  };

  const rawFreshness = dto.freshness || {};
  const freshness = {
    lastUpdatedAt: rawFreshness.lastUpdatedAt || rawFreshness.last_updated_at || null,
    isStale: Boolean(rawFreshness.isStale ?? rawFreshness.is_stale),
    dataQualityState: rawFreshness.dataQualityState || rawFreshness.data_quality_state || status,
    message: rawFreshness.message || '',
    forecastAsOf: rawFreshness.forecastAsOf || rawFreshness.forecast_as_of || baseDate,
  };

  const chartPoints = buildChartTimelinePoints({
    cumulativeForecast,
    projectedInventories,
    availableQty,
    safetyStockQty,
    baseDate,
  });

  return {
    status,
    scope,
    skuCode,
    skuName,
    salesPointCode,
    salesPointName,
    baseDate,
    modelVersion,
    forecastSource,
    confidence,
    confidenceLevel,
    availableQty,
    safetyStockQty,
    cumulativeForecast,
    projectedInventories,
    freshness,
    chartPoints,
    safetyStockCrossing: getSafetyStockCrossing({ chartPoints, safetyStockQty, baseDate }),
  };
}

function buildChartTimelinePoints({
  cumulativeForecast = {},
  projectedInventories = {},
  availableQty = null,
  safetyStockQty = null,
  baseDate,
}) {
  const points = [
    {
      date: baseDate || 'BASE',
      label: baseDate ? `${baseDate.slice(5)} (기준일)` : '기준일',
      type: 'CURRENT',
      offsetDays: 0,
      forecastQty: 0,
      projectedQty: availableQty,
      safetyStockQty,
    },
  ];

  [
    { key: 'D+7', cum: cumulativeForecast.predictedQtyD7, proj: projectedInventories.projectedD7 },
    { key: 'D+14', cum: cumulativeForecast.predictedQtyD14, proj: projectedInventories.projectedD14 },
    { key: 'D+30', cum: cumulativeForecast.predictedQtyD30, proj: projectedInventories.projectedD30 },
    { key: 'D+60', cum: cumulativeForecast.predictedQtyD60, proj: projectedInventories.projectedD60 },
    { key: 'D+90', cum: cumulativeForecast.predictedQtyD90, proj: projectedInventories.projectedD90 },
  ].forEach(({ key, cum, proj }) => {
    points.push({
      date: key,
      label: key,
      type: 'FORECAST',
      offsetDays: Number(key.slice(2)),
      forecastQty: cum,
      projectedQty: proj,
      safetyStockQty,
    });
  });

  return points;
}
