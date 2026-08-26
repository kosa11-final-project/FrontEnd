import { describe, expect, it } from 'vitest';
import { getSafetyStockCrossing } from './forecastTimeline.js';

const chartPoints = [
  { label: '08-16 (기준일)', offsetDays: 0, projectedQty: 48 },
  { label: 'D+7', offsetDays: 7, projectedQty: 32 },
  { label: 'D+14', offsetDays: 14, projectedQty: 18 },
  { label: 'D+30', offsetDays: 30, projectedQty: 0 },
  { label: 'D+60', offsetDays: 60, projectedQty: 0 },
];

describe('forecastTimeline', () => {
  it('interpolates the first safety-stock crossing and rounds the action day up', () => {
    const result = getSafetyStockCrossing({
      chartPoints,
      safetyStockQty: 10,
      baseDate: '2026-08-24',
    });

    expect(result).toMatchObject({
      status: 'CROSSING',
      daysAfterBase: 22,
      expectedLabel: 'D+22',
      expectedDate: '2026-09-15',
      safetyStockQty: 10,
    });
    expect(result.exactDaysAfterBase).toBeCloseTo(21.111, 2);
    expect(result.recommendation).toMatchObject({
      variant: 'warning',
      title: '안전재고 도달 예정',
    });
    expect(result.recommendation.message).toContain('발주·이관·입고요청');
  });

  it('marks an already-under-baseline inventory as requiring immediate action', () => {
    const result = getSafetyStockCrossing({
      chartPoints: [{ label: '기준일', offsetDays: 0, projectedQty: 8 }],
      safetyStockQty: 10,
      baseDate: '2026-08-24',
    });

    expect(result).toMatchObject({
      status: 'BELOW',
      daysAfterBase: 0,
      expectedLabel: '현재',
      expectedDate: '2026-08-24',
    });
    expect(result.recommendation).toMatchObject({
      variant: 'danger',
      title: '안전재고 미달',
    });
    expect(result.recommendation.message).toContain('필요합니다');
  });

  it('returns null when safety stock is unavailable or never crossed', () => {
    expect(
      getSafetyStockCrossing({
        chartPoints,
        safetyStockQty: null,
        baseDate: '2026-08-24',
      }),
    ).toBeNull();

    expect(
      getSafetyStockCrossing({
        chartPoints: chartPoints.map((point) => ({ ...point, projectedQty: 30 })),
        safetyStockQty: 10,
        baseDate: '2026-08-24',
      }),
    ).toBeNull();
  });

  it('skips missing projected points instead of creating a false crossing', () => {
    expect(
      getSafetyStockCrossing({
        chartPoints: [
          { label: '기준일', offsetDays: 0, projectedQty: null },
          { label: 'D+7', offsetDays: 7, projectedQty: 5 },
        ],
        safetyStockQty: 10,
        baseDate: '2026-08-24',
      }),
    ).toBeNull();
  });
});
