import { describe, expect, it } from 'vitest';
import { getRiskSalesPointInventoryUrl, getUrgentSkuInventoryUrl } from './dashboardLinks.js';
import { getHeatmapMarkerSize } from './dashboardLayout.js';
import { mapDashboardResponse } from './dashboardMapper.js';
import { mockDashboardResponse } from '../testing/dashboardFixtures.js';

const response = mockDashboardResponse;

describe('dashboard response mapper', () => {
  it('maps the backend snapshot contract to the dashboard UI model', () => {
    const dashboard = mapDashboardResponse(response);

    expect(dashboard.summary).toMatchObject({
      totalCurrentStock: 4800,
      totalAvailableStock: 4062,
      criticalSkuCount: 5,
      warningSkuCount: 7,
      riskAndCautionSkuCount: 12,
      expectedDisposal: 519,
    });
    expect(dashboard.warehouses[0]).toMatchObject({ id: 'SEONGNAM', shortName: '성남', x: 49, y: 20 });
    expect(dashboard.onlineSalesPoints[0]).toMatchObject({
      id: 'GREETING',
      shortName: '그리팅몰',
      storageWarehouseCount: 2,
      expectedDisposal: 118,
    });
    expect(dashboard.offlineStores[0]).toMatchObject({
      id: 'DEPT_PANGYO',
      shortName: '판교',
      expectedDisposal: 38,
    });
    expect(dashboard.riskSalesPointsTop10[0]).toMatchObject({ rank: 1, type: '온라인' });
    expect(dashboard.urgentSkusTop5[0]).toMatchObject({
      rank: 1,
      skuId: '7',
      stockLocationCode: 'SEONGNAM',
      stockLocation: '성남 스마트푸드센터',
      allocatedSalesPointCode: 'GREETING',
      saleStopDays: 5,
    });
    expect(dashboard.urgentSkusBySalesPoint[10][0]).toMatchObject({
      rank: 1,
      allocatedSalesPointCode: 'GREETING',
      skuId: '7',
    });
    expect(dashboard.calculatedAt).toBe(response.calculatedAt);
  });

  it('returns safe empty collections when optional list fields are absent', () => {
    const dashboard = mapDashboardResponse({ summary: {} });

    expect(dashboard.warehouses).toEqual([]);
    expect(dashboard.onlineSalesPoints).toEqual([]);
    expect(dashboard.offlineStores).toEqual([]);
    expect(dashboard.riskSalesPointsTop10).toEqual([]);
    expect(dashboard.urgentSkusTop5).toEqual([]);
    expect(dashboard.urgentSkusBySalesPoint).toEqual({});
  });

  it('uses available stock as the current-stock fallback for an older snapshot', () => {
    const dashboard = mapDashboardResponse({ summary: { totalAvailableStock: 120 } });

    expect(dashboard.summary.totalCurrentStock).toBe(120);
  });
});

describe('dashboard inventory links', () => {
  it('opens a risk sales point with the inventory sales-point filter', () => {
    expect(getRiskSalesPointInventoryUrl({ code: 'DEPT_PANGYO' })).toBe('/inventory?salesPointCode=DEPT_PANGYO');
  });

  it('opens an urgent SKU detail for its allocated sales point', () => {
    expect(
      getUrgentSkuInventoryUrl({
        code: 'GF-SAL-GRN-05',
        stockLocationType: 'WAREHOUSE',
        stockLocationCode: 'SEONGNAM',
        allocatedSalesPointCode: 'GREETING',
      }),
    ).toBe('/inventory?detailSkuCode=GF-SAL-GRN-05&detailSalesPointCode=GREETING');
  });

  it('uses the stock location for sales-point inventory and falls back to SKU search without a sales point', () => {
    expect(
      getUrgentSkuInventoryUrl({
        code: 'GF-SAL-GRN-05',
        stockLocationType: 'SALES_POINT',
        stockLocationCode: 'DEPT_PANGYO',
      }),
    ).toBe('/inventory?detailSkuCode=GF-SAL-GRN-05&detailSalesPointCode=DEPT_PANGYO');

    expect(getUrgentSkuInventoryUrl({ code: 'GF-SAL-GRN-05', stockLocationType: 'WAREHOUSE' })).toBe(
      '/inventory?q=GF-SAL-GRN-05',
    );
  });
});

describe('heatmap marker size', () => {
  it('uses square-root normalization within each location group', () => {
    expect(getHeatmapMarkerSize(100, 100, 900, 'centers')).toBe(58);
    expect(getHeatmapMarkerSize(300, 100, 900, 'centers')).toBe(76);
    expect(getHeatmapMarkerSize(900, 100, 900, 'centers')).toBe(94);
  });

  it('uses a stable middle size when all locations have the same stock', () => {
    expect(getHeatmapMarkerSize(300, 300, 300, 'stores')).toBe(56);
  });
});
