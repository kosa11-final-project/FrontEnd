import { describe, expect, it } from 'vitest';
import { getHeatmapMarkerSize } from './dashboardLayout.js';
import { mapDashboardResponse } from './dashboardMapper.js';

const response = {
  summary: {
    totalAvailableStock: 4062,
    criticalSkuCount: 5,
    warningSkuCount: 7,
    riskAndWarningSkuCount: 12,
    shortageSkuCount: 9,
    expectedDisposalQty: 519,
  },
  warehouses: [
    {
      warehouseId: 1,
      warehouseCode: 'SEONGNAM',
      warehouseName: '성남 스마트푸드센터',
      regionCode: 'GYEONGGI',
      address: '경기도 성남시',
      currentStock: 956,
      availableStock: 872,
      nearExpiryStock: 68,
      outboundStock: 84,
      riskSkuCount: 5,
    },
  ],
  offlineStores: [
    {
      salesPointId: 13,
      salesPointCode: 'DEPT_PANGYO',
      salesPointName: '판교점',
      regionCode: 'GYEONGGI',
      address: '경기도 성남시',
      currentStock: 526,
      availableStock: 472,
      nearExpiryStock: 45,
      expectedDisposalQty: 38,
      riskSkuCount: 3,
    },
  ],
  riskSalesPointsTop10: [
    {
      rank: 1,
      salesPointId: 1,
      salesPointCode: 'GREETING',
      salesPointName: '그리팅몰',
      channelType: 'ONLINE',
      regionCode: 'ONLINE',
      availableStock: 833,
      riskSkuCount: 5,
      expectedDisposalQty: 118,
      nearExpiryStock: 74,
    },
  ],
  urgentSkusTop5: [
    {
      rank: 1,
      skuId: 7,
      skuCode: 'GF-SAL-GRN-05',
      skuName: '그린믹스 · 5팩',
      stockLocationType: 'WAREHOUSE',
      stockLocationId: 1,
      stockLocationName: '성남 스마트푸드센터',
      allocatedSalesPointName: '그리팅몰',
      expiryDaysLeft: 12,
      saleStopDaysLeft: 5,
      expectedDisposalQty: 86,
      reasonMessage: '소비기한 내 판매 소진이 어렵습니다.',
    },
  ],
  calculatedAt: '2026-08-15T01:05:00Z',
};

describe('dashboard response mapper', () => {
  it('maps the backend snapshot contract to the dashboard UI model', () => {
    const dashboard = mapDashboardResponse(response);

    expect(dashboard.summary).toMatchObject({
      criticalSkuCount: 5,
      warningSkuCount: 7,
      riskAndCautionSkuCount: 12,
      expectedDisposal: 519,
    });
    expect(dashboard.warehouses[0]).toMatchObject({ id: 'SEONGNAM', shortName: '성남', x: 49, y: 20 });
    expect(dashboard.offlineStores[0]).toMatchObject({
      id: 'DEPT_PANGYO',
      shortName: '판교',
      expectedDisposal: 38,
    });
    expect(dashboard.riskSalesPointsTop10[0]).toMatchObject({ rank: 1, type: '온라인' });
    expect(dashboard.urgentSkusTop5[0]).toMatchObject({
      rank: 1,
      skuId: '7',
      stockLocation: '성남 스마트푸드센터',
      saleStopDays: 5,
    });
    expect(dashboard.calculatedAt).toBe(response.calculatedAt);
  });

  it('returns safe empty collections when optional list fields are absent', () => {
    const dashboard = mapDashboardResponse({ summary: {} });

    expect(dashboard.warehouses).toEqual([]);
    expect(dashboard.offlineStores).toEqual([]);
    expect(dashboard.riskSalesPointsTop10).toEqual([]);
    expect(dashboard.urgentSkusTop5).toEqual([]);
  });
});

describe('heatmap marker size', () => {
  it('uses square-root normalization within each location group', () => {
    expect(getHeatmapMarkerSize(100, 100, 900, 'centers')).toBe(58);
    expect(getHeatmapMarkerSize(300, 100, 900, 'centers')).toBe(76);
    expect(getHeatmapMarkerSize(900, 100, 900, 'centers')).toBe(94);
  });

  it('uses a stable middle size when all locations have the same stock', () => {
    expect(getHeatmapMarkerSize(300, 300, 300, 'stores')).toBe(55);
  });
});
