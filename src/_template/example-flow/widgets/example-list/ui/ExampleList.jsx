import { useQuery } from '@tanstack/react-query';
import { ExampleStatusBadge, exampleListQueryOptions } from '@/entities/example';
import { ExampleFilterBar } from '@/features/example-filter';
import { Card, StateView } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/format';

export function ExampleList({ filters, onFiltersChange }) {
  const query = useQuery(exampleListQueryOptions(filters));

  let content;
  if (query.isPending) {
    content = <StateView state="loading" />;
  } else if (query.isError) {
    content = <StateView state="error" actionLabel="다시 시도" onAction={() => query.refetch()} />;
  } else if (query.data.items.length === 0) {
    content = <StateView state="empty" />;
  } else {
    content = (
      <ul className="grid gap-3">
        {query.data.items.map((item) => (
          <li key={item.id}>
            <Card className="flex items-center justify-between p-4">
              <span>{item.name}</span>
              <ExampleStatusBadge status={item.status} />
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section aria-labelledby="example-list-title">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2
            id="example-list-title"
            className="text-[length:var(--font-size-section-title)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]"
          >
            예시 목록
          </h2>
          {query.data && (
            <p className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
              총 {formatNumber(query.data.pagination.totalElements)}건
            </p>
          )}
        </div>
        <ExampleFilterBar filters={filters} onChange={onFiltersChange} />
      </div>

      {query.isFetching && !query.isPending && (
        <p role="status" className="mb-2 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          목록을 갱신하는 중입니다.
        </p>
      )}
      {content}
    </section>
  );
}
