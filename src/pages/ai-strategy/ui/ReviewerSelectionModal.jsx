import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { CloseCircle, SearchNormal, Send } from 'reicon-react';
import {
  aiStrategyReviewerQueryOptions,
  isAiStrategySelectionConflict,
  sendAiStrategyTeamsRequest,
} from '@/entities/strategy';
import { Alert, Badge, Button, Checkbox, Icon, IconButton, Input } from '@/shared/ui';

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const MAX_REVIEWERS = 10;

function mergeDeliveryResults(previous, current) {
  if (!previous) return current;
  const reviewers = new Map(previous.reviewers.map((reviewer) => [reviewer.reviewerId, reviewer]));
  current.reviewers.forEach((reviewer) => reviewers.set(reviewer.reviewerId, reviewer));
  return { ...current, reviewers: [...reviewers.values()] };
}

function ReviewerDeliveryResult({ result, reviewersById }) {
  const sent = result.reviewers.filter((reviewer) => reviewer.deliveryStatus === 'SENT');
  const failed = result.reviewers.filter((reviewer) => reviewer.deliveryStatus !== 'SENT');

  return (
    <div className="grid gap-3" aria-live="polite">
      {sent.length ? (
        <Alert variant="good" title={`${sent.length}명에게 Teams 검토 요청을 전송했습니다.`}>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {sent.map((delivery) => {
              const reviewer = reviewersById.get(delivery.reviewerId);
              return (
                <li key={delivery.reviewerId}>
                  {reviewer
                    ? `${reviewer.reviewerName} · ${reviewer.email}`
                    : delivery.reviewerName && delivery.email
                      ? `${delivery.reviewerName} · ${delivery.email}`
                      : '선택한 Reviewer'}
                </li>
              );
            })}
          </ul>
        </Alert>
      ) : null}
      {failed.length ? (
        <Alert variant="danger" title={`${failed.length}명에게 전송하지 못했습니다.`}>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {failed.map((delivery) => {
              const reviewer = reviewersById.get(delivery.reviewerId);
              const reason = delivery.failureCode;
              return (
                <li key={delivery.reviewerId}>
                  {reviewer
                    ? `${reviewer.reviewerName} · ${reviewer.email}`
                    : delivery.reviewerName && delivery.email
                      ? `${delivery.reviewerName} · ${delivery.email}`
                      : '선택한 Reviewer'}
                  {reason ? ` — ${reason}` : ''}
                </li>
              );
            })}
          </ul>
        </Alert>
      ) : null}
    </div>
  );
}

