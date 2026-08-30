import { Building, Shop, ShoppingCart, Store } from 'reicon-react';
import { formatDate, formatDaysRemaining, formatQuantity } from '@/shared/lib/format';
import { InventoryStatusBadge } from '@/entities/inventory/ui/InventoryStatusBadge.jsx';
import { getAssessmentStatusLabel } from '@/entities/risk/model/risk.js';
import { CHANNEL_BADGE_STYLES, STORAGE_BADGE_STYLES } from './constants.js';
import { InventoryTableDesktopBodySkeleton } from './InventoryTableSkeleton.jsx';
import { InventoryTableDesktopShell } from './InventoryTableDesktopShell.jsx';
import { LazyThumbnailImage } from './LazyThumbnailImage.jsx';

function categorizeSalesPoints(salesPoints = []) {
  const hyundaiDeptStores = [];
  const onlineGreeting = [];
  const ecommerceStores = [];
  const hmartStores = [];

  for (let i = 0; i < salesPoints.length; i++) {
    const sp = salesPoints[i];

    switch (sp.channelType) {
      case 'HYUNDAI_DEPT':
        hyundaiDeptStores.push(sp);
        break;
      case 'GREETING':
        onlineGreeting.push(sp);
        break;
      case 'ECOMMERCE':
        ecommerceStores.push(sp);
        break;
      case 'HMART':
        hmartStores.push(sp);
        break;
    }
  }

  return {
    hyundaiDeptStores,
    onlineGreeting,
    ecommerceStores,
    hmartStores,
  };
}

