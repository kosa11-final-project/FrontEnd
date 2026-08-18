/**
 * 수요예측 로컬 개발 및 테스트용 결정적 Mock DTO
 */
export function getMockDemandForecastDto(skuCode = 'SKU_MANDU_001_105', salesPointCode = 'GREETING_ONLINE') {
  return {
    status: 'AVAILABLE',
    scope: 'SALES_POINT',
    skuCode,
    skuName: '1.05kg 단품팩',
    salesPointCode,
    salesPointName: salesPointCode === 'GREETING_ONLINE' ? '그리팅 공식몰' : salesPointCode,
    baseDate: '2026-08-16',
    modelVersion: 'v1.2.0',
    forecastSource: 'AUTO_ML',
    confidence: 0.95,
    confidenceLevel: 'HIGH',
    availableQty: 900,
    safetyStockQty: 200,
    cumulativeForecast: {
      predictedQtyD7: 280,
      predictedQtyD14: 560,
      predictedQtyD30: 1200,
      predictedQtyD60: 2400,
      predictedQtyD90: 3600,
    },
    projectedInventories: {
      projectedD7: 620,
      projectedD14: 340,
      projectedD30: 0,
      projectedD60: 0,
      projectedD90: 0,
      stockoutPeriod: 'D+15~D+30',
    },
    freshness: {
      lastUpdatedAt: '2026-08-16T10:00:00Z',
      isStale: false,
      dataQualityState: 'AVAILABLE',
      message: '수요예측과 안전재고 기준이 정상적으로 조회되었습니다.',
      forecastAsOf: '2026-08-16',
    },
  };
}
