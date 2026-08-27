import { Skeleton } from '@/shared/ui/Skeleton.jsx';
import { InventoryTableDesktopShell } from './InventoryTableDesktopShell.jsx';

export function InventoryTableDesktopBodySkeleton({ rowCount = 8 }) {
  return (
    <tbody
      className="divide-y divide-[var(--border)] bg-white"
      data-testid="inventory-table-desktop-body-skeleton"
      aria-hidden="true"
    >
      {/* 실제 행 높이(76px: 썸네일 48px + py-3.5 패딩 28px)와 1:1 완벽 일치시켜 전환 시 높이 변화(CLS)를 0으로 만듭니다. */}
      {Array.from({ length: rowCount }, (_, index) => index + 1).map((i) => (
        <tr key={i} className="h-[76px]">
          <td className="min-w-[52px] py-4 pl-3 pr-2 text-left align-middle">
            <Skeleton className="block size-4 rounded border border-gray-200 bg-gray-100 motion-reduce:animate-none" />
          </td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-3.5">
              <Skeleton className="block size-12 shrink-0 rounded-lg border border-[var(--border)] bg-[#F3F4F6] motion-reduce:animate-none" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="block h-4 w-4/5 rounded bg-[#E5E7EB] motion-reduce:animate-none" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="block h-3 w-16 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
                  <Skeleton className="block h-3 w-28 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="block h-5 w-16 rounded-md bg-[#F3F4F6] motion-reduce:animate-none" />
              <Skeleton className="block h-5 w-14 rounded-md bg-[#F3F4F6] motion-reduce:animate-none" />
            </div>
          </td>
          <td className="px-4 py-4">
            <Skeleton className="block h-5 w-12 rounded-md bg-[#F3F4F6] motion-reduce:animate-none" />
          </td>
          <td className="px-4 py-4 text-right">
            <Skeleton className="ml-auto block h-5 w-16 rounded bg-[#E5E7EB] motion-reduce:animate-none" />
          </td>
          <td className="px-4 py-4 text-right">
            <div className="ml-auto flex flex-col items-end gap-1">
              <Skeleton className="block h-5 w-16 rounded bg-[#E5E7EB] motion-reduce:animate-none" />
              <Skeleton className="block h-3 w-12 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
            </div>
          </td>
          <td className="px-4 py-4 text-right">
            <div className="ml-auto flex flex-col items-end gap-1">
              <Skeleton className="block h-5 w-16 rounded bg-[#E5E7EB] motion-reduce:animate-none" />
              <Skeleton className="block h-3 w-14 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
            </div>
          </td>
          <td className="px-4 py-4 text-center">
            <Skeleton className="mx-auto block h-5 w-14 rounded-full bg-[#F3F4F6] motion-reduce:animate-none" />
          </td>
          <td className="px-4 py-4 text-center">
            <Skeleton className="mx-auto block h-5 w-12 rounded-full bg-[#F3F4F6] motion-reduce:animate-none" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export function InventoryTableMobileBodySkeleton({ rowCount = 20 }) {
  return (
    <div
      className="flex flex-col divide-y divide-[var(--border)] lg:hidden"
      data-testid="inventory-table-mobile-body-skeleton"
      aria-hidden="true"
    >
      {Array.from({ length: rowCount }, (_, index) => index + 1).map((i) => (
        <div key={i} className="flex flex-col gap-3 p-4 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Skeleton className="mt-1 block size-4 shrink-0 rounded border border-gray-200 bg-gray-100 motion-reduce:animate-none" />
              <Skeleton className="block size-14 shrink-0 rounded-xl bg-[#F3F4F6] motion-reduce:animate-none" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="block h-3.5 w-16 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
                  <Skeleton className="block h-3.5 w-12 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
                </div>
                <Skeleton className="block h-4 w-4/5 rounded bg-[#E5E7EB] motion-reduce:animate-none" />
                <Skeleton className="block h-3 w-1/2 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <Skeleton className="block h-5 w-14 rounded-full bg-[#F3F4F6] motion-reduce:animate-none" />
              <Skeleton className="block h-3.5 w-12 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <Skeleton className="block h-5 w-14 rounded-md bg-[#F3F4F6] motion-reduce:animate-none" />
              <Skeleton className="block h-5 w-14 rounded-md bg-[#F3F4F6] motion-reduce:animate-none" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <Skeleton className="block h-4 w-16 rounded bg-[#E5E7EB] motion-reduce:animate-none" />
              <Skeleton className="block h-4 w-16 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
              <Skeleton className="block h-4 w-16 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InventoryTableEmptyRefetchSkeleton() {
  return (
    <div
      className="grid min-h-44 place-items-center rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] px-6 py-10"
      data-testid="inventory-table-empty-refetch-skeleton"
      aria-hidden="true"
    >
      <div className="grid w-full max-w-sm justify-items-center gap-3">
        <Skeleton className="block size-10 rounded-full bg-[#F3F4F6] motion-reduce:animate-none" />
        <Skeleton className="block h-5 w-40 rounded bg-[#E5E7EB] motion-reduce:animate-none" />
        <Skeleton className="block h-3 w-full rounded bg-[#F3F4F6] motion-reduce:animate-none" />
        <Skeleton className="block h-8 w-24 rounded-md bg-[#F3F4F6] motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export function InventoryTableSkeleton({ rowCount = 20 }) {
  return (
    <div
      role="status"
      aria-label="재고 목록 불러오는 중"
      aria-busy="true"
      className="flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-6 py-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-bold text-gray-900">통합 재고 현황 목록</span>
          <Skeleton className="block h-5 w-16 rounded-full bg-[#F3F4F6] motion-reduce:animate-none" />
          <Skeleton className="block h-4 w-28 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
        </div>
        <Skeleton className="block h-7 w-24 rounded-md bg-[#F3F4F6] motion-reduce:animate-none" />
      </div>

      <InventoryTableDesktopShell isLoading>
        <InventoryTableDesktopBodySkeleton rowCount={rowCount} />
      </InventoryTableDesktopShell>

      {/* 모바일 카드 스켈레톤 */}
      <InventoryTableMobileBodySkeleton rowCount={rowCount} />

      {/* 페이지네이션 바 스켈레톤 (실제 InventoryPagination과 1:1 일치) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] bg-white px-6 py-3.5">
        <Skeleton className="block h-4 w-32 rounded bg-[#F3F4F6] motion-reduce:animate-none" />
        <div className="flex items-center gap-2">
          <Skeleton className="block h-8 w-8 rounded-lg bg-[#F3F4F6] motion-reduce:animate-none" />
          <Skeleton className="block h-8 w-8 rounded-lg bg-[#E5E7EB] motion-reduce:animate-none" />
          <Skeleton className="block h-8 w-8 rounded-lg bg-[#F3F4F6] motion-reduce:animate-none" />
          <Skeleton className="block h-8 w-8 rounded-lg bg-[#F3F4F6] motion-reduce:animate-none" />
          <Skeleton className="block h-8 w-8 rounded-lg bg-[#F3F4F6] motion-reduce:animate-none" />
          <Skeleton className="block h-8 w-8 rounded-lg bg-[#F3F4F6] motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
