import { formatNumber } from '@/shared/lib/format';

export function getPaginationRange(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'dots', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'dots', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'dots-left', currentPage - 1, currentPage, currentPage + 1, 'dots-right', totalPages];
}

export function InventoryPagination({
  page = 1,
  size = 20,
  totalCount = 0,
  totalPages = 1,
  onPageChange,
  onSizeChange,
}) {
  const startIdx = totalCount > 0 ? (page - 1) * size + 1 : 0;
  const endIdx = Math.min(page * size, totalCount);
  const paginationRange = getPaginationRange(page, totalPages);

  return (
    <div className="inventory-pagination flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--border)] bg-white px-6 py-3.5">
      {/* 좌측: 건수 표시 */}
      <div className="text-xs text-gray-500 tabular-nums">
        총 <strong className="text-gray-900 font-semibold">{formatNumber(totalCount)}</strong>건 중 {startIdx} -{' '}
        {endIdx}건 표시
      </div>

      {/* 중앙: 페이지 번호 내비게이션 */}
      <nav className="flex items-center gap-1.5" aria-label="페이지 내비게이션">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          이전
        </button>

        <div className="flex items-center gap-1">
          {paginationRange.map((item, idx) => {
            if (typeof item === 'string') {
              return (
                <span
                  key={`${item}-${idx}`}
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center text-xs text-gray-400 font-bold select-none"
                >
                  ···
                </span>
              );
            }

            const isCurrent = item === page;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange?.(item)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  isCurrent ? 'bg-[var(--primary)] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
          className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          다음
        </button>
      </nav>

      {/* 우측: 한 번에 보기 단위 (20, 50, 100개) */}
      <div className="flex items-center gap-2">
        <label htmlFor="inventory-page-size-select" className="text-xs font-medium text-gray-500 whitespace-nowrap">
          보기:
        </label>
        <select
          id="inventory-page-size-select"
          value={size}
          onChange={(e) => onSizeChange?.(Number(e.target.value))}
          className="h-8 rounded-lg border border-[var(--border)] bg-white px-2.5 text-xs font-medium text-gray-700 transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
        >
          <option value={20}>20개씩 보기</option>
          <option value={50}>50개씩 보기</option>
          <option value={100}>100개씩 보기</option>
        </select>
      </div>
    </div>
  );
}
