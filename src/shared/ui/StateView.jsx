import { cva } from 'class-variance-authority';
import { Danger, FolderOpen, Refresh, Shield } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { Button } from './Button.jsx';
import { Icon } from './Icon.jsx';

const stateViewVariants = cva(
  'grid min-h-44 place-items-center rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] px-6 py-10 text-center',
  {
    variants: {
      tone: {
        neutral: '',
        info: 'border-[var(--info-soft)]',
        danger: 'border-[var(--danger-soft)]',
      },
      compact: {
        true: 'min-h-28 py-6',
        false: '',
      },
    },
    defaultVariants: { tone: 'neutral', compact: false },
  },
);

const stateIconVariants = cva('grid size-10 place-items-center rounded-full', {
  variants: {
    tone: {
      neutral: 'bg-[var(--surface-subtle)] text-[color:var(--text-muted)]',
      info: 'bg-[var(--info-soft)] text-[color:var(--info)]',
      danger: 'bg-[var(--danger-soft)] text-[color:var(--danger)]',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

const stateMeta = Object.freeze({
  loading: {
    tone: 'info',
    icon: Refresh,
    title: null,
    description: null,
    role: 'status',
  },
  empty: {
    tone: 'neutral',
    icon: FolderOpen,
    title: '표시할 데이터가 없습니다.',
    description: '검색 조건이나 필터를 변경해 보세요.',
    role: 'status',
  },
  error: {
    tone: 'danger',
    icon: Danger,
    title: '데이터를 불러오지 못했습니다.',
    description: '잠시 후 다시 시도해 주세요.',
    role: 'alert',
  },
  forbidden: {
    tone: 'danger',
    icon: Shield,
    title: '접근 권한이 없습니다.',
    description: '현재 권한 범위에서는 이 정보를 확인할 수 없습니다.',
    role: 'alert',
  },
});

export function StateView({
  state = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
  className,
  ...props
}) {
  const meta = stateMeta[state] ?? stateMeta.empty;
  const isLoading = state === 'loading';
  const resolvedTitle = title ?? meta.title;
  const resolvedDescription = description ?? meta.description;
  const hasMessage = Boolean(resolvedTitle || resolvedDescription);

  return (
    <div
      role={meta.role}
      aria-live="polite"
      aria-busy={isLoading || undefined}
      aria-label={isLoading && !hasMessage ? '로딩 중' : undefined}
      className={cn(stateViewVariants({ tone: meta.tone, compact }), className)}
      {...props}
    >
      <div className="grid justify-items-center gap-3">
        <span className={cn(stateIconVariants({ tone: meta.tone }))}>
          <Icon icon={meta.icon} size={20} className={isLoading ? 'animate-spin' : undefined} aria-hidden="true" />
        </span>
        {hasMessage ? (
          <div>
            {resolvedTitle ? (
              <h2 className="text-[length:var(--font-size-subtitle2)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
                {resolvedTitle}
              </h2>
            ) : null}
            {resolvedDescription ? (
              <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
                {resolvedDescription}
              </p>
            ) : null}
          </div>
        ) : null}
        {actionLabel && onAction ? (
          <Button variant={state === 'error' ? 'secondary' : 'primary'} size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { stateIconVariants, stateViewVariants };
