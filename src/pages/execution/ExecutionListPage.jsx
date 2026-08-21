import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Refresh } from 'reicon-react';
import { filterStrategies, getStrategyExecutions } from '@/entities/strategy';
import { defaultStrategyExecutionFilters, StrategyExecutionFilters } from '@/features/strategy-execution-filter';
import { Button, Icon, StateView } from '@/shared/ui';
import { StrategyExecutionCard, StrategyExecutionSummary } from '@/widgets/strategy-execution';

export function ExecutionPageShell({ children }) {
  return <main className="page-shell">{children}</main>;
}

export function StrategyExecutionListContent({ initialStrategies = [] }) {
  const [filters, setFilters] = useState(defaultStrategyExecutionFilters);
  const strategies = initialStrategies;
  const filtered = useMemo(() => filterStrategies(strategies, filters), [strategies, filters]);

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
              전체 {strategies.length}건의 성과 동기화 기능은 백엔드 API 연동 후 제공됩니다.
            </p>
          </div>
          <Button type="button" disabled title="동기화 API 준비 중">
            <Icon icon={Refresh} size={16} aria-hidden="true" />
            성과 동기화 API 준비 중
          </Button>
        </section>
        <StrategyExecutionSummary strategies={strategies} />
        <StrategyExecutionFilters filters={filters} resultCount={filtered.length} onChange={setFilters} />
        {filtered.length ? (
          <section aria-label="전략 실행 목록" className="space-y-4">
            {filtered.map((strategy) => (
              <StrategyExecutionCard key={strategy.id} strategy={strategy} />
            ))}
          </section>
        ) : (
          <StateView
            state="empty"
            title="조건에 맞는 실행 전략이 없습니다."
            description="검색어나 상태 필터를 변경해 보세요."
            actionLabel="필터 초기화"
            onAction={() => setFilters(defaultStrategyExecutionFilters)}
          />
        )}
      </div>
    </ExecutionPageShell>
  );
}

export default function ExecutionListPage() {
  const query = useQuery({
    queryKey: ['strategy-executions'],
    queryFn: ({ signal }) => getStrategyExecutions(signal),
    staleTime: 30_000,
  });
  if (query.isPending)
    return (
      <ExecutionPageShell>
        <StateView state="loading" title="전략 실행 현황을 불러오고 있습니다." />
      </ExecutionPageShell>
    );
  if (query.isError)
    return (
      <ExecutionPageShell>
        <StateView state="error" actionLabel="다시 시도" onAction={() => query.refetch()} />
      </ExecutionPageShell>
    );
  return <StrategyExecutionListContent initialStrategies={query.data} />;
}
