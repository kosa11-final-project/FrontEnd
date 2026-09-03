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

function isPresent(value) {
  return value !== null && value !== undefined && value !== '';
}

function formatChangeValue(value, unit = '') {
  if (!isPresent(value)) return '-';
  if (typeof value === 'boolean') return value ? '예' : '아니요';
  return `${String(value)}${unit}`;
}

function formatValidatedAt(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR');
}

function ChangeSubject({ subject }) {
  if (!subject) return null;
  const identifiers = [
    ['재고', subject.inventoryBalanceId],
    ['LOT', subject.lotId],
    ['물류센터', subject.warehouseId],
    ['판매처', subject.salesPointId],
  ].filter(([, value]) => isPresent(value));
  if (!identifiers.length) return null;

  return (
    <p className="mt-1 text-[11px] leading-4 text-[color:var(--text-muted)]">
      {identifiers.map(([label, value]) => `${label} #${value}`).join(' · ')}
    </p>
  );
}

function ConditionChangeItem({ change }) {
  const comparisonPrevious = isPresent(change.previousValue) ? change.previousValue : change.requestedValue;
  const comparisonCurrent = isPresent(change.currentValue) ? change.currentValue : change.suggestedValue;
  const hasRequestSuggestion =
    (isPresent(change.requestedValue) || isPresent(change.suggestedValue)) &&
    (change.requestedValue !== comparisonPrevious || change.suggestedValue !== comparisonCurrent);

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <strong className="text-sm text-[color:var(--text-heading)]">{change.label}</strong>
          <ChangeSubject subject={change.subject} />
        </div>
        <span className="rounded-full bg-[var(--warning-soft)] px-2 py-1 text-[10px] font-bold text-[color:var(--warning)]">
          {change.type || 'CONDITION_CHANGED'}
        </span>
      </div>

      {(isPresent(comparisonPrevious) || isPresent(comparisonCurrent)) && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold tabular-nums text-[color:var(--text-heading)]">
          <span>{formatChangeValue(comparisonPrevious, change.unit)}</span>
          <span aria-hidden="true" className="text-[color:var(--warning)]">
            →
          </span>
          <span className="text-[color:var(--warning)]">{formatChangeValue(comparisonCurrent, change.unit)}</span>
        </p>
      )}

      {hasRequestSuggestion ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[var(--surface-subtle)] p-3 text-xs">
          <div>
            <dt className="text-[color:var(--text-muted)]">요청값</dt>
            <dd className="mt-1 font-semibold text-[color:var(--text-heading)]">
              {formatChangeValue(change.requestedValue, change.unit)}
            </dd>
          </div>
          <div>
            <dt className="text-[color:var(--text-muted)]">최신 허용값</dt>
            <dd className="mt-1 font-semibold text-[color:var(--warning)]">
              {formatChangeValue(change.suggestedValue, change.unit)}
            </dd>
          </div>
        </dl>
      ) : null}

      {change.reason ? <p className="mt-3 text-xs leading-5 text-[color:var(--text-body)]">{change.reason}</p> : null}
    </li>
  );
}

export function StrategySelectionConflictModal({ error, onClose, onReadjust, onCreateNew }) {
  const dialogRef = useRef(null);
  const primaryButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const conflict = resolveAiStrategySelectionConflict(error);
  const hasQuantityDetails = conflict.requestedQuantity !== null && conflict.currentAvailableQuantity !== null;
  const validatedAt = formatValidatedAt(conflict.validatedAt);

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
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--background)] shadow-2xl"
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

        <div className="grid min-h-0 gap-4 overflow-y-auto p-5 sm:p-6">
          <p id="strategy-selection-conflict-description" className="text-sm leading-6 text-[color:var(--text-body)]">
            전략 생성 이후 재고 또는 판매 조건이 변경되었습니다. 최신 조건으로 다시 조정하거나 새로운 전략을 생성해
            주세요.
          </p>

          <Alert variant="warning" title={conflict.reasonMessage}>
            {validatedAt ? <p>최종 검증 시각 {validatedAt}</p> : null}
            {!conflict.hasStructuredChanges && hasQuantityDetails ? (
              <p>
                요청 수량 {conflict.requestedQuantity}개 · 현재 가용재고 {conflict.currentAvailableQuantity}개
              </p>
            ) : null}
          </Alert>

          {conflict.hasStructuredChanges ? (
            <section aria-labelledby="strategy-condition-changes-title">
              <h3
                id="strategy-condition-changes-title"
                className="mb-2 text-sm font-bold text-[color:var(--text-heading)]"
              >
                실행 조건 변경 내역
              </h3>
              <ul className="grid gap-2">
                {conflict.changes.map((change) => (
                  <ConditionChangeItem key={change.key} change={change} />
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-xs leading-5 text-[color:var(--text-muted)]">
            변경되지 않은 조건은 유지됩니다. 실행할 수 없는 조건은 최신 허용값으로 조정됩니다.
          </p>

          {!conflict.retryableWithAdjustment ? (
            <p className="rounded-lg bg-[var(--warning-soft)] px-3 py-2 text-xs leading-5 text-[color:var(--warning)]">
              재고 위치·판매처·가격·비용처럼 자동으로 바꿀 수 없는 조건이 포함되어 새 전략 생성이 필요합니다.
            </p>
          ) : null}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            ref={conflict.retryableWithAdjustment ? undefined : primaryButtonRef}
            type="button"
            variant={conflict.retryableWithAdjustment ? 'secondary' : 'primary'}
            onClick={onCreateNew}
          >
            새 전략 생성
          </Button>
          <Button
            ref={conflict.retryableWithAdjustment ? primaryButtonRef : undefined}
            type="button"
            onClick={() => onReadjust?.(conflict)}
            disabled={!conflict.retryableWithAdjustment}
          >
            <Icon icon={Refresh} size={17} aria-hidden="true" />
            {conflict.retryableWithAdjustment ? '최신 조건으로 다시 조정' : '자동 조정 불가'}
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
