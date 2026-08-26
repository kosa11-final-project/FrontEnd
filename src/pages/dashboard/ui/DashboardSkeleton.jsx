export function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      <section className="grid min-w-0 grid-cols-1 items-stretch gap-4 2xl:h-[calc(100dvh-126px)] 2xl:min-h-0 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-rows-[minmax(0,1fr)]">
        {/* 좌측 3D / 지도 씬 영역 스켈레톤 (실제 씬 컨테이너와 1:1 일치) */}
        <div className="flex min-h-[500px] flex-col rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs 2xl:min-h-0">
          {/* 상단 탭 바 스켈레톤 */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 animate-pulse rounded-xl bg-[#E5E7EB]" />
              <div className="h-9 w-24 animate-pulse rounded-xl bg-[#F3F4F6]" />
              <div className="h-9 w-24 animate-pulse rounded-xl bg-[#F3F4F6]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-28 animate-pulse rounded-lg bg-[#F3F4F6]" />
            </div>
          </div>

          {/* 중앙 캔버스/지도 뷰포트 영역 스켈레톤 */}
          <div className="relative mt-4 flex flex-1 items-center justify-center rounded-xl bg-gradient-to-b from-gray-50/80 to-gray-100/50 p-8">
            <div className="flex flex-col items-center gap-3">
              <div className="size-16 animate-pulse rounded-2xl bg-gray-200/80" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200/80" />
              <div className="h-3 w-28 animate-pulse rounded bg-gray-200/50" />
            </div>
          </div>
        </div>

        {/* 우측 운영 관제 패널 스켈레톤 (420px 너비 1:1 일치) */}
        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs">
          {/* 선택된 판매처 요약 헤더 스켈레톤 */}
          <div className="rounded-xl border border-gray-100 bg-[#F9FAFB] p-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-[#E5E7EB]" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-gray-200/60">
              <div>
                <div className="h-3 w-12 animate-pulse rounded bg-[#F3F4F6]" />
                <div className="mt-1 h-5 w-20 animate-pulse rounded bg-[#E5E7EB]" />
              </div>
              <div>
                <div className="h-3 w-12 animate-pulse rounded bg-[#F3F4F6]" />
                <div className="mt-1 h-5 w-20 animate-pulse rounded bg-[#E5E7EB]" />
              </div>
            </div>
          </div>

          {/* 긴급 SKU 및 위험 판매처 섹션 스켈레톤 */}
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-4 w-12 animate-pulse rounded bg-[#F3F4F6]" />
            </div>

            {/* 행 아이템 4개 스켈레톤 */}
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 animate-pulse rounded-lg bg-[#F3F4F6]" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-28 animate-pulse rounded bg-[#E5E7EB]" />
                    <div className="h-3 w-16 animate-pulse rounded bg-[#F3F4F6]" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="h-4 w-14 animate-pulse rounded bg-[#E5E7EB]" />
                  <div className="h-4 w-10 animate-pulse rounded-full bg-[#F3F4F6]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
