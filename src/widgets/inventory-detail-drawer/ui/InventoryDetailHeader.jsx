import { useCallback, useState } from 'react';
import { CloseCircle, Package } from 'reicon-react';
import { formatDateTime } from '@/shared/lib/format';
import { ImageLightbox, toRect } from '@/shared/ui';
import { STORAGE_BADGE_STYLES } from './constants.js';

function getCategoryPathLabel(item) {
  if (item?.categoryPathLabel) return item.categoryPathLabel;
  if (item?.category?.path?.length) return item.category.path.map((category) => category.name).join(' > ');
  return item?.categoryName || '';
}

/**
 * 재고 상세 상단 헤더 컴포넌트 (상품 정보, SKU 복사, 전체/개별 판매처 셀렉터, 닫기 버튼)
 * @param {object} props
 * @param {import('@/entities/inventory').InventoryItem} props.item
 * @param {Array<any>} [props.allSalesPoints=[]]
 * @param {any} [props.unassignedInventory]
 * @param {string} [props.selectedSalesPointCode='']
 * @param {boolean} [props.copiedSku=false]
 * @param {React.RefObject<HTMLButtonElement>} [props.closeButtonRef]
 * @param {() => void} [props.onCopySku]
 * @param {(salesPointCode: string) => void} [props.onSelectSalesPoint]
 * @param {() => void} [props.onClose]
 */
export function InventoryDetailHeader({
  item,
  allSalesPoints = [],
  unassignedInventory = null,
  selectedSalesPointCode = '',
  copiedSku = false,
  closeButtonRef,
  onCopySku,
  onSelectSalesPoint,
  onClose,
}) {
  const [lightboxImage, setLightboxImage] = useState(null);
  const imageAlt = item.skuName || item.productName || item.skuCode;

  const handleImageClick = useCallback(
    (event) => {
      event.stopPropagation();
      const target = event.currentTarget.querySelector('img') || event.currentTarget;
      const rect = target.getBoundingClientRect();

      setLightboxImage({
        id: item.rowId || item.skuCode || imageAlt,
        src: item.imageUrl,
        alt: imageAlt,
        naturalWidth: target.naturalWidth,
        naturalHeight: target.naturalHeight,
        originRect: toRect(rect),
      });
    },
    [imageAlt, item.imageUrl, item.rowId, item.skuCode],
  );

  const handleImageClose = useCallback(() => setLightboxImage(null), []);

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] bg-white px-6 py-3.5 shadow-2xs lg:flex-nowrap">
      {/* 좌측: 상품 이미지 + 보관/SKU 배지 + SKU/상품명 */}
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        {item.imageUrl ? (
          <button
            type="button"
            aria-label={`${imageAlt} 이미지 크게 보기`}
            className="group/image size-12 shrink-0 cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            onClick={handleImageClick}
          >
            <img
              src={item.imageUrl}
              alt={imageAlt}
              className="size-full rounded-xl border border-[var(--border)] bg-white object-cover shadow-2xs transition-transform duration-[var(--motion-standard)] group-hover/image:scale-105"
            />
          </button>
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-gray-50 text-xs font-semibold text-gray-400">
            <Package size={22} className="text-gray-300" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`shrink-0 rounded border px-2 py-0.5 text-xs font-bold ${
                STORAGE_BADGE_STYLES[item.storageType] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {item.storageName}
            </span>

            <button
              type="button"
              onClick={onCopySku}
              title="SKU 코드 복사"
              className="group inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-gray-600 transition-colors hover:bg-gray-200"
            >
              <span>{item.skuCode}</span>
              <span className="text-[9px] text-gray-400 group-hover:text-gray-600">
                {copiedSku ? '✓ 복사됨' : '복사'}
              </span>
            </button>

            {item.inventoryFactLabel && item.inventoryFactState !== 'AVAILABLE' && (
              <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {item.inventoryFactLabel}
              </span>
            )}
          </div>

          <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-2">
            <h2
              id="drawer-product-title"
              className="truncate text-base font-extrabold leading-tight text-gray-900"
              title={item.skuName || item.productName || item.skuCode}
            >
              {item.skuName || item.productName || item.skuCode}
            </h2>
            {item.productName && item.productName !== item.skuName && (
              <span className="truncate text-xs font-medium text-gray-400" title={item.productName}>
                (상품명: {item.productName})
              </span>
            )}
            {item.supplierName && (
              <span className="truncate text-xs font-medium text-gray-500" title={`공급사: ${item.supplierName}`}>
                (공급사: {item.supplierName})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 우측: 카테고리 태그 및 기준 시각 가로 배치 */}
      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden flex-col items-end gap-1 text-right sm:flex">
          {getCategoryPathLabel(item) && (
            <div className="inline-flex max-w-[320px] items-center gap-1.5 rounded-lg border border-gray-200/80 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600">
              <span className="shrink-0 font-medium text-gray-400">카테고리</span>
              <span className="truncate font-semibold text-gray-800" title={getCategoryPathLabel(item)}>
                {getCategoryPathLabel(item)}
              </span>
            </div>
          )}
          <span className="text-[10px] tabular-nums text-gray-400">기준 시각: {formatDateTime(item.updatedAt)}</span>
        </div>

        {/* 스크린리더 및 접근성/테스트용 (시각적으로는 좌측 판매처 리스트가 담당) */}
        <select
          id="inventory-sales-point-select"
          aria-label="상세 판매처 선택"
          value={selectedSalesPointCode || ''}
          onChange={(event) => onSelectSalesPoint?.(event.target.value)}
          className="sr-only"
        >
          {allSalesPoints.map((point) => (
            <option key={point.salesPointCode} value={point.salesPointCode}>
              {point.salesPointName} ({point.salesPointCode})
            </option>
          ))}
          {(unassignedInventory?.hasStock ||
            unassignedInventory?.currentQuantity != null ||
            unassignedInventory?.availableQuantity != null ||
            unassignedInventory?.reservedQuantity != null) && <option value="UNASSIGNED">물류센터 미할당</option>}
        </select>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="상세 드로어 닫기"
          className="flex size-9 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-gray-400 shadow-2xs transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <CloseCircle size={20} />
        </button>
      </div>
      <ImageLightbox image={lightboxImage} onClose={handleImageClose} />
    </header>
  );
}