export function ReviewerSelectionModal({
  strategyCaseId,
  option,
  selectionPayload,
  initialDeliveryResult,
  onClose,
  onCompleted,
  onSelectionConflict,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deliveryResult, setDeliveryResult] = useState(initialDeliveryResult ?? null);
  const reviewersQuery = useQuery(aiStrategyReviewerQueryOptions());
  const teamsMutation = useMutation({
    mutationFn: (reviewerIds) =>
      sendAiStrategyTeamsRequest(strategyCaseId, {
        ...selectionPayload,
        reviewerIds,
      }),
    onSuccess: (result) => {
      const mergedResult = mergeDeliveryResults(deliveryResult, result);
      setDeliveryResult(mergedResult);
      onCompleted?.(mergedResult);
    },
    onError: (error) => {
      if (isAiStrategySelectionConflict(error)) onSelectionConflict?.(error);
    },
  });
  const isSending = teamsMutation.isPending;
  const isSendingRef = useRef(isSending);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isSendingRef.current = isSending;
  }, [isSending]);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSendingRef.current) onCloseRef.current?.();
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

  const filteredReviewers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    if (!normalizedQuery) return reviewersQuery.data ?? [];
    return (reviewersQuery.data ?? []).filter((reviewer) =>
      `${reviewer.reviewerName} ${reviewer.email}`.toLocaleLowerCase('ko-KR').includes(normalizedQuery),
    );
  }, [query, reviewersQuery.data]);
  const reviewersById = useMemo(
    () => new Map((reviewersQuery.data ?? []).map((reviewer) => [reviewer.reviewerId, reviewer])),
    [reviewersQuery.data],
  );
  const failedReviewerIds = useMemo(
    () =>
      deliveryResult?.reviewers
        .filter(({ deliveryStatus }) => deliveryStatus !== 'SENT')
        .map(({ reviewerId }) => reviewerId) ?? [],
    [deliveryResult],
  );

  const toggleReviewer = (reviewerId) => {
    teamsMutation.reset();
    setSelectedIds((current) => {
      if (current.includes(reviewerId)) return current.filter((id) => id !== reviewerId);
      return current.length >= MAX_REVIEWERS ? current : [...current, reviewerId];
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSending) onClose?.();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reviewer-dialog-title"
        aria-describedby="reviewer-dialog-description"
        className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--background)] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--primary)]">TEAMS REVIEW</p>
            <h2 id="reviewer-dialog-title" className="mt-1 text-xl font-bold text-[color:var(--text-heading)]">
              Reviewer 선택
            </h2>
            <p id="reviewer-dialog-description" className="mt-2 text-sm text-[color:var(--text-muted)]">
              {option.optionName}을 검토할 담당자를 한 명 이상 선택해 주세요.
            </p>
          </div>
          <IconButton
            ref={closeButtonRef}
            label="Reviewer 선택 모달 닫기"
            variant="ghost"
            disabled={isSending}
            onClick={onClose}
          >
            <Icon icon={CloseCircle} size={20} aria-hidden="true" />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {deliveryResult ? (
            <ReviewerDeliveryResult result={deliveryResult} reviewersById={reviewersById} />
          ) : (
            <>
              <label htmlFor="reviewer-search" className="text-sm font-bold text-[color:var(--text-heading)]">
                Reviewer 검색
              </label>
              <div className="relative mt-2">
                <Icon
                  icon={SearchNormal}
                  size={17}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]"
                />
                <Input
                  id="reviewer-search"
                  value={query}
                  className="pl-9"
                  placeholder="이름 또는 이메일 검색"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-[color:var(--text-muted)]">같은 이름은 이메일로 구분할 수 있습니다.</span>
                <Badge variant={selectedIds.length ? 'good' : 'neutral'}>
                  {selectedIds.length}/{MAX_REVIEWERS}명 선택
                </Badge>
              </div>

              {reviewersQuery.isPending ? (
                <div className="mt-4 grid gap-2" role="status" aria-label="Reviewer 목록 불러오는 중">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-[74px] animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-subtle)]"
                    />
                  ))}
                </div>
              ) : reviewersQuery.isError ? (
                <Alert variant="danger" title="Reviewer 목록을 불러오지 못했습니다." className="mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>{reviewersQuery.error?.message ?? '잠시 후 다시 시도해 주세요.'}</span>
                    <Button type="button" size="sm" variant="secondary" onClick={() => reviewersQuery.refetch()}>
                      다시 시도
                    </Button>
                  </div>
                </Alert>
              ) : filteredReviewers.length ? (
                <ul className="mt-4 grid gap-2" aria-label="Reviewer 목록">
                  {filteredReviewers.map((reviewer) => {
                    const checked = selectedIds.includes(reviewer.reviewerId);
                    const selectionLimitReached = !checked && selectedIds.length >= MAX_REVIEWERS;
                    return (
                      <li key={reviewer.reviewerId}>
                        <label
                          className={`flex items-start gap-3 rounded-[var(--radius-card)] border p-4 transition-colors ${
                            selectionLimitReached ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                          } ${
                            checked
                              ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                              : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-strong)]'
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={isSending || selectionLimitReached}
                            onChange={() => toggleReviewer(reviewer.reviewerId)}
                            aria-label={`${reviewer.reviewerName} ${reviewer.email} 선택`}
                          />
                          <span className="min-w-0 flex-1">
                            <strong className="block text-sm text-[color:var(--text-heading)]">
                              {reviewer.reviewerName}
                            </strong>
                            <span className="mt-0.5 block break-all text-xs text-[color:var(--text-body)]">
                              {reviewer.email}
                            </span>
                            {reviewer.organizationName || reviewer.roleName ? (
                              <span className="mt-1 block text-xs text-[color:var(--text-muted)]">
                                {[reviewer.organizationName, reviewer.roleName].filter(Boolean).join(' · ')}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 rounded-[var(--radius-card)] bg-[var(--surface-subtle)] px-4 py-8 text-center text-sm text-[color:var(--text-muted)]">
                  {query ? '검색 조건에 맞는 Reviewer가 없습니다.' : '선택할 수 있는 Reviewer가 없습니다.'}
                </p>
              )}
            </>
          )}

          {teamsMutation.isError && !isAiStrategySelectionConflict(teamsMutation.error) ? (
            <Alert variant="danger" title="Teams 검토 요청을 전송하지 못했습니다." className="mt-4">
              {teamsMutation.error?.message ?? '잠시 후 다시 시도해 주세요.'}
            </Alert>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:px-6">
          <p className="text-xs text-[color:var(--text-muted)]">
            {deliveryResult
              ? failedReviewerIds.length
                ? '실패한 Reviewer만 다시 전송할 수 있습니다.'
                : '모든 Reviewer에게 전송했습니다.'
              : '검토자를 한 명 이상 선택해 주세요.'}
          </p>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="secondary" disabled={isSending} onClick={onClose}>
              닫기
            </Button>
            {!deliveryResult ? (
              <Button
                type="button"
                disabled={selectedIds.length === 0 || reviewersQuery.isPending || isSending}
                onClick={() => teamsMutation.mutate(selectedIds)}
              >
                <Icon icon={Send} size={17} aria-hidden="true" />
                {isSending ? '전송 중...' : `Teams로 전송${selectedIds.length ? ` (${selectedIds.length}명)` : ''}`}
              </Button>
            ) : null}
            {deliveryResult && failedReviewerIds.length > 0 && deliveryResult.caseStatus === 'GENERATED' ? (
              <Button type="button" disabled={isSending} onClick={() => teamsMutation.mutate(failedReviewerIds)}>
                <Icon icon={Send} size={17} aria-hidden="true" />
                {isSending ? '재전송 중...' : `실패 대상 재시도 (${failedReviewerIds.length}명)`}
              </Button>
            ) : null}
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
