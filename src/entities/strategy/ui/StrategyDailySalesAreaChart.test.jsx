import { describe, expect, it } from 'vitest';
import { buildDailySalesChartData, buildDailySalesComparisonData } from './StrategyDailySalesAreaChart.jsx';

describe('buildDailySalesChartData', () => {
  it('aggregates sales points and excludes records after the 90-day strategy window', () => {
    const records = [
      { date: '2026-01-01', salesPoint: 'A', quantity: 3 },
      { date: '2026-01-01', salesPoint: 'B', quantity: 4 },
      { date: '2026-03-31', salesPoint: 'A', quantity: 5 },
      { date: '2026-04-01', salesPoint: 'A', quantity: 99 },
    ];

    expect(buildDailySalesChartData(records, '2026-01-01')).toEqual([
      { date: '2026-01-01', quantity: 7 },
      { date: '2026-03-31', quantity: 5 },
    ]);
    expect(buildDailySalesChartData(records, '2026-01-01', 'A')[0]).toEqual({
      date: '2026-01-01',
      quantity: 3,
    });
  });
  it('keeps destination and source sales point series separate for comparison', () => {
    const records = [
      { date: '2026-01-01', salesPoint: '이동처', quantity: 7 },
      { date: '2026-01-01', salesPoint: '기존처', quantity: 4 },
    ];
    const series = [
      { key: 'destination', salesPoint: '이동처' },
      { key: 'source', salesPoint: '기존처' },
    ];

    expect(buildDailySalesComparisonData(records, '2026-01-01', series)).toEqual([
      { date: '2026-01-01', destination: 7, source: 4 },
    ]);
  });
});
