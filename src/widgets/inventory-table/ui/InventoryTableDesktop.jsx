import { Building, ChevronRight, Shop, ShoppingCart, Store } from 'reicon-react';
import { formatDaysRemaining, formatQuantity } from '@/shared/lib/format';
import { InventoryStatusBadge } from '@/entities/inventory';
import { SortHeaderButton } from './SortHeaderButton.jsx';
import { CHANNEL_BADGE_STYLES, STORAGE_BADGE_STYLES, ASSESSMENT_STATUS_LABELS } from './constants.js';

function categorizeSalesPoints(salesPoints = []) {
  let dangerPoints = 0;
  let cautionPoints = 0;
  const hyundaiDeptStores = [];
  const onlineGreeting = [];
  const ecommerceStores = [];
  const hmartStores = [];

  for (let i = 0; i < salesPoints.length; i++) {
    const sp = salesPoints[i];
    if (sp.riskGrade === 'DANGER') dangerPoints++;
    else if (sp.riskGrade === 'CAUTION') cautionPoints++;

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
    dangerPoints,
    cautionPoints,
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
}) {
  const currentItemSkuCodes = items.map((i) => i.skuCode).filter(Boolean);
  const selectedInCurrentPage = currentItemSkuCodes.filter((code) => selectedSkuCodes.includes(code));
  const isAllSelected =
    currentItemSkuCodes.length > 0 &&
    selectedInCurrentPage.length === Math.min(currentItemSkuCodes.length, maxSelection);
  const isSomeSelected = selectedInCurrentPage.length > 0 && !isAllSelected;

  const handleHeaderCheckboxChange = () => {
    if (isAllSelected || isSomeSelected || selectedSkuCodes.length > 0) {
      onSelectAllSkus?.([]);
    } else {
      onSelectAllSkus?.(currentItemSkuCodes.slice(0, maxSelection));
    }
  };

  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
        <thead className="border-b border-[var(--border)] bg-[#F8F9FA] text-[11px] font-bold tracking-wider text-gray-500 uppercase">
          <tr>
            <th scope="col" className="w-11 min-w-[44px] px-3 py-3.5 text-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isSomeSelected;
                }}
                onChange={handleHeaderCheckboxChange}
                aria-label={`현재 페이지 항목 최대 ${maxSelection}개 선택 토글`}
                title={
                  isAllSelected || isSomeSelected || selectedSkuCodes.length > 0
                    ? '일괄 선택 해제'
                    : `현재 페이지 항목 최대 ${maxSelection}개 선택`
                }
                className="size-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
              />
            </th>
            <th scope="col" className="w-[26%] min-w-[240px] px-4 py-3.5">
              SKU 및 상품 정보
            </th>
            <th scope="col" className="w-[18%] min-w-[180px] px-4 py-3.5">
              판매처
            </th>
            <th scope="col" className="w-[8%] min-w-[80px] px-3 py-3.5 text-right">
              미할당 재고
            </th>
            <th scope="col" className="w-[7%] min-w-[75px] px-3 py-3.5">
              보관유형
            </th>
            <th scope="col" className="w-[8%] min-w-[80px] px-4 py-3.5 text-right">
              <div className="flex justify-end">
                <SortHeaderButton
                  label="현재고"
                  field="currentQuantity"
                  currentSort={sort}
                  onSortChange={onSortChange}
                  align="right"
                />
              </div>
            </th>
            <th scope="col" className="w-[9%] min-w-[90px] px-4 py-3.5 text-right">
              <div className="flex justify-end">
                <SortHeaderButton
                  label="가용수량"
                  field="availableQuantity"
                  currentSort={sort}
                  onSortChange={onSortChange}
                  align="right"
                />
              </div>
            </th>
            <th scope="col" className="w-[10%] min-w-[100px] px-4 py-3.5 text-center">
              <div className="flex justify-center">
                <SortHeaderButton
                  label="종합 위험도"
                  field="riskGrade"
                  currentSort={sort}
                  onSortChange={onSortChange}
                  align="center"
                />
              </div>
            </th>
            <th scope="col" className="w-[8%] min-w-[80px] px-4 py-3.5 text-center">
              <div className="flex justify-center">
                <SortHeaderButton
                  label="소비기한"
                  field="nearestExpiryDays"
                  currentSort={sort}
                  onSortChange={onSortChange}
                  align="center"
                />
              </div>
            </th>
            <th scope="col" className="w-10 min-w-[40px] px-2 py-3.5 text-center"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F3F4F6]">
          {items.map((item) => {
            const isSelected = selectedItem?.rowId === item.rowId;
            const isSelectedSku = selectedSkuCodes.includes(item.skuCode);
            const isMaxReached = selectedSkuCodes.length >= maxSelection;
            const storageBadgeClass = STORAGE_BADGE_STYLES[item.storageType] || 'bg-gray-100 text-gray-700';

            // 판매처 지점 목록 및 채널/위험도 분류 (1회 순회)
            const salesPoints = item.salesPoints || [];
            const { hyundaiDeptStores, onlineGreeting, ecommerceStores, hmartStores, dangerPoints, cautionPoints } =
              categorizeSalesPoints(salesPoints);
            const skuLabel = item.skuName || item.productName || 'SKU명 미지정';
            const categoryLeafName = item.category?.leaf?.name || item.categoryName || '';
            const categoryPathLabel = item.categoryPathLabel || categoryLeafName;
            const ownerSalesPointCount = item.ownerSalesPointCount ?? salesPoints.length;
            const unassignedInventory = item.unassignedInventory || {};
            const hasUnassignedInventory =
              unassignedInventory.hasStock ||
              unassignedInventory.currentQuantity != null ||
              unassignedInventory.availableQuantity != null ||
              unassignedInventory.reservedQuantity != null;

            return (
              <tr
                key={item.rowId}
                tabIndex={0}
                role="button"
                aria-label={`${item.skuCode} ${skuLabel} ${ownerSalesPointCount}개 판매처 재고, 물류센터 미할당 재고 상세 보기`}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick?.(item);
                  }
                }}
                className={`group cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 ${
                  isSelected || isSelectedSku
                    ? 'bg-[#F4FAF6] border-l-4 border-l-[var(--primary)] shadow-2xs'
                    : 'hover:bg-[#F8FDF9] border-l-4 border-l-transparent'
                }`}
              >
                {/* 0. 체크박스 (최대 5개 다중 선택) */}
                <td
                  className="w-11 min-w-[44px] px-3 py-4 text-center"
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
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3.5">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={skuLabel}
                        className="size-12 shrink-0 rounded-lg border border-[var(--border)] object-cover shadow-2xs transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[#F3F4F6] text-[11px] font-medium text-gray-400">
                        No Img
                      </div>
                    )}
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
                <td className="px-4 py-4">
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

                {/* 3. 미할당 재고 */}
                <td className="px-4 py-4 text-right">
                  {hasUnassignedInventory && unassignedInventory.currentQuantity != null ? (
                    <span className="font-semibold text-gray-800 tabular-nums">
                      {formatQuantity(unassignedInventory.currentQuantity)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>

                {/* 4. 보관유형 */}
                <td className="px-3 py-4">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${storageBadgeClass}`}
                  >
                    {item.storageName}
                  </span>
                </td>

                {/* 5. 총 현재고 */}
                <td className="px-4 py-4 text-right">
                  <span className="font-semibold text-gray-800 tabular-nums">
                    {formatQuantity(item.currentQuantity)}
                  </span>
                </td>

                {/* 6. 가용수량 */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-base font-bold text-[color:var(--primary)] tabular-nums">
                      {formatQuantity(item.availableQuantity)}
                    </span>
                    <span className="text-[10px] text-gray-400 tabular-nums">
                      예약 {formatQuantity(item.reservedQuantity)}
                    </span>
                  </div>
                </td>

                {/* 7. 종합 위험도 */}
                <td className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <InventoryStatusBadge status={item.riskGrade} />
                    {item.assessmentStatus && item.assessmentStatus !== 'ASSESSED' && (
                      <span className="text-[10px] font-medium text-gray-500">
                        {ASSESSMENT_STATUS_LABELS[item.assessmentStatus] || item.assessmentStatus}
                      </span>
                    )}
                    {(dangerPoints > 0 || cautionPoints > 0) && (
                      <span className="text-[10px] font-medium text-gray-500 tabular-nums">
                        {dangerPoints > 0 && (
                          <span className="text-[color:var(--danger)] font-bold">위험 {dangerPoints} </span>
                        )}
                        {cautionPoints > 0 && (
                          <span className="text-[color:var(--warning)] font-bold">주의 {cautionPoints}</span>
                        )}
                      </span>
                    )}
                    {item.inventoryFactState && item.inventoryFactState !== 'AVAILABLE' && (
                      <span className="text-[10px] font-medium text-gray-500">
                        {item.inventoryFactLabel || item.inventoryFactState}
                      </span>
                    )}
                  </div>
                </td>

                {/* 7. 소비기한 */}
                <td className="px-5 py-4 text-center tabular-nums">
                  {item.nearestExpiryDays !== null ? (
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                        item.nearestExpiryDays <= 7
                          ? 'bg-[#FEE4E2] text-[color:var(--danger)]'
                          : item.nearestExpiryDays <= 30
                            ? 'bg-[#FFF8E6] text-[#B45309]'
                            : 'bg-[#F3F4F6] text-gray-600'
                      }`}
                    >
                      {formatDaysRemaining(item.nearestExpiryDays)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>

                {/* 8. 상세 드로어 열기 버튼 */}
                <td className="px-3 py-4 text-center">
                  <span
                    className={`flex size-7 items-center justify-center rounded-lg transition-all ${
                      isSelected
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-700'
                    }`}
                  >
                    <ChevronRight size={16} />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
