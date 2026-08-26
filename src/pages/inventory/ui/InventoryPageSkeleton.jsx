import { InventorySummaryBar } from '@/widgets/inventory-summary';
import { InventoryTableSkeleton } from '@/widgets/inventory-table/ui/InventoryTableSkeleton.jsx';

export function InventoryPageSkeleton() {
  return (
    <div className="inventory-page flex flex-col gap-4" aria-busy="true" aria-label="통합 재고 페이지 불러오는 중">
      {/* 0. 동기화 제어 바 스켈레톤 (실제 InventorySyncControl과 1:1 일치) */}
      <section
        aria-hidden="true"
        className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <strong className="text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
            통합 재고 동기화
          </strong>
          <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            그리팅, 이커머스(모두의 맛집), 백화점, 직영점의 재고가 통합재고로 동기화됩니다.
          </p>
        </div>
        <div className="inventory-sync-actions flex min-h-[68px] flex-wrap items-center justify-end gap-3">
          <p className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            최근 동기화{' '}
            <strong className="font-[var(--font-weight-semibold)] text-[color:var(--text-heading)]">확인 중</strong>
          </p>
          <div className="h-9 w-24 animate-pulse rounded-[var(--radius-control)] bg-gray-100 border border-[var(--border-strong)]" />
        </div>
      </section>

      {/* 1. 상단 KPI 요약 카드 바 스켈레톤 */}
      <InventorySummaryBar isLoading={true} />

      {/* 2. 필터 바 스켈레톤 (실제 InventoryFilterBar와 1:1 일치) */}
      <div
        aria-hidden="true"
        className="inventory-filter-bar flex flex-col gap-3.5 rounded-2xl border border-gray-200/90 bg-white p-4.5 shadow-2xs"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* 검색창 스켈레톤 */}
          <div className="relative min-w-[280px] flex-1 max-w-md">
            <div className="h-10 w-full animate-pulse rounded-lg border border-[#E5E7EB] bg-[#F9FAFB]" />
          </div>

          {/* 우측 컨트롤 그룹 스켈레톤 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 채널 탭 스켈레톤 */}
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-1">
              <div className="h-7 w-16 animate-pulse rounded-md bg-white shadow-xs" />
              <div className="h-7 w-14 animate-pulse rounded-md bg-[#F3F4F6]" />
              <div className="h-7 w-16 animate-pulse rounded-md bg-[#F3F4F6]" />
              <div className="h-7 w-14 animate-pulse rounded-md bg-[#F3F4F6]" />
            </div>

            {/* AND/OR 스켈레톤 */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
              <div className="h-7 w-10 animate-pulse rounded-md bg-white shadow-xs" />
              <div className="h-7 w-10 animate-pulse rounded-md bg-transparent" />
            </div>

            {/* 상세 필터 & 초기화 버튼 스켈레톤 */}
            <div className="h-9 w-24 animate-pulse rounded-lg border border-gray-300 bg-white" />
            <div className="h-9 w-18 animate-pulse rounded-lg border border-gray-200 bg-white" />
          </div>
        </div>
      </div>

      {/* 3. 통합 재고 테이블 스켈레톤 */}
      <InventoryTableSkeleton />
    </div>
  );
}
