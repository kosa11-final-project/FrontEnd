import { DocumentText } from 'reicon-react';
import { formatNumber } from '@/shared/lib/format';
import { RESULT_STATE } from '@/entities/inventory';
import { Button, Icon, StateView } from '@/shared/ui';
import { InventoryTableDesktop } from './InventoryTableDesktop.jsx';
import { InventoryTableMobile } from './InventoryTableMobile.jsx';
import { InventoryPagination } from './InventoryPagination.jsx';

export function InventoryTable({
  items = [],
  totalCount = 0,
  page = 1,
  size = 20,
  sort = 'updatedAt,desc',
  totalPages = 1,
  selectedItem = null,
  selectedSkuCodes = [],
  onToggleSelectSku,
  onSelectAllSkus,
  onClearSelectedSkus,
  onGenerateStrategy,
  maxSelection = 5,
  resultState = RESULT_STATE.HAS_DATA,
  isLoading = false,
  isError = false,
  onRetry,
  onPageChange,
  onSizeChange,
  onSortChange,
  onResetFilters,
  onRowClick,
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-[#F3F4F6]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-12 shadow-xs">
        <StateView
          state="error"
          title="재고 데이터를 불러오지 못했습니다"
          description="서버와의 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
          actionLabel="다시 조회"
          onAction={onRetry || (() => onPageChange?.(page))}
        />
      </div>
    );
  }

  if (resultState === RESULT_STATE.FILTER_EMPTY || items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-12 shadow-xs">
        <StateView
          state="empty"
          title={resultState === RESULT_STATE.FILTER_EMPTY ? '일치하는 재고가 없습니다' : '등록된 재고가 없습니다'}
          description={
            resultState === RESULT_STATE.FILTER_EMPTY
              ? '설정하신 검색어나 필터 조건에 맞는 재고가 없습니다. 조건을 변경해 보세요.'
              : '현재 시스템에 등록된 통합 재고 데이터가 존재하지 않습니다.'
          }
          actionLabel={resultState === RESULT_STATE.FILTER_EMPTY ? '필터 초기화' : undefined}
          onAction={resultState === RESULT_STATE.FILTER_EMPTY ? onResetFilters : undefined}
        />
      </div>
    );
  }

  const startIdx = totalCount > 0 ? (page - 1) * size + 1 : 0;
  const endIdx = Math.min(page * size, totalCount);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-xs">
      {/* 표 상단 메타 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-6 py-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-bold text-gray-900">통합 재고 현황 목록</span>
          <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-semibold text-gray-700 tabular-nums">
            총 {formatNumber(totalCount)}건
          </span>
          <span className="text-xs text-gray-500 tabular-nums">
            {startIdx} - {endIdx}건 표시 중
          </span>
          {selectedSkuCodes.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/30 bg-[#F4FAF6] px-2.5 py-0.5 text-xs font-bold text-[color:var(--primary-strong)]">
              <span>
                {selectedSkuCodes.length}/{maxSelection}개 선택됨
              </span>
              {onClearSelectedSkus && (
                <button
                  type="button"
                  onClick={onClearSelectedSkus}
                  className="ml-0.5 text-[11px] font-medium text-gray-400 hover:text-gray-700 underline cursor-pointer"
                >
                  선택 해제
                </button>
              )}
            </span>
          )}
          <span className="text-xs text-gray-400">
            (체크박스로 최대 {maxSelection}개 선택 또는 행 클릭 시 상세 드로어 열림)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" size="sm" disabled={selectedSkuCodes.length === 0} onClick={onGenerateStrategy}>
            <Icon icon={DocumentText} size={15} aria-hidden="true" /> AI 전략 생성
          </Button>
        </div>
      </div>

      {/* 1. 데스크톱 테이블 (lg 이상) */}
      <InventoryTableDesktop
        items={items}
        sort={sort}
        selectedItem={selectedItem}
        selectedSkuCodes={selectedSkuCodes}
        onToggleSelectSku={onToggleSelectSku}
        onSelectAllSkus={onSelectAllSkus}
        maxSelection={maxSelection}
        onSortChange={onSortChange}
        onRowClick={onRowClick}
      />

      {/* 2. 모바일/태블릿 반응형 카드 뷰 (lg 미만) */}
      <InventoryTableMobile
        items={items}
        selectedItem={selectedItem}
        selectedSkuCodes={selectedSkuCodes}
        onToggleSelectSku={onToggleSelectSku}
        maxSelection={maxSelection}
        onRowClick={onRowClick}
      />

      {/* 3. 하단 페이지네이션 및 단위 선택 */}
      <InventoryPagination
        page={page}
        size={size}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onSizeChange={onSizeChange}
      />
    </div>
  );
}
