import { formatDateTime } from '@/shared/lib/format';

export function StrategySyncStatus({ lastSyncedAt }) {
  const formattedLastSyncedAt = lastSyncedAt ? formatDateTime(lastSyncedAt) : '없음';

  return (
    <span
      className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]"
      aria-label={`최근 동기화 이력 ${formattedLastSyncedAt}`}
    >
      최근 동기화 이력 {formattedLastSyncedAt}
    </span>
  );
}
