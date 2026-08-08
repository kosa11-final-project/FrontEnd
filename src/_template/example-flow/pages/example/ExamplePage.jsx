import { useSearchParams } from 'react-router-dom';
import { readExampleFilters, writeExampleFilters } from '@/features/example-filter';
import { ExampleList } from '@/widgets/example-list';

export default function ExamplePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readExampleFilters(searchParams);

  return (
    <main className="page-shell">
      <h1 className="text-[length:var(--font-size-page-title)] font-[var(--font-weight-extrabold)] text-[color:var(--text-heading)]">
        예시 페이지
      </h1>
      <ExampleList
        filters={filters}
        onFiltersChange={(nextFilters) => setSearchParams(writeExampleFilters(nextFilters))}
      />
    </main>
  );
}
