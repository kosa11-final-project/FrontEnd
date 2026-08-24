import { AlertCircle, CheckCircle } from 'reicon-react';
import { actionStatusMeta, actionTypeMeta } from '../model/strategy.js';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui';

const getStepState = (status) => {
  if (status === 'COMPLETED') return 'complete';
  if (['IN_PROGRESS', 'REQUESTED', 'PARTIAL'].includes(status)) return 'current';
  if (['BLOCKED', 'FAILED'].includes(status)) return 'problem';
  return 'upcoming';
};

const stepClassName = {
  complete: 'border-[var(--chart-4)] bg-[var(--chart-4)] text-white',
  current:
    'border-[var(--chart-4)] bg-[color:color-mix(in_srgb,var(--chart-4)_12%,var(--card))] text-[color:var(--chart-4)]',
  problem: 'border-[var(--danger)] bg-[var(--danger-soft)] text-[color:var(--danger)]',
  upcoming: 'border-[var(--border-strong)] bg-[var(--card)] text-[color:var(--text-muted)]',
};

export function StrategyActionStepProgress({ actions = [] }) {
  if (!actions.length) {
    return <p className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">진행 단계 미수집</p>;
  }

  if (actions.length === 1) {
    const action = actions[0];
    const state = getStepState(action.status);
    const typeLabel = actionTypeMeta[action.type]?.shortLabel ?? '단일 액션';
    const statusLabel = actionStatusMeta[action.status]?.label ?? '상태 미수집';
    return (
      <ol aria-label="전략 액션 진행 단계">
        <li className="flex min-w-0 items-center gap-3" aria-label={`${typeLabel}: ${statusLabel}`}>
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-full border text-[length:var(--font-size-body-sm)] font-bold',
              stepClassName[state],
            )}
            aria-hidden="true"
          >
            {state === 'complete' ? (
              <Icon icon={CheckCircle} size={24} />
            ) : state === 'problem' ? (
              <Icon icon={AlertCircle} size={20} />
            ) : (
              1
            )}
          </span>
          <span className="min-w-0 text-left">
            <strong className="block truncate text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
              {typeLabel}
            </strong>
            <span className="mt-0.5 block text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
              {statusLabel}
            </span>
          </span>
        </li>
      </ol>
    );
  }

  return (
    <ol
      className="grid"
      style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
      aria-label="전략 액션 진행 단계"
    >
      {actions.map((action, index) => {
        const state = getStepState(action.status);
        const typeLabel = actionTypeMeta[action.type]?.shortLabel ?? `${index + 1}단계`;
        const statusLabel = actionStatusMeta[action.status]?.label ?? '상태 미수집';
        return (
          <li
            key={action.id ?? index}
            className="relative min-w-0 text-center"
            aria-label={`${typeLabel}: ${statusLabel}`}
          >
            {index < actions.length - 1 ? (
              <span
                className={cn(
                  'absolute left-[calc(50%+14px)] right-[calc(-50%+14px)] top-3.5 h-0.5',
                  state === 'complete' ? 'bg-[var(--chart-4)]' : 'bg-[var(--border)]',
                )}
                aria-hidden="true"
              />
            ) : null}
            <span
              className={cn(
                'relative z-10 mx-auto grid size-7 place-items-center rounded-full border text-[length:var(--font-size-meta)] font-bold',
                stepClassName[state],
              )}
              aria-hidden="true"
            >
              {state === 'complete' ? (
                <Icon icon={CheckCircle} size={17} />
              ) : state === 'problem' ? (
                <Icon icon={AlertCircle} size={15} />
              ) : (
                index + 1
              )}
            </span>
            <span className="mt-1.5 block truncate px-1 text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
              {typeLabel}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
