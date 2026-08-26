export function StatisticsSkeleton() {
  return (
    <div className="space-y-4">
      {/* 1. 상단 탭 스켈레톤 (실제 TabsList와 1:1 일치) */}
      <div className="border-b border-[var(--border)] pb-0">
        <div className="flex h-12 items-center gap-6">
          <div className="h-6 w-24 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-6 w-24 animate-pulse rounded bg-[#F3F4F6]" />
        </div>
      </div>

      {/* 2. 필터 바 스켈레톤 (기간/위치 필터와 1:1 일치) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white p-3.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="h-8 w-14 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="h-8 w-14 animate-pulse rounded-lg bg-[#F3F4F6]" />
          <div className="h-8 w-14 animate-pulse rounded-lg bg-[#F3F4F6]" />
          <div className="h-8 w-14 animate-pulse rounded-lg bg-[#F3F4F6]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 animate-pulse rounded-lg bg-[#F3F4F6]" />
          <div className="h-8 w-36 animate-pulse rounded-lg bg-[#F3F4F6]" />
        </div>
      </div>

      {/* 3. 상단 핵심 지표 요약 카드 4개 스켈레톤 (1:1 일치) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs min-h-[110px]"
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

      {/* 4. 메인 성과/위험 추이 차트 영역 스켈레톤 (h-[360px] 1:1 고정) */}
      <div className="flex h-[360px] flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="h-5 w-36 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-3 w-48 animate-pulse rounded bg-[#F3F4F6]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
          </div>
        </div>

        {/* 차트 격자/영역 펄스 */}
        <div className="relative flex flex-1 items-end gap-3 pt-6 pb-2">
          {[40, 65, 45, 80, 60, 90, 75, 85, 70, 95].map((height, idx) => (
            <div
              key={idx}
              className="flex-1 animate-pulse rounded-t-md bg-[#F3F4F6]"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* 차트 X축 라벨 자리 */}
        <div className="flex justify-between border-t border-gray-100 pt-2 text-[11px] text-gray-400">
          <div className="h-3 w-12 animate-pulse rounded bg-[#F3F4F6]" />
          <div className="h-3 w-12 animate-pulse rounded bg-[#F3F4F6]" />
          <div className="h-3 w-12 animate-pulse rounded bg-[#F3F4F6]" />
          <div className="h-3 w-12 animate-pulse rounded bg-[#F3F4F6]" />
        </div>
      </div>
    </div>
  );
}
