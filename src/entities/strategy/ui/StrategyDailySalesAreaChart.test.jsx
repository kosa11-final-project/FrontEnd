import { describe, expect, it } from 'vitest';
import {
  buildDailySalesChartData,
  buildDailySalesComparisonData,
  getDelayedSeriesStartMarkers,
} from './StrategyDailySalesAreaChart.jsx';

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

  it('marks only sales point series that begin after the chart start date', () => {
    const chartData = [
      { date: '2026-08-14', destination: 9 },
      { date: '2026-08-15', destination: 17, source: 12 },
      { date: '2026-08-16', destination: 16, source: 12 },
    ];
    const destination = { key: 'destination', label: '대상 판매처', name: '그리팅', color: '#27B06E' };
    const source = { key: 'source', label: '출발 판매처', name: '신촌점', color: '#EAB308' };

    expect(getDelayedSeriesStartMarkers(chartData, [destination, source])).toEqual([
      { date: '2026-08-15', series: [source] },
    ]);
  });
});
