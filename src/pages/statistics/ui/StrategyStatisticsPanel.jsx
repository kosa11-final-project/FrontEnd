import { useId, useState } from 'react';
import { Activity, ChartBar, CheckCircle, Danger, InfoCircle, Package } from 'reicon-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, formatDate, formatNumber, formatPercent, formatQuantity } from '@/shared/lib/format';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Icon,
  MetricCard,
  Tooltip as UiTooltip,
  TooltipContent as UiTooltipContent,
  TooltipProvider as UiTooltipProvider,
  TooltipTrigger as UiTooltipTrigger,
} from '@/shared/ui';

function MetricLabel({ label, calculation }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <UiTooltipProvider>
        <UiTooltip>
          <UiTooltipTrigger asChild>
            <button
              type="button"
              aria-label={`${label} 계산 기준`}
              className="grid size-5 place-items-center rounded-full text-[color:var(--text-muted)] outline-none transition-colors hover:bg-[var(--surface-subtle)] hover:text-[color:var(--text-heading)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <Icon icon={InfoCircle} size={13} aria-hidden="true" />
            </button>
          </UiTooltipTrigger>
          <UiTooltipContent tone="light" side="top" className="max-w-[300px] leading-relaxed">
            {calculation}
          </UiTooltipContent>
        </UiTooltip>
      </UiTooltipProvider>
    </span>
  );
}

function StrategySummary({ current, isPreview = false }) {
  const metrics = [
    {
      id: 'completed-strategy',
      label: (
        <MetricLabel
          label="완료 전략"
          calculation="조회 기간 안에 실행이 종료된 전략 수입니다. 진행 중·실패·취소 전략은 제외합니다."
        />
      ),
      value: formatQuantity(current.completedCount, { unit: '건' }),
      helper: '선택한 기간에 실행이 끝난 전략',
      icon: CheckCircle,
      tone: 'info',
    },
    {
      id: 'risk-stock-reduction',
      label: (
        <MetricLabel
          label="위험재고 감소"
          calculation="각 종료 전략의 시작 시점 위험재고에서 종료 시점 위험재고를 뺀 순감소량을 합산합니다."
        />
      ),
      value: formatQuantity(current.riskStockReductionQty),
      helper: `전략 시작 시점 위험재고의 ${formatPercent(current.riskStockReductionRate)} 감소`,
      icon: Package,
      tone: 'good',
    },
    {
      id: 'average-achievement-rate',
      label: (
        <MetricLabel
          label="평균 목표 달성률"
          calculation="종료 전략마다 실제 성과를 목표값으로 나눈 달성률을 계산한 뒤, 모든 종료 전략의 달성률을 평균합니다. 실제 성과가 목표값 이상이면 목표 달성 전략으로 집계합니다."
        />
      ),
      value: formatPercent(current.averageAchievementRate),
      helper: `목표 달성 전략 ${formatQuantity(current.goalAchievedCount, { unit: '건' })}/${formatQuantity(current.completedCount, { unit: '건' })} · ${formatPercent(current.goalAchievedStrategyRate)}`,
      icon: Activity,
      tone: 'good',
    },
    {
      id: 'avoided-disposal',
      label: (
        <MetricLabel
          label="폐기위험 감소"
          calculation="전략 실행 전에는 폐기가 예상됐지만, 전략 종료 후 판매·이동 등으로 폐기위험에서 벗어난 재고 수량을 합산합니다."
        />
      ),
      value: formatQuantity(current.avoidedDisposalQty),
      helper: '전략 실행으로 폐기 가능성이 낮아진 재고',
      icon: Danger,
      tone: 'good',
    },
    {
      id: 'estimated-loss-savings',
      label: (
        <MetricLabel
          label="추정 손실 절감액"
          calculation="폐기위험에서 벗어난 재고 수량에 전략 실행 당시 상품 원가를 적용한 추정 금액을 합산합니다."
        />
      ),
      value: formatCurrency(current.estimatedLossSavingsAmount),
      helper: '폐기를 피한 재고의 전략 실행 당시 원가 기준',
      icon: ChartBar,
      tone: 'good',
    },
  ];

  return (
    <section aria-label="AI 전략 핵심 성과">
      {isPreview ? (
        <div className="mb-3 flex justify-end">
          <Badge variant="warning">API 연결 전 화면 검토용</Badge>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-[var(--spacing-card-gap)] sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} {...metric} className="h-full" />
        ))}
      </div>
    </section>
  );
}

