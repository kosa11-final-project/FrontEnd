import {
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from 'recharts';
import { BagShopping, ChartBar, Money, Store, TickCircle } from 'reicon-react';
import { formatNumber, formatQuantity } from '@/shared/lib/format';
import { Badge, Icon } from '@/shared/ui';

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

const CHANNEL_TYPE_LABELS = Object.freeze({
  GREETING: '그리팅',
  ECOMMERCE: '모두의맛집',
  HYUNDAI_DEPT: '현대백화점',
  HMART: '직영점',
});

function findSalesPoint(result, actions) {
  const salesPointName = result.salesPointName || result.channel || '판매처 미수집';
  return actions
    .flatMap((action) => [action.sourceSalesPoint, action.targetSalesPoint])
    .filter(Boolean)
    .find(
      (salesPoint) =>
        (result.salesPointId != null && String(salesPoint.id) === String(result.salesPointId)) ||
        salesPoint.name === salesPointName,
    );
}

function formatChannelName(result, actions) {
  const salesPointName = result.salesPointName || result.channel || '판매처 미수집';
  const salesPoint = findSalesPoint(result, actions);
  const channelName =
    result.channelName ||
    CHANNEL_TYPE_LABELS[result.channelType] ||
    CHANNEL_TYPE_LABELS[salesPoint?.type] ||
    null;

  if (!channelName || salesPointName.includes(channelName)) return salesPointName;
  return `${channelName} · ${salesPointName}`;
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parseChannelRevenue(value) {
  const numeric = toFiniteNumber(value);
  if (numeric !== null) return numeric;
  if (typeof value !== 'string') return null;

  const normalized = value.replaceAll(',', '').replaceAll(' ', '');
  const amount = Number.parseFloat(normalized.replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(amount)) return null;
  if (normalized.includes('억원') || normalized.includes('억')) return amount * 100_000_000;
  if (normalized.includes('만원') || normalized.includes('만')) return amount * 10_000;
  if (normalized.includes('천원') || normalized.includes('천')) return amount * 1_000;
  return amount;
}

export function buildChannelPerformanceReport(results = [], actions = []) {
  const channels = results.map((result, index) => {
    const sales = toFiniteNumber(result.sales);
    const revenue = parseChannelRevenue(result.revenue);
    return {
      id: result.salesPointId ?? `${result.channel ?? 'CHANNEL'}-${index}`,
      channel: formatChannelName(result, actions),
      status: result.status ?? null,
      sales,
      revenue,
      cannibalization: result.cannibalization ?? null,
      size: Math.max(revenue ?? sales ?? 1, 1),
    };
  });
  const comparableChannels = channels.filter((channel) => channel.sales !== null && channel.revenue !== null);
  const completedChannels = channels.filter((channel) => ['COMPLETED', '판매 완료'].includes(channel.status)).length;

  return {
    channels,
    summary: {
      totalSales: channels.reduce((total, channel) => total + (channel.sales ?? 0), 0),
      totalRevenue: channels.reduce((total, channel) => total + (channel.revenue ?? 0), 0),
      channelCount: channels.length,
      completedChannels,
    },
    averages: {
      sales: comparableChannels.length
        ? comparableChannels.reduce((total, channel) => total + channel.sales, 0) / comparableChannels.length
        : null,
      revenue: comparableChannels.length
        ? comparableChannels.reduce((total, channel) => total + channel.revenue, 0) / comparableChannels.length
        : null,
    },
    visualization:
      channels.length >= 4 &&
      comparableChannels.length === channels.length &&
      (new Set(channels.map((channel) => channel.sales)).size > 1 ||
        new Set(channels.map((channel) => channel.revenue)).size > 1)
        ? 'scatter'
        : channels.length === 1
          ? 'single'
          : 'treemap',
  };
}

const formatRevenue = (value, fallback = '미수집') =>
  value === null || value === undefined ? fallback : `${formatNumber(value)}원`;

const CHANNEL_STATUS_LABELS = Object.freeze({
  READY: '대기',
  EXECUTING: '진행 중',
  PARTIAL: '부분 완료',
  COMPLETED: '완료',
  FAILED: '실패',
  CANCELLED: '취소',
});

function formatChannelStatus(status) {
  return CHANNEL_STATUS_LABELS[status] ?? status ?? '상태 미수집';
}

function SummaryGrid({ summary }) {
  const items = [
    {
      label: '총 판매량',
      value: formatQuantity(summary.totalSales),
      icon: BagShopping,
      cardClass: 'border-[#B7ECCF] bg-[#F1FCF6]',
      iconClass: 'bg-[var(--good-soft)] text-[color:var(--good)]',
    },
    {
      label: '총 매출',
      value: formatRevenue(summary.totalRevenue),
      icon: Money,
      cardClass: 'border-[#A6E8F6] bg-[#F0FBFE]',
      iconClass: 'bg-[var(--info-soft)] text-[color:#007B9E]',
    },
    {
      label: '운영 채널',
      value: formatQuantity(summary.channelCount, { unit: '개' }),
      icon: Store,
      cardClass: 'border-[#FDE68A] bg-[#FFFBF0]',
      iconClass: 'bg-[var(--warning-soft)] text-[color:#B45309]',
    },
    {
      label: '완료 채널',
      value: formatQuantity(summary.completedChannels, { unit: '개' }),
      icon: TickCircle,
      cardClass: 'border-[#B7ECCF] bg-[#F6FCF9]',
      iconClass: 'bg-[var(--good-soft)] text-[color:#1E8251]',
    },
  ];

  return (
    <dl className="mb-4 grid grid-cols-2 gap-2 xl:grid-cols-4" aria-label="채널 판매 성과 요약">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-[var(--radius-card)] border p-3 shadow-[var(--shadow-soft)] ${item.cardClass}`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] ${item.iconClass}`}
            >
              <Icon icon={item.icon} size={16} aria-hidden="true" />
            </span>
            <dt className="text-[length:var(--font-size-meta)] font-medium text-[color:var(--text-body)]">
              {item.label}
            </dt>
          </div>
          <dd className="mt-3 font-bold tabular-nums text-[color:var(--text-heading)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ChannelTooltip({ active, payload }) {
  if (!active || !payload?.[0]?.payload) return null;
  const channel = payload[0].payload;
  return (
    <div className="min-w-48 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-[var(--shadow-soft)]">
      <strong className="text-[color:var(--text-heading)]">{channel.channel ?? channel.name}</strong>
      <dl className="mt-2 grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-[length:var(--font-size-meta)]">
        <dt className="text-[color:var(--text-muted)]">판매량</dt>
        <dd className="text-right font-semibold">{formatQuantity(channel.sales, { fallback: '미수집' })}</dd>
        <dt className="text-[color:var(--text-muted)]">매출</dt>
        <dd className="text-right font-semibold">{formatRevenue(channel.revenue)}</dd>
        <dt className="text-[color:var(--text-muted)]">상태</dt>
        <dd className="text-right font-semibold">{formatChannelStatus(channel.status)}</dd>
        <dt className="text-[color:var(--text-muted)]">잠식</dt>
        <dd className="text-right font-semibold">{channel.cannibalization ?? '미수집'}</dd>
      </dl>
    </div>
  );
}

function TreemapContent({ x, y, width, height, depth, index, channel, sales, revenue, share }) {
  if (depth === 0) return null;
  const color = CHART_COLORS[index % CHART_COLORS.length];
  const showDetails = width >= 150 && height >= 110;
  return (
    <g>
      <rect
        x={x + 3}
        y={y + 3}
        width={Math.max(width - 6, 0)}
        height={Math.max(height - 6, 0)}
        rx={12}
        fill={color}
        fillOpacity={0.1}
        stroke={color}
        strokeOpacity={0.45}
      />
      <rect x={x + 3} y={y + 3} width={Math.max(width - 6, 0)} height={4} rx={2} fill={color} />
      <text x={x + 18} y={y + 30} fill="var(--text-heading)" fontSize={12} fontWeight={700}>
        {channel}
      </text>
      <text x={x + 18} y={y + 54} fill={color} fontSize={22} fontWeight={800}>
        {share.toFixed(1)}%
      </text>
      <text x={x + 18} y={y + 71} fill="var(--text-muted)" fontSize={10} fontWeight={600}>
        매출 비중
      </text>
      {showDetails ? (
        <>
          <text x={x + 18} y={y + height - 35} fill="var(--text-body)" fontSize={11}>
            판매 {formatQuantity(sales, { fallback: '미수집' })}
          </text>
          <text x={x + 18} y={y + height - 18} fill="var(--text-muted)" fontSize={11}>
            매출 {formatRevenue(revenue)}
          </text>
        </>
      ) : null}
    </g>
  );
}

function ChannelTreemap({ channels }) {
  const totalRevenue = channels.reduce((total, channel) => total + (channel.revenue ?? 0), 0);
  const chartData = channels.map((channel) => ({
    ...channel,
    share: totalRevenue > 0 ? ((channel.revenue ?? 0) / totalRevenue) * 100 : 100 / channels.length,
  }));

  return (
    <div
      className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] p-4"
      role="img"
      aria-label="채널별 매출 비중 트리맵"
    >
      <div className="mb-2 flex flex-wrap items-end justify-between gap-1">
        <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
          채널 매출 구성
        </strong>
        <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          면적은 매출 비중을 나타냅니다.
        </span>
      </div>
      <div className={channels.length === 2 ? 'h-[180px]' : 'h-[210px]'}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={chartData}
            dataKey="size"
            nameKey="channel"
            aspectRatio={4 / 3}
            content={<TreemapContent />}
            isAnimationActive={false}
          >
            <Tooltip content={<ChannelTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">
        {chartData.map((channel) => (
          <li key={channel.id}>
            {channel.channel}: 매출 비중 {channel.share.toFixed(1)}%, 판매{' '}
            {formatQuantity(channel.sales, { fallback: '미수집' })}, 매출 {formatRevenue(channel.revenue)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChannelScatterChart({ channels, averages }) {
  return (
    <div className="h-[320px] w-full" role="img" aria-label="채널 판매량과 매출 성과 사분면 차트">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 28, right: 20, bottom: 18, left: 8 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" />
          <XAxis
            type="number"
            dataKey="sales"
            name="판매량"
            unit="개"
            allowDecimals={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: '판매량',
              position: 'insideBottomRight',
              offset: -10,
              fill: 'var(--text-muted)',
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="revenue"
            name="매출"
            tickFormatter={(value) => `${formatNumber(value / 10_000)}만`}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <ReferenceLine x={averages.sales} stroke="var(--chart-baseline)" strokeDasharray="4 4" />
          <ReferenceLine y={averages.revenue} stroke="var(--chart-baseline)" strokeDasharray="4 4" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChannelTooltip />} />
          <Scatter data={channels} fill="var(--chart-1)" isAnimationActive={false}>
            <LabelList dataKey="channel" position="top" fill="var(--text-body)" fontSize={11} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="sr-only">
        평균 판매량 {formatQuantity(averages.sales)}, 평균 매출 {formatRevenue(averages.revenue)}를 기준으로 채널을
        비교합니다.
      </p>
    </div>
  );
}

function SingleChannelReport({ channel }) {
  const isCompleted = ['COMPLETED', '판매 완료'].includes(channel.status);

  return (
    <article
      className="overflow-hidden rounded-[var(--radius-card)] border border-[#B7ECCF] bg-[var(--card)] shadow-[var(--shadow-soft)]"
      aria-label={`${channel.channel} 채널 판매 성과`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDEFE5] bg-[#F1FCF6] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[var(--radius-control)] bg-[var(--good-soft)] text-[color:var(--good)]">
            <Icon icon={Store} size={18} aria-hidden="true" />
          </span>
          <strong className="text-[length:var(--font-size-subtitle1)] text-[color:var(--text-heading)]">
            {channel.channel}
          </strong>
        </div>
        <Badge variant={isCompleted ? 'good' : 'neutral'}>
          {isCompleted ? <Icon icon={TickCircle} size={12} aria-hidden="true" /> : null}
          {formatChannelStatus(channel.status)}
        </Badge>
      </div>
      <dl className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-control)] bg-[var(--surface-subtle)] p-3">
          <dt className="flex items-center gap-1.5 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            <Icon icon={BagShopping} size={14} className="text-[color:var(--good)]" aria-hidden="true" />
            판매량
          </dt>
          <dd className="mt-2 font-bold text-[color:var(--text-heading)]">
            {formatQuantity(channel.sales, { fallback: '미수집' })}
          </dd>
        </div>
        <div className="rounded-[var(--radius-control)] bg-[var(--surface-subtle)] p-3">
          <dt className="flex items-center gap-1.5 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            <Icon icon={Money} size={14} className="text-[color:var(--info)]" aria-hidden="true" />
            매출
          </dt>
          <dd className="mt-2 font-bold text-[color:var(--text-heading)]">{formatRevenue(channel.revenue)}</dd>
        </div>
        <div className="rounded-[var(--radius-control)] bg-[var(--surface-subtle)] p-3">
          <dt className="flex items-center gap-1.5 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            <Icon icon={ChartBar} size={14} className="text-[color:var(--warning)]" aria-hidden="true" />
            잠식 여부
          </dt>
          <dd className="mt-2 font-bold text-[color:var(--text-heading)]">{channel.cannibalization ?? '미수집'}</dd>
        </div>
      </dl>
    </article>
  );
}

export function StrategyChannelPerformanceReport({ results = [], actions = [] }) {
  const report = buildChannelPerformanceReport(results, actions);
  if (!report.channels.length) return null;

  return (
    <div>
      <SummaryGrid summary={report.summary} />
      {report.visualization === 'scatter' ? (
        <ChannelScatterChart channels={report.channels} averages={report.averages} />
      ) : report.visualization === 'treemap' ? (
        <ChannelTreemap channels={report.channels} />
      ) : (
        <SingleChannelReport channel={report.channels[0]} />
      )}
    </div>
  );
}
