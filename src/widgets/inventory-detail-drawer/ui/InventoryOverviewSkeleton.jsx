import { Skeleton } from '@/shared/ui';

export function InventoryOverviewSkeleton() {
  return (
    <div role="status" aria-label="선택한 판매처의 재고 상세 정보를 불러오는 중" className="min-h-full space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <Skeleton className="block h-5 w-36" />
          <Skeleton className="block h-5 w-40" />
        </div>
        <Skeleton className="mt-4 block h-10 w-full" />
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          <Skeleton className="block h-20 w-full" />
          <Skeleton className="block h-20 w-full" />
          <Skeleton className="block h-20 w-full" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <Skeleton className="block h-5 w-64" />
          <Skeleton className="block h-5 w-20" />
        </div>
        <div className="space-y-3 bg-slate-50/40 p-3.5">
          {[1, 2].map((item) => (
            <div key={item} className="rounded-xl border border-slate-100 bg-white p-3.5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="block h-5 w-56" />
                <Skeleton className="block h-6 w-16" />
              </div>
              <Skeleton className="mt-3 block h-16 w-full" />
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Skeleton className="block h-12 w-full" />
                <Skeleton className="block h-12 w-full" />
                <Skeleton className="block h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
