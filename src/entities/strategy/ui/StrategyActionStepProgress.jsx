import { Link } from 'react-router-dom';
import { AlertCircle, ArrangeCircle, CheckCircle, DiscountCircle, Layers, ShopAdd, Target, Truck } from 'reicon-react';
import { actionStatusMeta, actionTypeMeta } from '../model/strategy.js';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Icon } from '@/shared/ui';

const actionTypeIcons = Object.freeze({
  REALLOCATION: ArrangeCircle,
  RT_TRANSFER: Truck,
  PRICE_DISCOUNT: DiscountCircle,
  CHANNEL_EXPANSION: ShopAdd,
  CHANNEL_CONCENTRATION: Target,
});

const getRowState = (status) => {
  if (status === 'COMPLETED') return 'complete';
  if (['IN_PROGRESS', 'REQUESTED'].includes(status)) return 'current';
  if (['PARTIAL', 'BLOCKED'].includes(status)) return 'attention';
  if (status === 'FAILED') return 'problem';
  return 'upcoming';
};

const rowTone = Object.freeze({
  complete: {
    icon: 'bg-[var(--primary-soft)] text-[color:var(--primary-strong)]',
    badge: 'bg-[var(--primary-soft)] text-[color:var(--primary-strong)]',
    progress: 'bg-[var(--primary)]',
  },
  current: {
    icon: 'bg-[var(--info-soft)] text-[color:color-mix(in_srgb,var(--info)_72%,var(--color-gray-900))]',
    badge: 'bg-[var(--info-soft)] text-[color:color-mix(in_srgb,var(--info)_72%,var(--color-gray-900))]',
    progress: 'bg-[var(--info)]',
  },
  attention: {
    icon: 'bg-[var(--warning-soft)] text-[color:var(--chart-3)]',
    badge: 'bg-[var(--warning-soft)] text-[color:var(--chart-3)]',
    progress: 'bg-[var(--warning)]',
  },
  problem: {
    icon: 'bg-[var(--danger-soft)] text-[color:var(--danger)]',
    badge: 'bg-[var(--danger-soft)] text-[color:var(--danger)]',
    progress: 'bg-[var(--danger)]',
  },
  upcoming: {
    icon: 'bg-[var(--surface-subtle)] text-[color:var(--text-muted)]',
    badge: 'bg-[var(--surface-subtle)] text-[color:var(--text-body)]',
    progress: 'bg-[var(--border-strong)]',
  },
});

const getProgress = (action) => {
  if (Number.isFinite(action.progress)) return Math.min(100, Math.max(0, action.progress));
  if (action.status === 'COMPLETED') return 100;
  if (['NOT_STARTED', 'CANCELLED', 'BLOCKED'].includes(action.status)) return 0;
  return null;
};

const desktopColumns = 'sm:grid-cols-[minmax(150px,1.15fr)_minmax(130px,1fr)_minmax(110px,0.7fr)_minmax(76px,auto)]';

