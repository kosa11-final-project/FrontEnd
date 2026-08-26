import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Refresh } from 'reicon-react';
import { getStrategyExecutions } from '@/entities/strategy';
import {
  defaultStrategyExecutionFilters,
  parseStrategyExecutionPage,
  STRATEGY_EXECUTION_PAGE_SIZE,
  StrategyExecutionFilters,
  toStrategyExecutionQueryParams,
} from '@/features/strategy-execution-filter';
import { Button, Icon, StateView } from '@/shared/ui';
import {
  StrategyExecutionCard,
  StrategyExecutionPagination,
  StrategyExecutionSummary,
} from '@/widgets/strategy-execution';
import { ExecutionListSkeleton } from './ui/ExecutionListSkeleton.jsx';

export function ExecutionPageShell({ children }) {
  return <main className="page-shell">{children}</main>;
}

export function StrategyExecutionListContent({
  strategies = [],
  filters = defaultStrategyExecutionFilters,
  pagination = {
    page: 1,
    size: STRATEGY_EXECUTION_PAGE_SIZE,
    totalElements: strategies.length,
    totalPages: 1,
  },
  isFetching = false,
  onFiltersChange,
  onPageChange,
}) {
  return (
    <ExecutionPageShell>
      <div className="space-y-4">
        <section
          aria-label="전체 성과 동기화"
          className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <strong className="text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
              전체 전략 성과 동기화
            </strong>
            <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
              검색 결과 전체 {pagination.totalElements}건의 성과 동기화 기능은 백엔드 API 연동 후 제공됩니다.
            </p>
          </div>
          <Button type="button" disabled title="동기화 API 준비 중">
            <Icon icon={Refresh} size={16} aria-hidden="true" />
            성과 동기화 API 준비 중
          </Button>
        </section>
        <StrategyExecutionSummary strategies={strategies} />
        <StrategyExecutionFilters filters={filters} resultCount={pagination.totalElements} onChange={onFiltersChange} />
        {isFetching ? (
          <p className="sr-only" aria-live="polite">
            전략 실행 목록을 업데이트하고 있습니다.
          </p>
        ) : null}
        {strategies.length ? (
          <>
            <section aria-label="전략 실행 목록" className="space-y-4" aria-busy={isFetching}>
              {strategies.map((strategy) => (
                <StrategyExecutionCard key={strategy.id} strategy={strategy} />
              ))}
            </section>
            <StrategyExecutionPagination {...pagination} onPageChange={onPageChange} />
          </>
        ) : (
          <StateView
            state="empty"
            title="조건에 맞는 실행 전략이 없습니다."
            description="검색어나 상태 필터를 변경해 보세요."
            actionLabel="필터 초기화"
            onAction={() => onFiltersChange(defaultStrategyExecutionFilters)}
          />
        )}
      </div>
    </ExecutionPageShell>
  );
}

export default function ExecutionListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(defaultStrategyExecutionFilters);
  const requestedPage = parseStrategyExecutionPage(searchParams);
  const queryParams = useMemo(() => toStrategyExecutionQueryParams(filters, requestedPage), [filters, requestedPage]);
  const query = useQuery({
    queryKey: ['strategy-executions', queryParams],
    queryFn: ({ signal }) => getStrategyExecutions(queryParams, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  useEffect(() => {
    const rawPage = searchParams.get('page');
    if (rawPage === null || rawPage === String(requestedPage)) return;
    const next = new URLSearchParams(searchParams);
    if (requestedPage === 1) next.delete('page');
    else next.set('page', String(requestedPage));
    setSearchParams(next, { replace: true });
  }, [requestedPage, searchParams, setSearchParams]);

  useEffect(() => {
    if (!query.data || query.isPlaceholderData) return;
    const safePage = Math.min(Math.max(requestedPage, 1), query.data.totalPages);
    if (safePage === requestedPage) return;
    const next = new URLSearchParams(searchParams);
    if (safePage === 1) next.delete('page');
    else next.set('page', String(safePage));
    setSearchParams(next, { replace: true });
  }, [query.data, query.isPlaceholderData, requestedPage, searchParams, setSearchParams]);

  function changeFilters(nextFilters) {
    setFilters(nextFilters);
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function changePage(page) {
    const next = new URLSearchParams(searchParams);
    if (page <= 1) next.delete('page');
    else next.set('page', String(page));
    setSearchParams(next);
  }

  if (query.isPending)
    return (
      <ExecutionPageShell>
        <ExecutionListSkeleton />
      </ExecutionPageShell>
    );
  if (query.isError)
    return (
      <ExecutionPageShell>
        <StateView state="error" actionLabel="다시 시도" onAction={() => query.refetch()} />
      </ExecutionPageShell>
    );
  return (
    <StrategyExecutionListContent
      strategies={query.data.items}
      filters={filters}
      pagination={query.data}
      isFetching={query.isFetching}
      onFiltersChange={changeFilters}
      onPageChange={changePage}
    />
  );
}
