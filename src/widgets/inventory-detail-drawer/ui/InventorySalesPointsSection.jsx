import { Package } from 'reicon-react';
import { formatNumber, formatQuantity } from '@/shared/lib/format';
import { InventoryStatusBadge } from '@/entities/inventory';
import { CHANNEL_BADGE_LABELS, CHANNEL_BADGE_STYLES } from './constants.js';

export function InventorySalesPointsSection({
  allSalesPoints = [],
  ownerSalesPointCount = 0,
  selectedSalesPointCode = '',
  onSelectSalesPoint,
}) {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-2.5">
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
        {selectedSalesPointCode ? (
          <button
            type="button"
            onClick={() => onSelectSalesPoint?.('')}
            className="text-[11px] font-semibold text-[#1E8251] hover:underline"
          >
            전체 요약 보기
          </button>
        ) : (
          <span className="text-[11px] text-gray-400">클릭 시 상세/LOT 연동</span>
        )}
      </div>

      {allSalesPoints.length > 0 ? (
        <div className="space-y-1.5">
          {allSalesPoints.map((sp) => {
            const channelBadge = CHANNEL_BADGE_STYLES[sp.channelType] || 'bg-gray-100 text-gray-700 border-gray-200';
            const channelLabel = CHANNEL_BADGE_LABELS[sp.channelType] || sp.channelType || '기타';
            const isSelected = selectedSalesPointCode === sp.salesPointCode;
            return (
              <button
                key={sp.salesPointCode}
                type="button"
                onClick={() => onSelectSalesPoint?.(isSelected ? '' : sp.salesPointCode)}
                className={`w-full text-left rounded-xl p-2.5 transition-all border ${
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
                  </div>
                  <InventoryStatusBadge status={sp.riskGrade} />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-gray-400 truncate">{sp.warehouseName || '담당거점 미지정'}</span>
                    {sp.sellingPrice != null && (
                      <span className="font-semibold text-gray-700 tabular-nums">
                        · {formatNumber(sp.sellingPrice)}원
                      </span>
                    )}
                  </div>
                  <div className="tabular-nums">
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