function ActionProgressInfo({ action, state, tone, progress, typeLabel, detailHref }) {
  if (state === 'complete') {
    return (
      <div className="flex items-center gap-1.5 text-[length:var(--font-size-meta)] font-semibold text-[color:var(--primary-strong)]">
        <Icon icon={CheckCircle} size={15} aria-hidden="true" />
        {action.endDate ? <span>{formatDate(action.endDate)}</span> : null}
        <span className="sr-only">완료 처리됨</span>
      </div>
    );
  }

  if (state === 'current' || (state === 'attention' && action.status === 'PARTIAL')) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <div
          className="h-1.5 min-w-12 flex-1 overflow-hidden rounded-full bg-[var(--surface-subtle)]"
          role={progress === null ? undefined : 'progressbar'}
          aria-label={progress === null ? undefined : `${typeLabel} 진행률`}
          aria-valuemin={progress === null ? undefined : 0}
          aria-valuemax={progress === null ? undefined : 100}
          aria-valuenow={progress ?? undefined}
        >
          <span className={cn('block h-full rounded-full', tone.progress)} style={{ width: `${progress ?? 0}%` }} />
        </div>
        <span className="w-8 shrink-0 text-right text-[length:var(--font-size-meta)] font-bold text-[color:var(--text-body)]">
          {progress === null ? '—' : `${progress}%`}
        </span>
      </div>
    );
  }

  if (state === 'problem' || state === 'attention') {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon
          icon={AlertCircle}
          size={14}
          className={
            state === 'problem' ? 'shrink-0 text-[color:var(--danger)]' : 'shrink-0 text-[color:var(--warning)]'
          }
          aria-hidden="true"
        />
        {action.note ? (
          <span
            className="min-w-0 flex-1 truncate text-[length:var(--font-size-meta)] text-[color:var(--text-body)]"
            title={action.note}
          >
            {action.note}
          </span>
        ) : null}
        {detailHref ? (
          <Link
            to={detailHref}
            className="shrink-0 rounded text-[length:var(--font-size-meta)] font-semibold text-[color:var(--primary-strong)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            상세 보기
          </Link>
        ) : null}
      </div>
    );
  }

  return <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-body)]">—</span>;
}

export function StrategyActionStepProgress({ actions = [], detailHref }) {
  if (!actions.length) {
    return (
      <div className="grid min-h-20 place-items-center rounded-[var(--radius-panel)] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-3">
        <p className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">진행 단계 미수집</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
      <div
        className={cn(
          'hidden min-h-8 items-center gap-3 bg-[var(--surface-subtle)] px-3 text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-body)] sm:grid',
          desktopColumns,
        )}
        aria-hidden="true"
      >
        <span>액션</span>
        <span>실행 대상</span>
        <span>진행 정보</span>
        <span className="text-right">상태</span>
      </div>

      <ol className="divide-y divide-[var(--border)]" aria-label="전략 액션 진행 단계">
        {actions.map((action, index) => {
          const state = getRowState(action.status);
          const tone = rowTone[state];
          const typeLabel = actionTypeMeta[action.type]?.shortLabel ?? `${index + 1}단계`;
          const statusLabel = actionStatusMeta[action.status]?.label ?? '상태 미수집';
          const progress = getProgress(action);
          const ActionIcon = actionTypeIcons[action.type] ?? Layers;
          const rawTitle = action.title?.trim();
          const actionTitle = !rawTitle || rawTitle === action.type || actionTypeMeta[rawTitle] ? null : rawTitle;

          return (
            <li
              key={action.id ?? index}
              className={cn(
                'grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-3 py-2 transition-colors hover:bg-[color:color-mix(in_srgb,var(--surface-subtle)_65%,transparent)] sm:gap-3',
                desktopColumns,
              )}
              data-step-state={state}
              aria-label={`${typeLabel}: ${statusLabel}`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn('grid size-8 shrink-0 place-items-center rounded-full', tone.icon)}
                  aria-hidden="true"
                >
                  <Icon icon={ActionIcon} size={17} />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                    {typeLabel}
                  </strong>
                  <span className="block truncate text-[length:var(--font-size-meta)] text-[color:var(--text-body)]">
                    STEP {String(index + 1).padStart(2, '0')}
                    {actionTitle ? ` · ${actionTitle}` : ''}
                  </span>
                </span>
              </div>

              <p
                className="col-span-2 min-w-0 truncate text-[length:var(--font-size-meta)] text-[color:var(--text-body)] sm:col-span-1"
                title={action.target}
              >
                {action.target || '실행 대상 미수집'}
              </p>

              <div className="col-span-2 min-w-0 sm:col-span-1">
                <ActionProgressInfo
                  action={action}
                  state={state}
                  tone={tone}
                  progress={progress}
                  typeLabel={typeLabel}
                  detailHref={detailHref}
                />
              </div>

              <span
                className={cn(
                  'row-start-1 justify-self-end whitespace-nowrap rounded-full px-2 py-1 text-[length:var(--font-size-meta)] font-bold sm:row-auto',
                  tone.badge,
                )}
              >
                {statusLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
