import { Building } from 'reicon-react';
import { formatQuantity } from '@/shared/lib/format';

/**
 * 재고 상세 보관 물류센터 현황 섹션
 * @param {object} props
 * @param {Array<any>} [props.locations=[]]
 * @param {number} [props.skuTotalStockQty=0]
 * @param {string} [props.selectedSalesPointCode='']
 * @param {string} [props.selectedSalesPointWarehouseCode='']
 * @param {string} [props.selectedSalesPointWarehouseName='']
 * @param {string} [props.selectedSalesPointName='']
 */
export function InventoryStorageLocationSection({
  locations = [],
  skuTotalStockQty = 0,
  selectedSalesPointCode = '',
  selectedSalesPointWarehouseCode = '',
  selectedSalesPointWarehouseName = '',
  selectedSalesPointName = '',
}) {
  return (
    <div className="p-4 border-b border-gray-100 shrink-0">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Building size={15} className="text-gray-600" />
          <h3 className="text-xs font-bold text-gray-900">보관 물류센터 ({locations.length}개소)</h3>
        </div>
        <span className="text-[11px] text-gray-400">거점별 비중</span>
      </div>

      {locations.length > 0 ? (
        <div className="space-y-1.5">
          {locations.map((loc) => {
            const qty = loc.quantity == null ? null : Number(loc.quantity);
            const pct =
              skuTotalStockQty > 0 && qty != null
                ? Math.min(100, Math.max(0, Math.round((qty / skuTotalStockQty) * 100)))
                : null;
            const isHighlighted = Boolean(
              selectedSalesPointCode &&
              ((selectedSalesPointWarehouseCode && loc.warehouseCode === selectedSalesPointWarehouseCode) ||
                (selectedSalesPointWarehouseName && loc.warehouseName === selectedSalesPointWarehouseName)),
            );

            if (isHighlighted) {
              return (
                <div
                  key={loc.warehouseCode || loc.warehouseName}
                  className="rounded-lg p-2 transition-all border border-[var(--primary)] bg-[#F0FDF4] shadow-2xs ring-1 ring-[var(--primary)]/30"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-[#166534] truncate">{loc.warehouseName}</span>
                      <span className="rounded bg-[#DAF7E9] px-1.5 py-0.5 text-[9px] font-extrabold text-[#1E8251] shrink-0">
                        {selectedSalesPointName || '선택 지점'} 보관 거점
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#166534] tabular-nums">
                      {formatQuantity(qty)}{' '}
                      <span className="text-[10px] font-semibold text-[#1E8251]">
                        ({pct == null ? '-' : `${pct}%`})
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200/50">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all"
                      style={{ width: `${pct == null ? 0 : pct}%` }}
                    />
                  </div>
                </div>
              );
            }

            const isDimmed = Boolean(selectedSalesPointCode);

            return (
              <div
                key={loc.warehouseCode || loc.warehouseName}
                className={`rounded-lg p-2 transition-all border ${
                  isDimmed ? 'bg-[#F9FAFB]/70 border-gray-100 opacity-60' : 'bg-[#F9FAFB] border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`truncate ${isDimmed ? 'font-medium text-gray-600' : 'font-semibold text-gray-800'}`}
                  >
                    {loc.warehouseName}
                  </span>
                  <span
                    className={`font-mono tabular-nums ${
                      isDimmed ? 'text-gray-500 font-normal' : 'font-bold text-gray-900'
                    }`}
                  >
                    {formatQuantity(qty)}{' '}
                    <span className="text-[10px] font-normal text-gray-400">({pct == null ? '-' : `${pct}%`})</span>
                  </span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200/60">
                  <div
                    className={`h-full rounded-full transition-all ${isDimmed ? 'bg-gray-300' : 'bg-[var(--primary)]'}`}
                    style={{ width: `${pct == null ? 0 : pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-3 text-center text-xs text-gray-400">물류센터 정보 없음</div>
      )}
    </div>
  );
}
