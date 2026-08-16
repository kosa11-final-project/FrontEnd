import { CloseCircle, Package } from 'reicon-react';
import { formatDateTime } from '@/shared/lib/format';
import { STORAGE_BADGE_STYLES } from './constants.js';

function getCategoryPathLabel(item) {
  if (item?.categoryPathLabel) return item.categoryPathLabel;
  if (item?.category?.path?.length) return item.category.path.map((category) => category.name).join(' > ');
  return item?.categoryName || '';
}

export function InventoryDetailHeader({
  item,
  allSalesPoints = [],
  selectedSalesPointCode = '',
  copiedSku = false,
  closeButtonRef,
  onCopySku,
  onSelectSalesPoint,
  onClose,
}) {
  return (
    <header className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 border-b border-[var(--border)] bg-white px-6 py-3.5 shadow-2xs shrink-0">
      {/* 좌측: 상품 이미지 + 보관/SKU 배지 + SKU/상품명 */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="size-12 shrink-0 rounded-xl border border-[var(--border)] bg-white object-cover shadow-2xs"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-gray-50 text-xs font-semibold text-gray-400">
            <Package size={22} className="text-gray-300" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`rounded border px-2 py-0.5 text-xs font-bold shrink-0 ${
                STORAGE_BADGE_STYLES[item.storageType] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {item.storageName}
            </span>

            <button
              type="button"
              onClick={onCopySku}
              title="SKU 코드 복사"
              className="group inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <span>{item.skuCode}</span>
              <span className="text-[9px] text-gray-400 group-hover:text-gray-600">
                {copiedSku ? '✓ 복사됨' : '복사'}
              </span>
            </button>

            {item.inventoryFactLabel && item.inventoryFactState !== 'AVAILABLE' && (
              <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {item.inventoryFactLabel}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-baseline gap-2 min-w-0 flex-wrap">
            <h2
              id="drawer-product-title"
              className="truncate text-base font-extrabold text-gray-900 leading-tight"
              title={item.skuName || item.productName || item.skuCode}
            >
              {item.skuName || item.productName || item.skuCode}
            </h2>
            {item.productName && item.productName !== item.skuName && (
              <span className="truncate text-xs text-gray-400 font-medium" title={item.productName}>
                (상품명: {item.productName})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 우측: 카테고리 태그 및 기준 시각 가로 배치 */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden sm:flex flex-col items-end gap-1 text-right">
          {getCategoryPathLabel(item) && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200/80 px-2.5 py-1 text-[11px] text-gray-600 max-w-[320px]">
              <span className="text-gray-400 shrink-0 font-medium">카테고리</span>
              <span className="truncate font-semibold text-gray-800" title={getCategoryPathLabel(item)}>
                {getCategoryPathLabel(item)}
              </span>
            </div>
          )}
          <span className="text-[10px] text-gray-400 tabular-nums">기준 시각: {formatDateTime(item.updatedAt)}</span>
        </div>

        {/* 스크린리더 및 접근성/테스트용 (시각적으로는 좌측 판매처 리스트가 담당) */}
        <select
          id="inventory-sales-point-select"
          aria-label="상세 판매처 선택"
          value={selectedSalesPointCode || ''}
          onChange={(e) => onSelectSalesPoint?.(e.target.value)}
          className="sr-only"
        >
          <option value="">전체 판매처 요약</option>
          {allSalesPoints.map((point) => (
            <option key={point.salesPointCode} value={point.salesPointCode}>
              {point.salesPointName} ({point.salesPointCode})
            </option>
          ))}
        </select>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="상세 드로어 닫기"
          className="flex size-9 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-gray-400 shadow-2xs hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
        >
          <CloseCircle size={20} />
        </button>
      </div>
    </header>
  );
}
