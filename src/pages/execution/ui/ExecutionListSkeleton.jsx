export function ExecutionListSkeleton() {
  return (
    <div className="space-y-4">
      {/* 1. 상단 전체 성과 동기화 배너 스켈레톤 */}
      <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-5 w-36 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-4 w-72 animate-pulse rounded bg-[#F3F4F6]" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded-lg bg-[#F3F4F6]" />
      </section>

      {/* 2. 실행 성과 요약 카드 3개 스켈레톤 (실제 요약 바 1:1 일치) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4.5 shadow-2xs min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-[#F3F4F6]" />
              <div className="size-8 animate-pulse rounded-xl bg-[#F3F4F6]" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="h-7 w-20 animate-pulse rounded-lg bg-[#E5E7EB]" />
              <div className="h-4 w-16 animate-pulse rounded bg-[#F3F4F6]" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. 필터 바 스켈레톤 (1:1 일치) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-8 w-16 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-[#F3F4F6]" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-[#F3F4F6]" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-[#F3F4F6]" />
        </div>
        <div className="h-4 w-20 animate-pulse rounded bg-[#F3F4F6]" />
      </div>

      {/* 4. 실행 전략 카드 3개 스켈레톤 (1:1 내부 좌표 일치) */}
      <section className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-xs"
          >
            {/* 카드 헤더 (체크박스, SKU 코드, 전략명, 상태 뱃지) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="size-4 animate-pulse rounded bg-[#F3F4F6]" />
                <div className="h-5 w-24 animate-pulse rounded bg-[#E5E7EB]" />
                <div className="h-4 w-40 animate-pulse rounded bg-[#F3F4F6]" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 animate-pulse rounded-full bg-[#E5E7EB]" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
              </div>
            </div>

            {/* 카드 본문 (진행 단계 바 + 수치 요약) */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-2">
                <div className="h-3 w-16 animate-pulse rounded bg-[#F3F4F6]" />
                <div className="h-2 w-full animate-pulse rounded-full bg-[#F3F4F6]" />
                <div className="h-3 w-28 animate-pulse rounded bg-[#F3F4F6]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-20 animate-pulse rounded bg-[#F3F4F6]" />
                <div className="h-6 w-28 animate-pulse rounded bg-[#E5E7EB]" />
              </div>
              <div className="flex flex-col gap-1.5 lg:items-end">
                <div className="h-3 w-20 animate-pulse rounded bg-[#F3F4F6]" />
                <div className="h-6 w-28 animate-pulse rounded bg-[#E5E7EB]" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
