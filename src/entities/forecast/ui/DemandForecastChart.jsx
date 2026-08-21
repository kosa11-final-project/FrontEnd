import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber } from '@/shared/lib/format';

function SingleSeriesTooltip({ active, payload, label, safetyStockQty }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur-xs min-w-[160px]">
      <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry, index) => {
          if (entry.value == null) return null;
          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold text-slate-900 tabular-nums">{formatNumber(entry.value)}개</span>
            </div>
          );
        })}
        {safetyStockQty != null && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1 text-rose-600">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-500" />
              안전재고 기준:
            </span>
            <span className="font-semibold tabular-nums">{formatNumber(safetyStockQty)}개</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 수요예측 및 재고 추이 차트 시각화 컴포넌트
 * @param {object} props
 * @param {import('../model/forecast.js').DemandForecastDetail | null} props.data - 수요예측 뷰 모델 데이터
 * @param {number} [props.height=300] - 차트 높이(px)
 */
export function DemandForecastChart({ data, height = 300 }) {
  if (!data) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-400"
        style={{ height }}
      >
        수요예측을 조회할 판매처를 선택해 주세요.
      </div>
    );
  }

  const renderablePoints = data.chartPoints?.filter((point) => point.projectedQty != null);

  if (data.status === 'ERROR' || data.status === 'NO_DATA' || !renderablePoints || renderablePoints.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-400"
        style={{ height }}
      >
        {data.status === 'ERROR' ? '수요예측을 표시할 수 없습니다.' : '시각화할 예측 데이터가 없습니다.'}
      </div>
    );
  }

  const { safetyStockQty } = data;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={renderablePoints} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: '#CBD5E1' }}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: '#CBD5E1' }}
            tick={{ fontSize: 11, fill: '#64748B' }}
            tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : val)}
          />
          <Tooltip content={<SingleSeriesTooltip safetyStockQty={safetyStockQty} />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
          />

          {/* 안전재고 기준선 */}
          {safetyStockQty != null && (
            <ReferenceLine
              y={safetyStockQty}
              stroke="#F43F5E"
              strokeDasharray="4 4"
              label={{
                value: `안전재고 (${safetyStockQty})`,
                fill: '#E11D48',
                fontSize: 10,
                position: 'right',
              }}
            />
          )}

          {/* 예상 가용재고 (Area & Line) */}
          <Area
            type="monotone"
            dataKey="projectedQty"
            name="예상 가용재고"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#projectedGradient)"
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
