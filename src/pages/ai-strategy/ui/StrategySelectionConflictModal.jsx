import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseCircle, Refresh, Warning } from 'reicon-react';
import { resolveAiStrategySelectionConflict } from '@/entities/strategy';
import { Alert, Button, Icon, IconButton } from '@/shared/ui';

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function StrategySelectionConflictModal({ error, onClose, onReadjust, onCreateNew }) {
  const dialogRef = useRef(null);
  const primaryButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const conflict = resolveAiStrategySelectionConflict(error);
  const hasQuantityDetails = conflict.requestedQuantity !== null && conflict.currentAvailableQuantity !== null;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    primaryButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.();
      if (event.key !== 'Tab') return;

      const focusableElements = [...(dialogRef.current?.querySelectorAll(focusableSelector) ?? [])];
      if (!focusableElements.length) return;
      const first = focusableElements[0];
      const last = focusableElements.at(-1);
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
      previouslyFocusedElement?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="strategy-selection-conflict-title"
        aria-describedby="strategy-selection-conflict-description"
        className="w-full max-w-lg overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--background)] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--warning-soft)] text-[color:var(--warning)]">
              <Icon icon={Warning} size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--warning)]">
                EXECUTION CONDITION CHANGED
              </p>
              <h2
                id="strategy-selection-conflict-title"
                className="mt-1 text-xl font-bold text-[color:var(--text-heading)]"
              >
                전략을 실행할 수 없습니다
              </h2>
            </div>
          </div>
          <IconButton label="실행 조건 변경 안내 닫기" variant="ghost" onClick={onClose}>
            <Icon icon={CloseCircle} size={20} aria-hidden="true" />
          </IconButton>
        </header>

        <div className="grid gap-4 p-5 sm:p-6">
          <p id="strategy-selection-conflict-description" className="text-sm leading-6 text-[color:var(--text-body)]">
            전략 생성 이후 재고 또는 판매 조건이 변경되었습니다. 최신 조건으로 다시 조정하거나 새로운 전략을 생성해
            주세요.
          </p>

          <Alert variant="warning" title={conflict.reasonMessage}>
            {hasQuantityDetails ? (
              <p>
                요청 수량 {conflict.requestedQuantity}개 · 현재 가용재고 {conflict.currentAvailableQuantity}개
              </p>
            ) : null}
          </Alert>

          <p className="text-xs leading-5 text-[color:var(--text-muted)]">
            현재 입력한 수량·할인율·기간은 유지됩니다. 최신 조건을 확인한 뒤 조건을 다시 적용해 주세요.
          </p>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button type="button" variant="secondary" onClick={onCreateNew}>
            새 전략 생성
          </Button>
          <Button ref={primaryButtonRef} type="button" onClick={onReadjust}>
            <Icon icon={Refresh} size={17} aria-hidden="true" />
            최신 조건으로 다시 조정
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
