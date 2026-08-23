import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildChannelPerformanceReport,
  parseChannelRevenue,
  StrategyChannelPerformanceReport,
} from './StrategyChannelPerformanceReport.jsx';

const channel = (name, sales, revenue, overrides = {}) => ({
  channel: name,
  sales,
  revenue,
  status: 'COMPLETED',
  cannibalization: '해당 없음',
  ...overrides,
});

describe('StrategyChannelPerformanceReport', () => {
  it('normalizes Korean revenue strings and builds report totals', () => {
    expect(parseChannelRevenue('1,384만원')).toBe(13_840_000);
    expect(parseChannelRevenue('598,500원')).toBe(598_500);
    expect(parseChannelRevenue(null)).toBeNull();

    expect(buildChannelPerformanceReport([channel('A', 63, '598,500원')])).toMatchObject({
      summary: { totalSales: 63, totalRevenue: 598_500, channelCount: 1, completedChannels: 1 },
      visualization: 'single',
    });
  });

  it('uses a treemap for two or three channels and falls back to it for incomplete scatter data', () => {
    expect(buildChannelPerformanceReport([channel('A', 63, 598_500), channel('B', 41, 382_000)]).visualization).toBe(
      'treemap',
    );
    expect(
      buildChannelPerformanceReport([
        channel('A', 63, 598_500),
        channel('B', 41, 382_000),
        channel('C', 25, 220_000),
        channel('D', null, null),
      ]).visualization,
    ).toBe('treemap');
  });

  it('uses a scatter report for four or more comparable channels', () => {
    const report = buildChannelPerformanceReport([
      channel('A', 63, 598_500),
      channel('B', 41, 382_000),
      channel('C', 25, 220_000),
      channel('D', 52, 470_000),
    ]);
    expect(report.visualization).toBe('scatter');
    expect(report.averages.sales).toBe(45.25);
    expect(report.averages.revenue).toBe(417_625);
  });

  it('renders the shared summary and a single-channel report', () => {
    render(<StrategyChannelPerformanceReport results={[channel('모두의 맛집', 63, 598_500)]} />);

    expect(screen.getByLabelText('채널 판매 성과 요약')).toHaveTextContent('총 판매량63개');
    expect(screen.getByRole('article', { name: '모두의 맛집 채널 판매 성과' })).toHaveTextContent('598,500원');
    expect(screen.getByText('완료')).toBeInTheDocument();
    expect(screen.queryByText('COMPLETED')).not.toBeInTheDocument();
  });

  it('표시할 채널명이 없는 현대백화점 지점에 소속 채널명을 붙인다', () => {
    render(<StrategyChannelPerformanceReport results={[channel('울산점', 76, 373_160)]} />);

    expect(screen.getByText('현대백화점 · 울산점')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: '현대백화점 · 울산점 채널 판매 성과' })).toBeInTheDocument();
  });

  it('renders the selected chart with an accessible name', () => {
    const treemapResults = [channel('A', 63, 598_500), channel('B', 41, 382_000)];
    const scatterResults = [...treemapResults, channel('C', 25, 220_000), channel('D', 52, 470_000)];
    const { rerender } = render(<StrategyChannelPerformanceReport results={treemapResults} />);
    expect(screen.getByRole('img', { name: '채널별 매출 비중 트리맵' })).toHaveTextContent('매출 비중 61.0%');
    expect(screen.getByText('채널 매출 구성')).toBeInTheDocument();

    rerender(<StrategyChannelPerformanceReport results={scatterResults} />);
    expect(screen.getByRole('img', { name: '채널 판매량과 매출 성과 사분면 차트' })).toBeInTheDocument();
  });
});
