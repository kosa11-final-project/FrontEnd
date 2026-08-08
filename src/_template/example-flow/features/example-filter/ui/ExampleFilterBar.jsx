import { Input, Select } from '@/shared/ui';

export function ExampleFilterBar({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-[var(--spacing-field-gap)]">
      <Input
        aria-label="예시 항목 검색"
        placeholder="이름 검색"
        value={filters.query}
        onChange={(event) => onChange({ ...filters, query: event.target.value, page: 0 })}
      />
      <Select
        aria-label="예시 상태"
        value={filters.status}
        onChange={(event) => onChange({ ...filters, status: event.target.value, page: 0 })}
      >
        <option value="all">전체 상태</option>
        <option value="active">사용 중</option>
        <option value="paused">일시 중지</option>
        <option value="inactive">사용 안 함</option>
      </Select>
    </div>
  );
}
