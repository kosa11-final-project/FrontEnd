import { Building } from 'reicon-react';
import { formatQuantity } from '@/shared/lib/format';

/**
 * 재고 상세 미할당 재고 보관 물류센터 현황 섹션
 * @param {object} props
 * @param {Array<any>} [props.locations=[]] - 판매처에 귀속되지 않은 재고 위치만 전달
 * @param {number} [props.skuTotalStockQty=0] - 미할당 재고 합계
 */
export function InventoryStorageLocationSection({ locations = [], skuTotalStockQty = 0 }) {
  return (
    <div className="p-4 border-b border-gray-100 shrink-0">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Building size={15} className="text-gray-600" />
          <h3 className="text-xs font-bold text-gray-900">미할당 재고 보관 물류센터 ({locations.length}개소)</h3>
        </div>
        <span className="text-[11px] text-gray-400">판매처 재고 제외 · 거점별 비중</span>
      </div>

      {locations.length > 0 ? (
        <div className="space-y-1.5">
          {locations.map((loc) => {
            const qty = loc.quantity == null ? null : Number(loc.quantity);
            const pct =
              skuTotalStockQty > 0 && qty != null
                ? Math.min(100, Math.max(0, Math.round((qty / skuTotalStockQty) * 100)))
                : null;

            return (
              <div
                key={loc.warehouseCode || loc.warehouseName}
                className="rounded-lg p-2 transition-all border bg-[#F9FAFB] border-gray-100"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-semibold text-gray-800">{loc.warehouseName}</span>
                  <span className="font-mono tabular-nums font-bold text-gray-900">
                    {formatQuantity(qty)}{' '}
                    <span className="text-[10px] font-normal text-gray-400">({pct == null ? '-' : `${pct}%`})</span>
                  </span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200/60">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all"
                    style={{ width: `${pct == null ? 0 : pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-3 text-center text-xs text-gray-400">미할당 재고가 있는 물류센터가 없습니다</div>
      )}
    </div>
  );
}
