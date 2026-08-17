import { Refresh } from 'reicon-react';
import { Button } from '@/shared/ui';

export function InventorySyncControl() {
  return (
    <div className="flex shrink-0 flex-col items-stretch sm:items-end">
      <Button
        type="button"
        variant="secondary"
        size="md"
        disabled
        aria-describedby="inventory-sync-readiness"
        aria-label="재고 동기화 준비 중"
      >
        <Refresh size={15} aria-hidden="true" />
        재고 동기화 준비 중
      </Button>
      <p id="inventory-sync-readiness" className="mt-1 max-w-64 text-right text-[11px] text-gray-500">
        원천 데이터 연결과 Flyway 반영 후 활성화됩니다.
      </p>
    </div>
  );
}
