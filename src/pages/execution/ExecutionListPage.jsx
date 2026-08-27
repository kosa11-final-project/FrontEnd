import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Activity, CheckCircle, Refresh } from 'reicon-react';
import {
  actionTypeMeta,
  getExecutionSummary,
  getStrategyExecutions,
  synchronizeStrategyPerformances,
} from '@/entities/strategy';
import { statisticsKeys } from '@/entities/statistics';
import {
  defaultStrategyExecutionFilters,
  parseStrategyExecutionPage,
  STRATEGY_EXECUTION_PAGE_SIZE,
  StrategyExecutionFilters,
  toStrategyExecutionQueryParams,
} from '@/features/strategy-execution-filter';
import { Button, Icon, StateView, toast } from '@/shared/ui';
import {
  StrategyExecutionCard,
  StrategyExecutionPagination,
  StrategyExecutionSummary,
} from '@/widgets/strategy-execution';
import { ExecutionListSkeleton } from './ui/ExecutionListSkeleton.jsx';

export function ExecutionPageShell({ children }) {
  return <main className="page-shell">{children}</main>;
}

function StrategySituationSummary({ strategies, filters, onFiltersChange }) {
  const summary = getExecutionSummary(strategies);
  const completedCount = strategies.filter((strategy) => strategy.status === 'COMPLETED').length;
  const attentionActions = strategies.flatMap((strategy) =>
    strategy.actions.filter((action) => ['PARTIAL', 'BLOCKED', 'FAILED'].includes(action.status)),
  );
  const attentionTypeCounts = attentionActions.reduce((counts, action) => {
    if (action.type) counts.set(action.type, (counts.get(action.type) ?? 0) + 1);
    return counts;
  }, new Map());
  const hasAttention = summary.attentionActionCount > 0;
  const hasInProgress = summary.inProgressActionCount > 0;
  const SummaryIcon = hasAttention ? AlertCircle : hasInProgress ? Activity : CheckCircle;

  const applyFilter = (nextFilter) => onFiltersChange({ ...filters, ...nextFilter });

  return (
    <section
      aria-label="현재 전략 관제 상황"
      className={
        hasAttention
          ? 'flex flex-col gap-3 rounded-[var(--radius-card)] border border-[color:color-mix(in_srgb,var(--warning)_55%,var(--border))] bg-[var(--warning-soft)] p-3 sm:flex-row sm:items-center sm:justify-between'
          : 'flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-3 sm:flex-row sm:items-center sm:justify-between'
      }
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={
            hasAttention
              ? 'grid size-8 shrink-0 place-items-center rounded-full bg-[var(--warning)] text-[color:var(--color-gray-900)]'
              : hasInProgress
                ? 'grid size-8 shrink-0 place-items-center rounded-full bg-[var(--info-soft)] text-[color:var(--info)]'
                : 'grid size-8 shrink-0 place-items-center rounded-full bg-[var(--good-soft)] text-[color:var(--good)]'
          }
          aria-hidden="true"
        >
          <Icon icon={SummaryIcon} size={17} />
        </span>
        <div className="min-w-0">
          <strong className="block text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
            {hasAttention
              ? `확인이 필요한 액션이 ${summary.attentionActionCount}건 있습니다.`
              : hasInProgress
                ? `현재 진행 중인 액션이 ${summary.inProgressActionCount}건 있습니다.`
                : '현재 실행 중이거나 확인이 필요한 액션이 없습니다.'}
          </strong>
          <p className="mt-0.5 text-[length:var(--font-size-body-sm)] text-[color:var(--text-body)]">
            {hasAttention || hasInProgress
              ? `현재 페이지의 전략 ${strategies.length}건을 기준으로 집계했습니다.`
              : `현재 페이지에서 완료 전략 ${completedCount}건을 확인할 수 있습니다.`}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {[...attentionTypeCounts].map(([type, count]) => (
          <Button
            key={type}
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => applyFilter({ actionType: type })}
          >
            {actionTypeMeta[type]?.shortLabel ?? '액션'} 확인 {count}건
          </Button>
        ))}
        {!hasAttention && hasInProgress ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => applyFilter({ strategyStatus: 'EXECUTING' })}
          >
            실행 중 전략 보기
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function StrategyPerformanceSyncControl({ isPending = false, onSync = () => {} }) {
  return (
    <section
      aria-label="전략 성과 동기화"
      className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <strong className="text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
          전략 성과 동기화
        </strong>
        <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          최신 판매·재고 데이터를 기준으로 실행 전략의 판매량, 매출, 기여이익과 잔여재고를 갱신합니다.
        </p>
      </div>
      <Button type="button" variant="secondary" size="md" onClick={onSync} disabled={isPending} aria-busy={isPending}>
        <Icon icon={Refresh} size={15} className={isPending ? 'animate-spin' : undefined} aria-hidden="true" />
        {isPending ? '성과 동기화 중' : '전략 성과 동기화'}
      </Button>
    </section>
  );
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
  isSyncing = false,
  onSync = () => {},
  onFiltersChange,
  onPageChange,
}) {
  return (
    <ExecutionPageShell>
      <div className="space-y-3">
        <StrategySituationSummary strategies={strategies} filters={filters} onFiltersChange={onFiltersChange} />
        <StrategyExecutionSummary strategies={strategies} />
        <StrategyExecutionFilters filters={filters} resultCount={pagination.totalElements} onChange={onFiltersChange} />
        <StrategyPerformanceSyncControl isPending={isSyncing} onSync={onSync} />
        {isFetching ? (
          <p className="sr-only" aria-live="polite">
            전략 실행 목록을 업데이트하고 있습니다.
          </p>
        ) : null}
        {strategies.length ? (
          <>
            <section aria-label="전략 실행 목록" className="space-y-2" aria-busy={isFetching}>
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
  const queryClient = useQueryClient();
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
  const syncMutation = useMutation({
    mutationFn: () => synchronizeStrategyPerformances(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['strategy-executions'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['strategy-execution'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: statisticsKeys.all, refetchType: 'all' });
      const warning = result?.warnings?.[0];
      toast({
        title: '전략 성과 동기화가 완료되었습니다.',
        description: warning || `${result?.processedStrategyCount ?? 0}개 전략의 성과를 갱신했습니다.`,
      });
    },
    onError: (error) => {
      toast({
        title: '전략 성과 동기화에 실패했습니다.',
        description: error?.message,
        variant: 'destructive',
      });
    },
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
      isSyncing={syncMutation.isPending}
      onSync={() => syncMutation.mutate()}
      onFiltersChange={changeFilters}
      onPageChange={changePage}
    />
  );
}
