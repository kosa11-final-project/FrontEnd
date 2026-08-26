import { ChevronLeft, ChevronRight } from 'reicon-react';
import { formatNumber } from '@/shared/lib/format';
import { Icon } from '@/shared/ui';

export function getStrategyExecutionPaginationRange(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, 'dots-right', totalPages];
  if (currentPage >= totalPages - 3) {
    return [1, 'dots-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, 'dots-left', currentPage - 1, currentPage, currentPage + 1, 'dots-right', totalPages];
}

export function StrategyExecutionPagination({ page, size, totalElements, totalPages, onPageChange }) {
  if (totalElements <= 0) return null;

  const start = (page - 1) * size + 1;
  const end = Math.min(page * size, totalElements);
  const range = getStrategyExecutionPaginationRange(page, totalPages);

  return (
    <footer className="grid grid-cols-1 items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <p className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
        총 <strong className="text-[color:var(--text-heading)]">{formatNumber(totalElements)}</strong>건 중{' '}
        <strong className="text-[color:var(--text-heading)]">
          {formatNumber(start)}–{formatNumber(end)}
        </strong>
        건 표시
      </p>

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="전략 실행 목록 페이지 이동">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="이전 페이지"
            className="grid size-9 place-items-center rounded-lg border border-[var(--border)] text-[color:var(--text-body)] transition-colors hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon icon={ChevronLeft} size={16} aria-hidden="true" />
          </button>

          {range.map((item) =>
            typeof item === 'string' ? (
              <span
                key={item}
                className="grid size-9 place-items-center text-[color:var(--text-muted)]"
                aria-hidden="true"
              >
                ···
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`${item}페이지`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
                className={`grid size-9 place-items-center rounded-lg text-[length:var(--font-size-meta)] font-semibold transition-colors ${
                  item === page
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[color:var(--text-body)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="다음 페이지"
            className="grid size-9 place-items-center rounded-lg border border-[var(--border)] text-[color:var(--text-body)] transition-colors hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon icon={ChevronRight} size={16} aria-hidden="true" />
          </button>
        </nav>
      ) : (
        <span aria-hidden="true" />
      )}

      <span className="text-center text-[length:var(--font-size-meta)] tabular-nums text-[color:var(--text-muted)] sm:text-right">
        {page} / {totalPages} 페이지
      </span>
    </footer>
  );
}
