import { Building, ChevronRight, Shop, ShoppingCart, Store } from 'reicon-react';
import { formatDaysRemaining, formatQuantity } from '@/shared/lib/format';
import { InventoryStatusBadge } from '@/entities/inventory';
import { SortHeaderButton } from './SortHeaderButton.jsx';
import { CHANNEL_BADGE_STYLES, STORAGE_BADGE_STYLES, ASSESSMENT_STATUS_LABELS } from './constants.js';

export function InventoryTableDesktop({
  items = [],
  sort = 'updatedAt,desc',
  selectedItem = null,
  onSortChange,
  onRowClick,
}) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--border)] bg-[#F8F9FA] text-[11px] font-bold tracking-wider text-gray-500 uppercase">
          <tr>
            <th scope="col" className="px-5 py-3.5">
              SKU 및 상품 정보
            </th>
            <th scope="col" className="px-4 py-3.5">
              소유 판매처 현황
            </th>
            <th scope="col" className="px-3 py-3.5">
              보관유형
            </th>
            <th scope="col" className="px-4 py-3.5 text-right">
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
            <th scope="col" className="px-4 py-3.5 text-right">
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
            <th scope="col" className="px-4 py-3.5 text-center">
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
            <th scope="col" className="px-5 py-3.5 text-center">
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
            <th scope="col" className="w-10 px-3 py-3.5 text-center"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F3F4F6]">
          {items.map((item) => {
            const isSelected = selectedItem?.rowId === item.rowId;
            const storageBadgeClass = STORAGE_BADGE_STYLES[item.storageType] || 'bg-gray-100 text-gray-700';

            // 판매처 지점 목록
            const salesPoints = item.salesPoints || [];
            const hyundaiDeptStores = salesPoints.filter((sp) => sp.channelType === 'HYUNDAI_DEPT');
            const onlineGreeting = salesPoints.filter((sp) => sp.channelType === 'GREETING');
            const ecommerceStores = salesPoints.filter((sp) => sp.channelType === 'ECOMMERCE');
            const hmartStores = salesPoints.filter((sp) => sp.channelType === 'HMART');

            // 위험 지점 카운트
            const dangerPoints = salesPoints.filter((sp) => sp.riskGrade === 'DANGER').length;
            const cautionPoints = salesPoints.filter((sp) => sp.riskGrade === 'CAUTION').length;
            const skuLabel = item.skuName || item.productName || 'SKU명 미지정';
            const categoryLeafName = item.category?.leaf?.name || item.categoryName || '';
            const categoryPathLabel = item.categoryPathLabel || categoryLeafName;
            const ownerSalesPointCount = item.ownerSalesPointCount ?? salesPoints.length;

            return (
              <tr
                key={item.rowId}
                tabIndex={0}
                role="button"
                aria-label={`${item.skuCode} ${skuLabel} ${ownerSalesPointCount}개 판매처 재고 상세 보기`}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick?.(item);
                  }
                }}
                className={`group cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 ${
                  isSelected
                    ? 'bg-[#F4FAF6] border-l-4 border-l-[var(--primary)] shadow-2xs'
                    : 'hover:bg-[#F8FDF9] border-l-4 border-l-transparent'
                }`}
              >
                {/* 1. SKU 정보 및 소분류 */}
                <td className="px-5 py-4">
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
                    </div>
                  </div>
                </td>

                {/* 2. 소유 판매처 현황 (채널별 요약 뱃지) */}
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-1.5 max-w-[280px]">
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
                        H마트
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
                <td className="px-3 py-4">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${storageBadgeClass}`}
                  >
                    {item.storageName}
                  </span>
                </td>

                {/* 4. 총 현재고 */}
                <td className="px-4 py-4 text-right">
                  <span className="font-semibold text-gray-800 tabular-nums">
                    {formatQuantity(item.currentQuantity)}
                  </span>
                </td>

                {/* 5. 가용수량 */}
                <td className="px-4 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-base font-bold text-[color:var(--primary)] tabular-nums">
                      {formatQuantity(item.availableQuantity)}
                    </span>
                    <span className="text-[10px] text-gray-400 tabular-nums">
                      예약 {formatQuantity(item.reservedQuantity)} · 안전 {formatQuantity(item.safetyQuantity)}
                    </span>
                  </div>
                </td>

                {/* 6. 종합 위험도 */}
                <td className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <InventoryStatusBadge status={item.riskGrade} />
                    {item.assessmentStatus && (
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
