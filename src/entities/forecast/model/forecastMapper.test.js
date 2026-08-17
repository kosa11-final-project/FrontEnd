import { describe, expect, it } from 'vitest';
import { mapDemandForecastResponse } from './forecastMapper.js';

describe('forecastMapper', () => {
  it('정상적인 DTO 응답을 프론트엔드 뷰 모델로 매핑한다', () => {
    const rawDto = {
      status: 'AVAILABLE',
      scope: 'SALES_POINT',
      skuCode: 'SKU-001',
      skuName: '테스트 상품',
      salesPointCode: 'GREETING',
      salesPointName: '그리팅몰',
      baseDate: '2026-08-16',
      modelVersion: 'v1.0.0',
      forecastSource: 'AZURE_ML',
      confidence: 0.95,
      confidenceLevel: 'HIGH',
      availableQty: 110,
      safetyStockQty: 30,
      cumulativeForecast: {
        predictedQtyD7: 50,
        predictedQtyD14: 100,
        predictedQtyD30: 200,
        predictedQtyD60: 400,
        predictedQtyD90: 600,
      },
      projectedInventories: {
        projectedD7: 60,
        projectedD14: 10,
        projectedD30: 0,
        projectedD60: 0,
        projectedD90: 0,
        stockoutPeriod: 'D+15~D+30',
      },
      freshness: {
        lastUpdatedAt: '2026-08-16T09:00:00Z',
        isStale: false,
        dataQualityState: 'AVAILABLE',
        message: '정상 데이터',
      },
    };

    const result = mapDemandForecastResponse({ data: rawDto });

    expect(result).not.toBeNull();
    expect(result.status).toBe('AVAILABLE');
    expect(result.skuCode).toBe('SKU-001');
    expect(result.availableQty).toBe(110);
    expect(result.safetyStockQty).toBe(30);
    expect(result.confidenceLevel).toBe('HIGH');
    expect(result.cumulativeForecast.predictedQtyD7).toBe(50);
    expect(result.projectedInventories.stockoutPeriod).toBe('D+15~D+30');
    expect(result.actualSales).toBeUndefined();
    expect(result.periodAverages).toBeUndefined();
    expect(result.lotMarkers).toBeUndefined();
    expect(result.chartPoints[0]).toMatchObject({ forecastQty: 0, projectedQty: 110 });
    expect(result.chartPoints.length).toBeGreaterThan(0);
  });

  it('null이나 빈 객체 전달 시 null을 반환하거나 안전한 기본값을 제공한다', () => {
    expect(mapDemandForecastResponse(null)).toBeNull();
    const result = mapDemandForecastResponse({});
    expect(result).not.toBeNull();
    expect(result.modelVersion).toBeNull();
    expect(result.forecastSource).toBeNull();
    expect(result.projectedInventories.stockoutPeriod).toBeNull();
  });
});