export function InventoryTableDesktop({
  items = [],
  sort = 'updatedAt,desc',
  selectedItem = null,
  selectedSkuCodes = [],
  onToggleSelectSku,
  onSelectAllSkus,
  maxSelection = 5,
  onSortChange,
  onRowClick,
  onImageClick,
  isFetching = false,
  showBodySkeleton = false,
}) {
  const currentItemSkuCodes = items.map((i) => i.skuCode).filter(Boolean);
  const selectedInCurrentPage = currentItemSkuCodes.filter((code) => selectedSkuCodes.includes(code));
  const isAllSelected =
    currentItemSkuCodes.length > 0 &&
    selectedInCurrentPage.length === Math.min(currentItemSkuCodes.length, maxSelection);
  const isSomeSelected = selectedInCurrentPage.length > 0 && !isAllSelected;

  const handleHeaderCheckboxChange = () => {
    if (showBodySkeleton) return;

    if (isAllSelected || isSomeSelected || selectedSkuCodes.length > 0) {
      onSelectAllSkus?.([]);
    } else {
      onSelectAllSkus?.(currentItemSkuCodes.slice(0, maxSelection));
    }
  };

  return (
    <InventoryTableDesktopShell
      sort={sort}
      isFetching={isFetching}
      maxSelection={maxSelection}
      isAllSelected={isAllSelected}
      isSomeSelected={isSomeSelected}
      hasSelection={selectedSkuCodes.length > 0}
      selectDisabled={showBodySkeleton}
      onSelectAll={handleHeaderCheckboxChange}
      onSortChange={onSortChange}
    >
      {showBodySkeleton ? (
        <InventoryTableDesktopBodySkeleton rowCount={Math.max(items.length, 1)} />
      ) : (
        <tbody className="divide-y divide-[#F3F4F6]">
          {items.map((item, index) => {
            const isSelected = selectedItem?.rowId === item.rowId;
            const isSelectedSku = selectedSkuCodes.includes(item.skuCode);
            const isMaxReached = selectedSkuCodes.length >= maxSelection;
            const storageBadgeClass = STORAGE_BADGE_STYLES[item.storageType] || 'bg-gray-100 text-gray-700';

            // 판매처 지점 목록 및 채널/위험도 분류 (1회 순회)
            const salesPoints = item.salesPoints || [];
            const { hyundaiDeptStores, onlineGreeting, ecommerceStores, hmartStores } =
              categorizeSalesPoints(salesPoints);
            const skuLabel = item.skuName || item.productName || 'SKU명 미지정';
            const categoryLeafName = item.category?.leaf?.name || item.categoryName || '';
            const categoryPathLabel = item.categoryPathLabel || categoryLeafName;
            const ownerSalesPointCount = item.ownerSalesPointCount ?? salesPoints.length;
            const unassignedInventory = item.unassignedInventory || {};
            const hasSafetyShortage =
              item.shortageYn === 'Y' ||
              unassignedInventory.shortageYn === 'Y' ||
              salesPoints.some((point) => point.shortageYn === 'Y');

            return (
              <tr
                key={item.rowId}
                tabIndex={0}
                aria-label={`${item.skuCode} ${skuLabel} ${ownerSalesPointCount}개 판매처 재고, 가용수량 ${formatQuantity(item.availableQuantity)}, 30일 예상 폐기 ${formatQuantity(item.expectedDisposalQuantity)}, 물류센터 미할당 재고 상세 보기`}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick?.(item);
                  }
                }}
                className={`group h-[76px] cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 ${
                  isSelected || isSelectedSku
                    ? 'bg-[#F4FAF6] border-l-4 border-l-[var(--primary)] shadow-2xs'
                    : 'hover:bg-[#F8FDF9] border-l-4 border-l-transparent'
                }`}
              >
                {/* 0. 체크박스 (최대 5개 다중 선택) */}
                <td
                  className="text-left pl-3 pr-2 py-4 align-middle"
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
                </td>

                {/* 1. SKU 정보 및 소분류 */}
                <td className="pl-4 pr-3 py-4">
                  <div className="flex items-center gap-3.5">
                    <LazyThumbnailImage
                      src={item.imageUrl}
                      alt={skuLabel}
                      width={48}
                      height={48}
                      className="size-12"
                      item={item}
                      onImageClick={onImageClick}
                      priority={index < 2}
                    />
                    <div className="flex flex-col min-w-0">
                      {/* 1행: SKU 규격명 (메인 식별자) */}
                      <span
                        className={`truncate text-sm font-semibold transition-colors ${
                          isSelected
                            ? 'text-[color:var(--primary-strong)]'
                            : 'text-gray-900 group-hover:text-[color:var(--primary)]'
                        }`}
                        title={skuLabel}
                      >
                        {skuLabel}
                      </span>

                      {/* 2행: SKU 코드 + 대/중/소 카테고리 계층 경로 */}
                      <div className="mt-1 flex items-center gap-1.5 min-w-0 text-xs text-gray-500">
                        <span className="shrink-0 rounded bg-[#F3F4F6] px-1.5 py-0.2 text-[11px] font-mono font-medium text-gray-600">
                          {item.skuCode || 'SKU 미지정'}
                        </span>
                        {categoryPathLabel && (
                          <span
                            className="truncate text-[11px] font-normal text-gray-500"
                            title={categoryPathLabel}
                            aria-label={`카테고리: ${categoryPathLabel}`}
                          >
                            {categoryPathLabel}
                          </span>
                        )}
                      </div>
                      {item.supplierName && (
                        <span
                          className="mt-1 block truncate text-[11px] font-medium text-gray-500"
                          title={`공급사: ${item.supplierName}`}
                        >
                          공급사: {item.supplierName}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* 2. 판매처 요약 */}
                <td className="px-3 py-4">
                  <div className="flex flex-wrap items-center gap-1.5 w-full">
                    {hyundaiDeptStores.length > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${CHANNEL_BADGE_STYLES.HYUNDAI_DEPT}`}
                      >
                        <Building size={11} />
                        백화점 {hyundaiDeptStores.length}개점
                      </span>
                    )}
                    {onlineGreeting.length > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${CHANNEL_BADGE_STYLES.GREETING}`}
                      >
                        <ShoppingCart size={11} />
                        그리팅몰
                      </span>
                    )}
                    {ecommerceStores.length > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${CHANNEL_BADGE_STYLES.ECOMMERCE}`}
                      >
                        <Shop size={11} />
                        모두의맛집
                      </span>
                    )}
                    {hmartStores.length > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${CHANNEL_BADGE_STYLES.HMART}`}
                      >
                        <Store size={11} />
                        직영점
                      </span>
                    )}
                    {salesPoints.length === 0 && <span className="text-xs text-gray-400">판매처 정보 없음</span>}
                    {salesPoints.length > 0 && (
                      <span className="text-[10px] font-medium text-gray-500">
                        {ownerSalesPointCount > salesPoints.length
                          ? `${salesPoints.length}개 표시 / 전체 ${ownerSalesPointCount}개`
                          : `전체 ${ownerSalesPointCount}개`}
                      </span>
                    )}
                  </div>
                </td>

                {/* 3. 보관유형 */}
                <td className="px-2.5 py-4">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${storageBadgeClass}`}
                  >
                    {item.storageName}
                  </span>
                </td>

                {/* 4. 총 현재고 */}
                <td className="px-3 py-4 text-right">
                  <span className="font-semibold text-gray-800 tabular-nums">
                    {formatQuantity(item.currentQuantity)}
                  </span>
                </td>

                {/* 5. 가용수량 */}
                <td className="px-3 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-base font-bold text-[color:var(--primary)] tabular-nums">
                      {formatQuantity(item.availableQuantity)}
                    </span>
                    <span className="text-[10px] text-gray-400 tabular-nums">
                      예약 {formatQuantity(item.reservedQuantity)}
                    </span>
                  </div>
                </td>

                {/* 6. 30일 예상 폐기수량 */}
                <td
                  className="px-3 py-4 text-right"
                  title="소비기한 또는 판매중지일이 30일 이내인 재고 중 예상 판매량을 제외하고 남는 수량"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-amber-700 tabular-nums">
                      {formatQuantity(item.expectedDisposalQuantity)}
                    </span>
                    <span className="text-[10px] text-gray-400">향후 30일</span>
                  </div>
                </td>

                {/* 7. 최고 위험도 */}
                <td className="px-3 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <InventoryStatusBadge status={item.riskGrade} assessmentStatus={item.assessmentStatus} />
                    {item.assessmentStatus && item.assessmentStatus !== 'ASSESSED' && (
                      <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap">
                        {getAssessmentStatusLabel(item.assessmentStatus)}
                      </span>
                    )}
                    {item.inventoryFactState && item.inventoryFactState !== 'AVAILABLE' && (
                      <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap">
                        {item.inventoryFactLabel || '재고 상태 확인 필요'}
                      </span>
                    )}
                    {hasSafetyShortage && (
                      <span className="text-[10px] font-medium text-amber-700 whitespace-nowrap">
                        재고 부족 상품 포함
                      </span>
                    )}
                  </div>
                </td>

                {/* 8. 소비기한 */}
                <td className="px-5 py-4 text-center tabular-nums">
                  {item.nearestExpiryDays !== null ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-bold ${
                          item.nearestExpiryDays <= 7
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : item.nearestExpiryDays <= 30
                              ? 'bg-amber-100 text-amber-950 border border-amber-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {formatDaysRemaining(item.nearestExpiryDays)}
                      </span>
                      {item.nearestExpiryDate && (
                        <span className="text-[10px] font-medium text-gray-500">
                          {formatDate(item.nearestExpiryDate)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      )}
    </InventoryTableDesktopShell>
  );
}