const TREND_METRICS = Object.freeze({
  riskStockReductionQty: {
    label: '위험재고 감소',
    color: 'var(--primary)',
    format: formatQuantity,
    chartLabel: '위험재고 감소 일별 막대 차트',
    description: '실행이 끝난 전략이 줄인 위험재고 수량을 일자별로 비교합니다.',
  },
  achievementRate: {
    label: '목표 달성률',
    color: 'var(--good)',
    format: formatPercent,
    chartLabel: '목표 달성률 목표선 비교 차트',
    description: '종료 전략의 일별 평균 달성률과 목표 기준 85%를 비교합니다.',
  },
  avoidedDisposalQty: {
    label: '폐기위험 감소',
    color: 'var(--warning)',
    format: formatQuantity,
    chartLabel: '폐기위험 감소 영역 차트',
    description: '폐기 위험을 피한 수량의 흐름과 변동 폭을 확인합니다.',
  },
  estimatedLossSavingsAmount: {
    label: '추정 손실 절감',
    color: 'var(--info)',
    format: formatCurrency,
    chartLabel: '일별 및 누적 추정 손실 절감 복합 차트',
    description: '일별 절감액과 조회 기간 누적 절감액을 함께 확인합니다.',
  },
});

function TrendTooltip({ active, payload, metric }) {
  if (!active || !payload?.[0]?.payload) return null;
  const point = payload[0].payload;
  const meta = TREND_METRICS[metric];
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-[var(--shadow-soft)]">
      <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
        {formatDate(point.date)}
      </span>
      <strong className="mt-1 block text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
        {meta.label} {meta.format(point[metric])}
      </strong>
      <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
        종료 전략 {formatQuantity(point.completedCount, { unit: '건' })}
      </span>
      {metric === 'estimatedLossSavingsAmount' ? (
        <span className="mt-1 block text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--primary)]">
          누적 {formatCurrency(point.cumulativeEstimatedLossSavingsAmount)}
        </span>
      ) : null}
    </div>
  );
}

function DateAxis() {
  return (
    <XAxis
      dataKey="date"
      tickFormatter={(value) => value.slice(5).replace('-', '.')}
      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
      axisLine={false}
      tickLine={false}
      minTickGap={30}
    />
  );
}

function Grid() {
  return <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />;
}

