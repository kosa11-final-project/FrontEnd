import { describe, expect, it } from 'vitest';
import { offlineStoreInventories, rankRiskSalesPoints, rankUrgentSkus } from './dashboard.js';

describe('dashboard inventory ranking', () => {
  it('위험 판매처를 위험 SKU 수, 예상 폐기수량 순으로 정렬한다', () => {
    const points = [
      { name: 'A', riskSkuCount: 2, expectedDisposal: 30 },
      { name: 'B', riskSkuCount: 3, expectedDisposal: 10 },
      { name: 'C', riskSkuCount: 2, expectedDisposal: 50 },
    ];

    expect(rankRiskSalesPoints(points).map((point) => point.name)).toEqual(['B', 'C', 'A']);
  });

  it('긴급 SKU를 위험점수, 예상 폐기수량 순으로 정렬한다', () => {
    const skus = [
      { name: 'A', riskScore: 90, expectedDisposal: 20 },
      { name: 'B', riskScore: 95, expectedDisposal: 10 },
      { name: 'C', riskScore: 90, expectedDisposal: 40 },
    ];

    expect(rankUrgentSkus(skus).map((sku) => sku.name)).toEqual(['B', 'C', 'A']);
  });

  it('활성 오프라인 매장만 대시보드 재고 대상으로 사용한다', () => {
    expect(offlineStoreInventories).toHaveLength(15);
    expect(offlineStoreInventories.every((point) => point.type === '오프라인' && point.active)).toBe(true);
    expect(offlineStoreInventories.map((point) => point.id)).not.toEqual(
      expect.arrayContaining(['GREETING', 'MODU_MATJIP', 'DEPT_DCUBE']),
    );
  });
});
