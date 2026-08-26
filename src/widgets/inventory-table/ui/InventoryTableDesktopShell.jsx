import { Skeleton } from '@/shared/ui/Skeleton.jsx';
import { SortHeaderButton } from './SortHeaderButton.jsx';

export function InventoryTableDesktopShell({
  children,
  sort = 'updatedAt,desc',
  isFetching = false,
  isLoading = false,
  maxSelection = 5,
  isAllSelected = false,
  isSomeSelected = false,
  hasSelection = false,
  selectDisabled = false,
  onSelectAll,
  onSortChange,
}) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full min-w-[1080px] table-fixed text-left text-sm" aria-busy={isFetching || undefined}>
        <colgroup>
          <col className="w-[4%]" />
          <col className="w-[34%]" />
          <col className="w-[18%]" />
          <col className="w-[6%]" />
          <col className="w-[8%]" />
          <col className="w-[9%]" />
          <col className="w-[13%]" />
          <col className="w-[8%]" />
        </colgroup>
        <thead className="border-b border-[var(--border)] bg-[#F8F9FA] text-[11px] font-bold tracking-wider text-gray-500 uppercase">
          <tr>
            <th scope="col" className="min-w-[52px] py-3.5 pl-3 pr-2 text-left">
              {isLoading ? (
                <Skeleton className="block size-4 rounded border border-gray-200 bg-gray-100 motion-reduce:animate-none" />
              ) : (
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  disabled={selectDisabled}
                  ref={(element) => {
                    if (element) element.indeterminate = isSomeSelected;
                  }}
                  onChange={onSelectAll}
                  aria-label={`현재 페이지 항목 최대 ${maxSelection}개 선택 토글`}
                  title={
                    selectDisabled
                      ? '재고 조회가 끝난 후 선택할 수 있습니다'
                      : isAllSelected || isSomeSelected || hasSelection
                        ? '일괄 선택 해제'
                        : `현재 페이지 항목 최대 ${maxSelection}개 선택`
                  }
                  className="size-4 cursor-pointer rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
                />
              )}
            </th>
            <th scope="col" className="min-w-[280px] pl-4 pr-3 py-3.5">
              SKU 및 상품 정보
            </th>
            <th scope="col" className="min-w-[170px] px-3 py-3.5">
              판매처
            </th>
            <th scope="col" className="min-w-[60px] px-2.5 py-3.5">
              보관유형
            </th>
            <SortableColumn
              label="현재고"
              field="currentQuantity"
              sort={sort}
              isLoading={isLoading}
              onSortChange={onSortChange}
              className="min-w-[70px] px-3 py-3.5 text-right"
              align="right"
            />
            <SortableColumn
              label="가용수량"
              field="availableQuantity"
              sort={sort}
              isLoading={isLoading}
              onSortChange={onSortChange}
              className="min-w-[80px] px-3 py-3.5 text-right"
              align="right"
            />
            <SortableColumn
              label="최고 위험도"
              field="riskGrade"
              sort={sort}
              isLoading={isLoading}
              onSortChange={onSortChange}
              className="min-w-[140px] px-3 py-3.5 text-center"
              align="center"
            />
            <SortableColumn
              label="소비기한"
              field="nearestExpiryDays"
              sort={sort}
              isLoading={isLoading}
              onSortChange={onSortChange}
              className="min-w-[75px] px-3 py-3.5 text-center"
              align="center"
            />
          </tr>
        </thead>
        {children}
      </table>
    </div>
  );
}

function SortableColumn({ label, field, sort, isLoading, onSortChange, className, align }) {
  return (
    <th scope="col" className={className}>
      {isLoading ? (
        label
      ) : (
        <div className={align === 'right' ? 'flex justify-end' : 'flex justify-center'}>
          <SortHeaderButton label={label} field={field} currentSort={sort} onSortChange={onSortChange} align={align} />
        </div>
      )}
    </th>
  );
}
