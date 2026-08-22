import { formatDaysRemaining, formatQuantity } from '@/shared/lib/format';
import { InventoryStatusBadge } from '@/entities/inventory';
import { STORAGE_BADGE_STYLES, ASSESSMENT_STATUS_LABELS } from './constants.js';

export function InventoryTableMobile({
  items = [],
  selectedItem = null,
  selectedSkuCodes = [],
  onToggleSelectSku,
  maxSelection = 5,
  onRowClick,
}) {
  return (
    <div className="lg:hidden divide-y divide-gray-100 bg-white">
      {items.map((item) => {
        const isSelected = selectedItem?.rowId === item.rowId;
        const isSelectedSku = selectedSkuCodes.includes(item.skuCode);
        const isMaxReached = selectedSkuCodes.length >= maxSelection;
        const skuLabel = item.skuName || item.productName || 'SKU명 미지정';
        const categoryLeafName = item.category?.leaf?.name || item.categoryName || '';
        const categoryPathLabel = item.categoryPathLabel || categoryLeafName;
        const salesPoints = item.salesPoints || [];
        const ownerSalesPointCount = item.ownerSalesPointCount ?? salesPoints.length;
        const unassignedInventory = item.unassignedInventory || {};
        const hasUnassignedInventory =
          unassignedInventory.hasStock ||
          unassignedInventory.currentQuantity != null ||
          unassignedInventory.availableQuantity != null ||
          unassignedInventory.reservedQuantity != null;
        const storageBadgeClass = STORAGE_BADGE_STYLES[item.storageType] || 'bg-gray-100 text-gray-700';

        return (
          <div
            key={item.rowId}
            role="button"
            tabIndex={0}
            onClick={() => onRowClick?.(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRowClick?.(item);
              }
            }}
            className={`p-4 transition-all flex flex-col gap-3 cursor-pointer ${
              isSelected || isSelectedSku ? 'bg-[#F4FAF6] border-l-4 border-[var(--primary)]' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="pt-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelectedSku}
                    disabled={!isSelectedSku && isMaxReached}
                    onChange={() => onToggleSelectSku?.(item.skuCode)}
                    aria-label={`${skuLabel} 선택`}
                    title={
                      !isSelectedSku && isMaxReached
                        ? `최대 ${maxSelection}개까지 선택 가능합니다`
                        : `${skuLabel} 선택 (${selectedSkuCodes.length}/${maxSelection})`
                    }
                    className="size-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={skuLabel}
                    className="size-14 shrink-0 rounded-xl border border-gray-200 object-cover shadow-2xs"
                  />
                ) : (
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-400">
                    No Img
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded bg-gray-100 px-1.5 py-0.2 text-[10px] font-mono font-bold text-gray-600">
                      {item.skuCode}
                    </span>
                    <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${storageBadgeClass}`}>
                      {item.storageName}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 truncate mt-1 leading-snug">{skuLabel}</h3>
                  {categoryPathLabel && (
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{categoryPathLabel}</p>
                  )}
                  {item.supplierName && (
                    <p className="text-[11px] text-gray-500 truncate mt-0.5" title={`공급사: ${item.supplierName}`}>
                      공급사: {item.supplierName}
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <InventoryStatusBadge status={item.riskGrade} />
                {item.assessmentStatus && item.assessmentStatus !== 'ASSESSED' && (
                  <span className="text-[10px] font-medium text-gray-500">
                    {ASSESSMENT_STATUS_LABELS[item.assessmentStatus] || item.assessmentStatus}
                  </span>
                )}
                {item.inventoryFactState && item.inventoryFactState !== 'AVAILABLE' && (
                  <span className="text-[10px] font-medium text-gray-500">
                    {item.inventoryFactLabel || item.inventoryFactState}
                  </span>
                )}
                {item.nearestExpiryDays != null && (
                  <span className="rounded px-1.5 py-0.2 text-[10px] font-bold bg-amber-50 text-amber-700">
                    {formatDaysRemaining(item.nearestExpiryDays)}
                  </span>
                )}
              </div>
            </div>

            {/* 하단 수량 및 판매처 정보 */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {salesPoints.slice(0, 3).map((sp) => (
                  <span
                    key={sp.salesPointCode}
                    className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                  >
                    {sp.salesPointName}
                  </span>
                ))}
                {salesPoints.length > 3 && (
                  <span className="text-[10px] text-gray-400 font-bold">+{salesPoints.length - 3}</span>
                )}
                {hasUnassignedInventory && (
                  <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                    물류센터 미할당 {formatQuantity(unassignedInventory.currentQuantity)}
                  </span>
                )}
                <span className="text-[10px] text-gray-500 font-medium">
                  {ownerSalesPointCount > salesPoints.length
                    ? `${salesPoints.length}개 표시 / 전체 ${ownerSalesPointCount}개`
                    : `전체 ${ownerSalesPointCount}개`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <span className="text-[10px] text-gray-400 block">현재고</span>
                  <strong className="text-xs font-extrabold text-gray-800 tabular-nums">
                    {formatQuantity(item.currentQuantity)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">가용수량</span>
                  <strong className="text-xs font-extrabold text-[color:var(--primary)] tabular-nums">
                    {formatQuantity(item.availableQuantity)}
                  </strong>
                  <span className="block text-[10px] text-gray-400">예약 {formatQuantity(item.reservedQuantity)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
