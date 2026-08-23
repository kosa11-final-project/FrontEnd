import { ArrowRight } from 'reicon-react';
import { formatQuantity } from '@/shared/lib/format';
import { Icon } from '@/shared/ui';

const locationNameOrMissing = (name, fallback) => (typeof name === 'string' && name.trim() ? name.trim() : fallback);

export function StrategyInventoryTransferList({ transfers = [] }) {
  if (!transfers.length) return null;

  return (
    <ol className="grid gap-3" aria-label="재고 이동 경로 목록">
      {transfers.map((transfer, index) => {
        const fromLocation = locationNameOrMissing(transfer.fromLocationName, '출발 거점 미수집');
        const toLocation = locationNameOrMissing(transfer.toLocationName, '도착 거점 미수집');
        const quantity = formatQuantity(transfer.quantity, { fallback: '수량 미수집' });

        return (
          <li
            key={`${transfer.fromLocationId ?? fromLocation}-${transfer.toLocationId ?? toLocation}-${index}`}
            className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center"
            aria-label={`${fromLocation} → ${toLocation}, ${quantity} 이동`}
          >
            <div className="min-w-0">
              <span className="text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
                출발 거점
              </span>
              <strong className="mt-1 block break-words text-[color:var(--text-heading)]">{fromLocation}</strong>
            </div>

            <div className="flex items-center gap-2 text-[color:var(--primary)] sm:flex-col sm:gap-1">
              <Icon icon={ArrowRight} size={20} aria-hidden="true" />
              <strong className="whitespace-nowrap text-[length:var(--font-size-body-sm)]">{quantity}</strong>
            </div>

            <div className="min-w-0 sm:text-right">
              <span className="text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
                도착 거점
              </span>
              <strong className="mt-1 block break-words text-[color:var(--text-heading)]">{toLocation}</strong>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
