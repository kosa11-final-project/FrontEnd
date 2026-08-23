import { ArrowRight, Package, Store, Warehouse } from 'reicon-react';
import { formatQuantity } from '@/shared/lib/format';
import { Icon } from '@/shared/ui';

const locationNameOrMissing = (name, fallback) => (typeof name === 'string' && name.trim() ? name.trim() : fallback);

function TransferCenter({ label, name, align = 'left' }) {
  const isRight = align === 'right';

  return (
    <div className={`flex min-w-0 items-start gap-3 ${isRight ? 'sm:flex-row-reverse sm:text-right' : ''}`}>
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] text-[color:var(--text-muted)]"
        aria-hidden="true"
      >
        <Icon icon={Warehouse} size={19} />
      </span>
      <div className="min-w-0">
        <span className="text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
          {label}
        </span>
        <strong className="mt-1 block break-words text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
          {name}
        </strong>
      </div>
    </div>
  );
}

export function StrategyInventoryTransferList({ transfers = [] }) {
  if (!transfers.length) return null;

  return (
    <ol className="grid gap-3" aria-label="재고 이동 경로 목록">
      {transfers.map((transfer, index) => {
        const fromLocation = locationNameOrMissing(transfer.fromLocationName, '출발 거점 미수집');
        const toLocation = locationNameOrMissing(
          transfer.destinationWarehouseName || transfer.toLocationName,
          '도착 센터 미수집',
        );
        const targetSalesPoint = locationNameOrMissing(transfer.targetSalesPointName, null);
        const quantity = formatQuantity(transfer.quantity, { fallback: '수량 미수집' });
        const accessibleName = `${fromLocation} → ${toLocation}, ${quantity} 이동${
          targetSalesPoint ? `, 대상 판매처 ${targetSalesPoint}` : ''
        }`;

        return (
          <li
            key={`${transfer.fromLocationId ?? fromLocation}-${
              transfer.destinationWarehouseId ?? transfer.toLocationId ?? toLocation
            }-${index}`}
            className="group overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-panel)]"
            aria-label={accessibleName}
          >
            <div className="grid gap-5 px-5 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(160px,0.7fr)_minmax(0,1fr)] sm:items-center sm:px-7">
              <TransferCenter label="출발 센터" name={fromLocation} />

              <div className="relative flex min-h-16 items-center justify-center py-2">
                <span
                  className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-[var(--border)] transition-colors duration-300 group-hover:bg-[var(--primary)] sm:bottom-auto sm:left-0 sm:right-0 sm:top-1/2 sm:h-px sm:w-auto sm:translate-x-0 sm:-translate-y-1/2"
                  aria-hidden="true"
                />
                <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[color:var(--primary)] shadow-[var(--shadow-soft)] transition-transform duration-200 group-hover:scale-105">
                  <Icon icon={Package} size={16} aria-hidden="true" />
                  <strong className="whitespace-nowrap text-[length:var(--font-size-body-sm)]">{quantity}</strong>
                  <Icon icon={ArrowRight} size={16} className="max-sm:rotate-90" aria-hidden="true" />
                </span>
              </div>

              <TransferCenter label="도착 센터" name={toLocation} align="right" />
            </div>

            {targetSalesPoint ? (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-3 sm:px-7">
                <span className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
                  대상 판매처
                </span>
                <span className="inline-flex items-center gap-1.5 text-[length:var(--font-size-body-sm)] font-semibold text-[color:var(--text-heading)]">
                  <Icon icon={Store} size={16} className="text-[color:var(--text-muted)]" aria-hidden="true" />
                  {targetSalesPoint}
                </span>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
