import { memo } from 'react';
import { Calendar } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { Badge, Card, Icon } from '@/shared/ui';
import { InventoryStatusBadge } from './InventoryStatusBadge.jsx';

export const LotInventoryRow = memo(function LotInventoryRow({
  rank = 1,
  lot,
  location,
  inboundDate,
  expiryDate,
  expiryLabel,
  currentStock,
  scheduledShipment,
  availableStock,
  status = 'normal',
  onClick,
  className,
  ...props
}) {
  const content = (
    <>
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="good">FEFO {rank}순위</Badge>
            <InventoryStatusBadge status={status} />
          </div>
          <strong className="mt-2 block truncate text-[length:var(--font-size-body-sm)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">{lot}</strong>
          <span className="mt-1 block truncate text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">입고 {inboundDate} · {location}</span>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-[0.625rem] text-[color:var(--text-muted)]">소비기한 / 판매중지</span>
          <strong className="mt-1 inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--warning)] bg-[var(--warning-soft)] px-2 py-1 text-[length:var(--font-size-body-sm)] font-[var(--font-weight-bold)] text-[color:var(--warning)]">
            <Icon aria-hidden="true" icon={Calendar} size={13} />
            {expiryLabel}
          </strong>
          <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">{expiryDate}</span>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-3 text-right">
        <div><dt className="text-[0.625rem] text-[color:var(--text-muted)]">현재고</dt><dd className="mt-1 tabular-nums text-[length:var(--font-size-body-sm)] font-bold text-[color:var(--text-heading)]">{currentStock}</dd></div>
        <div><dt className="text-[0.625rem] text-[color:var(--text-muted)]">출고 예정</dt><dd className="mt-1 tabular-nums text-[length:var(--font-size-body-sm)] font-bold text-[color:var(--text-body)]">{scheduledShipment}</dd></div>
        <div><dt className="text-[0.625rem] text-[color:var(--text-muted)]">판매 가능</dt><dd className="mt-1 tabular-nums text-[length:var(--font-size-body-sm)] font-bold text-[color:var(--good)]">{availableStock}</dd></div>
      </dl>
    </>
  );

  const rowClassName = cn('min-w-0', onClick && 'cursor-pointer text-left transition-[border-color,box-shadow,transform] duration-[var(--motion-fast)] hover:-translate-y-px hover:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]', className);

  if (onClick) {
    return <Card asChild padding="sm" className={rowClassName} {...props}><button type="button" onClick={onClick} className="block w-full text-left">{content}</button></Card>;
  }

  return <Card padding="sm" className={rowClassName} {...props}>{content}</Card>;
});
