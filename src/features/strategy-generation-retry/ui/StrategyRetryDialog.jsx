import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseCircle, Danger, Refresh, Warning } from 'reicon-react';
import { formatDate } from '@/shared/lib/format';
import { Button, Icon, IconButton } from '@/shared/ui';

const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const dialogContent = Object.freeze({
  PERIOD_EXPIRED: {
    eyebrow: 'RETRY PERIOD EXPIRED',
    title: '동일 조건으로 재시도할 수 없습니다',
    description: (
      <>
        기존 전략의 판매 기간이 모두 지나
        <br />
        동일 조건으로 재시도할 수 없습니다.
        <br />
        <br />
        조건을 수정하여 새 AI 전략을 생성해 주세요.
      </>
    ),
    actionLabel: '조건 수정 후 새로 생성',
    icon: Danger,
    tone: 'danger',
  },
  CONDITIONS_STALE: {
    eyebrow: 'RETRY CONDITIONS CHANGED',
    title: '기존 요청 조건이 변경되었습니다',
    description: (
      <>
        기존 요청에 포함된 재고, 판매처 또는 판매 기간의 상태가 변경되어
        <br />
        동일 조건으로 재시도할 수 없습니다.
        <br />
        <br />
        최신 재고를 확인한 후 새 AI 전략을 생성해 주세요.
      </>
    ),
    actionLabel: '최신 재고 확인',
    icon: Warning,
    tone: 'warning',
  },
});

export function StrategyRetryDialog({ dialog, isPending, onClose, onConfirm, onNavigateInventory }) {
  const dialogRef = useRef(null);
  const primaryButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    primaryButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isPending) onCloseRef.current?.();
      if (event.key !== 'Tab') return;
      const elements = [...(dialogRef.current?.querySelectorAll(focusableSelector) ?? [])];
      if (!elements.length) return;
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [isPending]);

  const isDateAdjustment = dialog.kind === 'DATE_ADJUSTMENT';
  const content = isDateAdjustment
    ? {
        eyebrow: 'DATE ADJUSTMENT REQUIRED',
        title: '판매 시작일을 변경할까요?',
        description: (
          <>
            기존 전략의 판매 시작일인 {formatDate(dialog.details.originalPreferredStartDate)}이 지났습니다.
            <br />
            <br />
            판매 시작일을 오늘인 {formatDate(dialog.details.adjustedPreferredStartDate)}로 변경하여
            <br />
            새로운 AI 전략을 생성하시겠습니까?
          </>
        ),
        actionLabel: '확인',
        icon: Warning,
        tone: 'warning',
      }
    : dialogContent[dialog.kind];
  const DialogIcon = content.icon;
  const toneClass =
    content.tone === 'danger'
      ? 'bg-[var(--danger-soft)] text-[color:var(--danger)]'
      : 'bg-[var(--warning-soft)] text-[color:var(--warning)]';

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose?.();
      }}
    >
      <section
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="strategy-retry-dialog-title"
        aria-describedby="strategy-retry-dialog-description"
        className="w-full max-w-lg overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--background)] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full ${toneClass}`}
            >
              <Icon icon={DialogIcon} size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                {content.eyebrow}
              </p>
              <h2 id="strategy-retry-dialog-title" className="mt-1 text-xl font-bold text-[color:var(--text-heading)]">
                {content.title}
              </h2>
            </div>
          </div>
          <IconButton label="재시도 안내 닫기" variant="ghost" disabled={isPending} onClick={onClose}>
            <Icon icon={CloseCircle} size={20} aria-hidden="true" />
          </IconButton>
        </header>

        <p
          id="strategy-retry-dialog-description"
          className="p-5 text-sm leading-6 text-[color:var(--text-body)] sm:p-6"
        >
          {content.description}
        </p>

        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="ghost" disabled={isPending} onClick={onClose}>
            {isDateAdjustment ? '취소' : '닫기'}
          </Button>
          <Button
            ref={primaryButtonRef}
            type="button"
            disabled={isPending}
            onClick={isDateAdjustment ? onConfirm : onNavigateInventory}
          >
            {isPending ? (
              <Icon icon={Refresh} size={17} className="motion-safe:animate-spin" aria-hidden="true" />
            ) : null}
            {content.actionLabel}
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