function StrategyPerformanceTrend({ trend }) {
  const [metric, setMetric] = useState('riskStockReductionQty');
  const gradientId = `strategy-performance-${useId().replaceAll(':', '')}`;
  const meta = TREND_METRICS[metric];
  const values = trend.map((point) => point[metric]).filter(Number.isFinite);
  const max = Math.max(...values, 1);
  const chartData = trend.reduce((points, point) => {
    const cumulativeEstimatedLossSavingsAmount =
      (points.at(-1)?.cumulativeEstimatedLossSavingsAmount ?? 0) + point.estimatedLossSavingsAmount;
    return [...points, { ...point, cumulativeEstimatedLossSavingsAmount }];
  }, []);

  function renderChart() {
    if (metric === 'achievementRate') {
      return (
        <LineChart data={chartData} margin={{ top: 18, right: 16, left: 4, bottom: 0 }}>
          <Grid />
          <DateAxis />
          <YAxis
            width={54}
            domain={[0, 110]}
            ticks={[0, 50, 75, 85, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine
            y={85}
            stroke="var(--warning)"
            strokeDasharray="5 5"
            label={{ value: '목표 85%', position: 'insideTopRight', fill: 'var(--warning)', fontSize: 11 }}
          />
          <Tooltip content={<TrendTooltip metric={metric} />} />
          <Line
            type="monotone"
            dataKey={metric}
            stroke={meta.color}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--card)' }}
            connectNulls
          />
        </LineChart>
      );
    }

    if (metric === 'riskStockReductionQty') {
      return (
        <BarChart data={chartData} margin={{ top: 12, right: 8, left: 4, bottom: 0 }} barCategoryGap="24%">
          <Grid />
          <DateAxis />
          <YAxis
            width={64}
            domain={[0, Math.ceil(max * 1.12)]}
            tickFormatter={formatNumber}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<TrendTooltip metric={metric} />} cursor={{ fill: 'var(--primary-soft)', opacity: 0.45 }} />
          <Bar dataKey={metric} fill={meta.color} fillOpacity={0.82} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      );
    }

    if (metric === 'estimatedLossSavingsAmount') {
      const cumulativeMax = chartData.at(-1)?.cumulativeEstimatedLossSavingsAmount ?? 1;
      return (
        <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
          <Grid />
          <DateAxis />
          <YAxis
            yAxisId="daily"
            width={64}
            domain={[0, Math.ceil(max * 1.12)]}
            tickFormatter={(value) => `${Math.round(value / 10_000)}만`}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="cumulative"
            orientation="right"
            width={68}
            domain={[0, Math.ceil(cumulativeMax * 1.08)]}
            tickFormatter={(value) => `${Math.round(value / 1_000_000)}백만`}
            tick={{ fill: 'var(--primary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<TrendTooltip metric={metric} />} />
          <Bar
            yAxisId="daily"
            dataKey={metric}
            fill={meta.color}
            fillOpacity={0.48}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
          <Line
            yAxisId="cumulative"
            type="monotone"
            dataKey="cumulativeEstimatedLossSavingsAmount"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--card)', strokeWidth: 2 }}
          />
        </ComposedChart>
      );
    }

    return (
      <AreaChart data={chartData} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={meta.color} stopOpacity={0.34} />
            <stop offset="100%" stopColor={meta.color} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <Grid />
        <DateAxis />
        <YAxis
          width={64}
          domain={[0, Math.ceil(max * 1.12)]}
          tickFormatter={formatNumber}
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<TrendTooltip metric={metric} />} />
        <Area
          type="monotone"
          dataKey={metric}
          stroke={meta.color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          connectNulls
        />
      </AreaChart>
    );
  }

  return (
    <Card asChild padding="none" className="min-w-0 shadow-[var(--shadow-soft)]">
      <section aria-labelledby="strategy-performance-trend-title">
        <CardHeader className="border-b border-[var(--border)] p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle id="strategy-performance-trend-title">AI 전략 성과 추이</CardTitle>
              <CardDescription className="mt-1">{meta.description}</CardDescription>
            </div>
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-[var(--radius-control)] bg-[var(--surface-subtle)] p-1">
              {Object.entries(TREND_METRICS).map(([value, option]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={metric === value ? 'primary' : 'ghost'}
                  aria-pressed={metric === value}
                  onClick={() => setMetric(value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="h-[300px] w-full" role="img" aria-label={meta.chartLabel}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </section>
    </Card>
  );
}

function ActionCombinationTable({ combinations }) {
  return (
    <Card asChild padding="none" className="min-w-0 shadow-[var(--shadow-soft)]">
      <section aria-labelledby="action-combination-title">
        <CardHeader className="border-b border-[var(--border)] p-5">
          <CardTitle id="action-combination-title">액션 조합별 성과</CardTitle>
          <CardDescription className="mt-1">
            복합전략은 대표 유형으로 나누지 않고 실제 실행된 액션 조합 그대로 한 번만 집계합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-5">
          <table className="w-full min-w-[860px] text-left text-[length:var(--font-size-body-sm)]">
            <thead className="border-b border-[var(--border)] text-[color:var(--text-muted)]">
              <tr>
                <th className="p-3">액션 조합</th>
                <th className="p-3 text-right">완료 전략</th>
                <th className="p-3 text-right">평균 달성률</th>
                <th className="p-3 text-right">위험재고 감소율</th>
                <th className="p-3 text-right">폐기위험 감소</th>
                <th className="p-3 text-right">추정 절감액</th>
              </tr>
            </thead>
            <tbody>
              {combinations.map((item) => (
                <tr key={item.code} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3">
                    <strong className="text-[color:var(--text-heading)]">{item.label}</strong>
                    {item.completedCount < 5 ? (
                      <Badge variant="warning" size="sm" className="ml-2">
                        표본 부족
                      </Badge>
                    ) : null}
                  </td>
                  <td className="p-3 text-right">{formatQuantity(item.completedCount, { unit: '건' })}</td>
                  <td className="p-3 text-right font-[var(--font-weight-semibold)] text-[color:var(--good)]">
                    {formatPercent(item.averageAchievementRate)}
                  </td>
                  <td className="p-3 text-right font-[var(--font-weight-semibold)]">
                    {formatPercent(item.riskReductionRate)}
                  </td>
                  <td className="p-3 text-right">{formatQuantity(item.avoidedDisposalQty)}</td>
                  <td className="p-3 text-right">{formatCurrency(item.estimatedLossSavingsAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </section>
    </Card>
  );
}

export function StrategyStatisticsPanel({ view, isPreview = false }) {
  return (
    <div className="space-y-4">
      <StrategySummary current={view.current} isPreview={isPreview} />
      <StrategyPerformanceTrend trend={view.trend} />
      <ActionCombinationTable combinations={view.actionCombinationBreakdown} />
    </div>
  );
}
