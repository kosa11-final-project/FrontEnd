import { Package, CheckCircle, Warning, Danger, Refresh } from 'reicon-react';
import { formatNumber, formatQuantity } from '@/shared/lib/format';

export function InventorySummaryBar({ summary, isLoading, isError, error, onRetry }) {
  if (isError) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/80 p-4.5 text-xs text-rose-800 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600 shrink-0">
            <Danger size={16} />
          </div>
          <div>
            <p className="font-bold text-rose-900">재고 요약 KPI 지표를 불러오지 못했습니다.</p>
            <p className="text-[11px] text-rose-700">
              {error?.code === 'REQUEST_TIMEOUT'
                ? '요약 조회 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.'
                : '네트워크 상태를 확인하고 다시 시도해 주세요.'}
            </p>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-50 transition-all active:scale-95"
          >
            <Refresh size={13} />
            다시 시도
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-gray-200/80 bg-white/70 p-5 shadow-2xs"
          />
        ))}
      </div>
    );
  }

  const {
    totalCurrentQuantity = 0,
    totalAvailableQuantity = 0,
    totalReservedQuantity = 0,
    underSafetyCount = 0,
    dangerRiskCount = 0,
    cautionRiskCount = 0,
  } = summary || {};

  const availableRate =
    totalCurrentQuantity == null || totalAvailableQuantity == null
      ? null
      : totalCurrentQuantity > 0
        ? Math.min(100, Math.round((totalAvailableQuantity / totalCurrentQuantity) * 100))
        : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. 총 현재고 */}
      <div className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">총 현재고</span>
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#1E8251] ring-1 ring-emerald-100/80 transition-transform duration-200 group-hover:scale-110">
            <Package size={19} />
          </div>
        </div>
        <div className="mt-3.5">
          <div className="text-2xl font-extrabold tracking-tight text-gray-900 tabular-nums">
            {formatQuantity(totalCurrentQuantity)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 pt-1.5 border-t border-gray-100">
            <span>출고예정 / 예약</span>
            <span className="font-bold text-gray-700 tabular-nums">{formatQuantity(totalReservedQuantity)}</span>
          </div>
        </div>
      </div>

      {/* 2. 총 가용수량 */}
      <div className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-teal-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">총 가용수량</span>
          <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100/80 transition-transform duration-200 group-hover:scale-110">
            <CheckCircle size={19} />
          </div>
        </div>
        <div className="mt-3.5">
          <div className="text-2xl font-extrabold tracking-tight text-[#27B06E] tabular-nums">
            {formatQuantity(totalAvailableQuantity)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 pt-1.5 border-t border-gray-100">
            <span>실 가용률</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#27B06E] transition-all duration-500"
                  style={{ width: `${availableRate == null ? 0 : availableRate}%` }}
                />
              </div>
              <span className="font-bold text-[#1E8251] tabular-nums">
                {availableRate == null ? '-' : `${availableRate}%`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 안전재고 미달 SKU */}
      <div className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-amber-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">안전재고 미달 SKU</span>
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100/80 transition-transform duration-200 group-hover:scale-110">
            <Warning size={19} />
          </div>
        </div>
        <div className="mt-3.5">
          <div className="flex items-baseline gap-1 text-2xl font-extrabold tracking-tight text-amber-600 tabular-nums">
            <span>{formatNumber(underSafetyCount)}</span>
            <span className="text-sm font-semibold text-gray-500">개</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 pt-1.5 border-t border-gray-100">
            <span>재고 보충 필요</span>
            <span className="font-bold text-amber-700">{underSafetyCount > 0 ? '긴급 점검 권고' : '정상 유지'}</span>
          </div>
        </div>
      </div>

      {/* 4. 위험, 주의 SKU 관제 */}
      <div className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-rose-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">위험, 주의 SKU 관제</span>
          <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100/80 transition-transform duration-200 group-hover:scale-110">
            <Danger size={19} />
          </div>
        </div>
        <div className="mt-3.5">
          <div className="flex items-baseline gap-1 text-2xl font-extrabold tracking-tight text-rose-600 tabular-nums">
            <span>{formatNumber(dangerRiskCount + cautionRiskCount)}</span>
            <span className="text-sm font-semibold text-gray-500">건</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-gray-100">
            <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 font-bold text-rose-700 border border-rose-200/80 tabular-nums">
              위험 {dangerRiskCount}
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-700 border border-amber-200/80 tabular-nums">
              주의 {cautionRiskCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
