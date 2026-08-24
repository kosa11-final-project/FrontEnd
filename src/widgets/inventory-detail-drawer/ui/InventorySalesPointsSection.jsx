import { useMemo } from 'react';
import { Package } from 'reicon-react';
import { formatNumber, formatQuantity } from '@/shared/lib/format';
import { getSalesPointStateLabel, InventoryStatusBadge } from '@/entities/inventory';
import { CHANNEL_BADGE_LABELS, CHANNEL_BADGE_STYLES } from './constants.js';

/**
 * 재고 상세 판매처 분산 현황 목록 섹션
 * @param {object} props
 * @param {Array<any>} [props.allSalesPoints=[]]
 * @param {any} [props.unassignedInventory]
 * @param {number} [props.ownerSalesPointCount=0]
 * @param {string} [props.selectedSalesPointCode='']
 * @param {Array<any>} [props.channelPrices=[]]
 * @param {(salesPointCode: string) => void} [props.onSelectSalesPoint]
 */
export function InventorySalesPointsSection({
  allSalesPoints = [],
  unassignedInventory = null,
  ownerSalesPointCount = 0,
  selectedSalesPointCode = '',
  channelPrices = [],
  onSelectSalesPoint,
}) {
  const hasUnassignedInventory = Boolean(
    unassignedInventory?.hasStock ||
    unassignedInventory?.currentQuantity != null ||
    unassignedInventory?.availableQuantity != null ||
    unassignedInventory?.reservedQuantity != null,
  );
  const priceMap = useMemo(() => {
    const map = new Map();
    (channelPrices || []).forEach((cp) => {
      if (cp?.salesPointCode) {
        map.set(cp.salesPointCode, cp);
      }
    });
    return map;
  }, [channelPrices]);

  return (
    <div className="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-2.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Package size={15} className="text-gray-600" />
          <h3 className="text-xs font-bold text-gray-900">
            판매처별 재고 분산 (
            {ownerSalesPointCount > allSalesPoints.length
              ? `${allSalesPoints.length}개 표시 / 전체 ${ownerSalesPointCount}개`
              : `전체 ${ownerSalesPointCount}개`}
            )
          </h3>
        </div>
        <span className="text-[11px] text-gray-400">판매처 선택 시 LOT 연동</span>
      </div>

      {allSalesPoints.length > 0 || hasUnassignedInventory ? (
        <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin overscroll-contain">
          {hasUnassignedInventory && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelectSalesPoint?.(selectedSalesPointCode === 'UNASSIGNED' ? '__ALL__' : 'UNASSIGNED')}
              className={`w-full text-left rounded-xl p-2.5 transition-colors border ${
                selectedSalesPointCode === 'UNASSIGNED'
                  ? 'border-amber-400 bg-amber-50 shadow-xs ring-1 ring-amber-300/60'
                  : 'border-amber-200 bg-amber-50/60 hover:bg-amber-50 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="rounded px-1.5 py-0.2 text-[9px] font-bold border border-amber-200 bg-white text-amber-800 shrink-0">
                    물류센터
                  </span>
                  <span className="text-xs font-bold text-gray-900 truncate">미할당 재고</span>
                  <span className="rounded border border-amber-200 bg-white px-1 py-0.5 text-[9px] font-semibold text-amber-800 shrink-0">
                    판매처 미귀속
                  </span>
                </div>
                <InventoryStatusBadge status={unassignedInventory.riskGrade} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-amber-800">판매처 재고를 제외한 센터 보관분</span>
                <div className="tabular-nums text-right shrink-0">
                  <strong className="font-bold text-gray-900">
                    {formatQuantity(unassignedInventory.currentQuantity)}
                  </strong>
                  <span className="text-[10px] text-[#1E8251] ml-1">
                    (가용 {formatQuantity(unassignedInventory.availableQuantity)})
                  </span>
                </div>
              </div>
            </button>
          )}

          {allSalesPoints.map((sp) => {
            const channelBadge = CHANNEL_BADGE_STYLES[sp.channelType] || 'bg-gray-100 text-gray-700 border-gray-200';
            const channelLabel = CHANNEL_BADGE_LABELS[sp.channelType] || sp.channelType || '기타';
            const isSelected = selectedSalesPointCode === sp.salesPointCode;
            const matchedPrice = priceMap.get(sp.salesPointCode);
            const sellingPrice = sp.sellingPrice ?? matchedPrice?.sellingPrice ?? null;

            return (
              <button
                key={sp.salesPointCode}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectSalesPoint?.(isSelected ? '__ALL__' : sp.salesPointCode)}
                className={`w-full text-left rounded-xl p-2.5 transition-colors border ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[#F0FDF4] shadow-xs ring-1 ring-[var(--primary)]/30'
                    : 'border-gray-200/80 bg-white hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold border shrink-0 ${channelBadge}`}>
                      {channelLabel}
                    </span>
                    <span className="text-xs font-bold text-gray-900 truncate">{sp.salesPointName}</span>
                    {sp.salesPointState && sp.salesPointState !== 'OWNED' && (
                      <span className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[9px] font-semibold text-slate-600">
                        {getSalesPointStateLabel(sp.salesPointState)}
                      </span>
                    )}
                  </div>
                  <InventoryStatusBadge status={sp.riskGrade} />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {sellingPrice != null ? (
                      <span className="inline-flex items-center font-bold text-slate-800 bg-slate-100 border border-slate-200/80 rounded px-1.5 py-0.5 text-[11px] tabular-nums">
                        {formatNumber(sellingPrice)}원
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">가격 미등록</span>
                    )}
                  </div>
                  <div className="tabular-nums text-right shrink-0">
                    <strong className="font-bold text-gray-900">{formatQuantity(sp.currentQuantity)}</strong>
                    <span className="text-[10px] text-[#1E8251] ml-1">
                      (가용 {formatQuantity(sp.availableQuantity)})
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-3 text-center text-xs text-gray-400">판매처 정보 없음</div>
      )}
    </div>
  );
}
