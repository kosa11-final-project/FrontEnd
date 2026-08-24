import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { ArrowRight, Calendar, CloseCircle, DocumentText, InfoCircle, Layers, Store } from 'reicon-react';
import { inventoryLotsQueryOptions } from '@/entities/inventory';
import {
  STRATEGY_REQUEST_TYPES,
  StrategyProductImage,
  buildStrategyRequestPayload,
  createStrategyRequestDraft,
  hasStrategyRequestPreference,
  validateStrategyRequestDraft,
} from '@/entities/strategy';
import { formatNumber } from '@/shared/lib/format';
import { Alert, Badge, Button, Card, Checkbox, Icon, IconButton, Input, Select } from '@/shared/ui';

function getSeoulToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function FieldLabel({ htmlFor, children, optional = false }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 flex items-center gap-2 text-sm font-bold text-[color:var(--text-heading)]"
    >
      {children}
      {optional ? <span className="text-xs font-medium text-[color:var(--text-muted)]">선택</span> : null}
    </label>
  );
}

function ProductTargetTab({ item, index, active, ready, needsAttention, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-[240px] items-center gap-3 rounded-[var(--radius-card)] border p-3 text-left transition-colors ${
        active
          ? 'border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-soft)]'
          : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-strong)]'
      }`}
    >
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
          active ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-subtle)] text-[color:var(--text-muted)]'
        }`}
      >
        {index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm text-[color:var(--text-heading)]">{item.productName}</strong>
        <span className="mt-0.5 block truncate text-xs text-[color:var(--text-muted)]">{item.skuCode}</span>
      </span>
      <Badge variant={needsAttention ? 'danger' : ready ? 'good' : 'neutral'}>
        {needsAttention ? '확인 필요' : ready ? '입력 완료' : '미입력'}
      </Badge>
    </button>
  );
}

function TargetProductSummary({ item }) {
  return (
    <Card padding="md" className="flex flex-wrap items-center gap-4">
      <StrategyProductImage src={item.imageUrl} alt={`${item.productName} 상품 이미지`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="good">생성 대상</Badge>
          {item.categoryName ? <Badge variant="neutral">{item.categoryName}</Badge> : null}
        </div>
        <h2 className="mt-2 truncate text-lg font-bold text-[color:var(--text-heading)]">{item.productName}</h2>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          {item.skuCode} · {item.skuName || 'SKU 규격 미제공'}
        </p>
      </div>
      <dl className="grid min-w-[220px] grid-cols-2 gap-3 rounded-xl bg-[var(--surface-subtle)] p-3 text-right">
        <div>
          <dt className="text-xs text-[color:var(--text-muted)]">현재고</dt>
          <dd className="mt-1 text-base font-bold text-[color:var(--text-heading)]">
            {item.currentQuantity == null ? '-' : `${formatNumber(item.currentQuantity)}개`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[color:var(--text-muted)]">판매 가능</dt>
          <dd className="mt-1 text-base font-bold text-[color:var(--primary)]">
            {item.availableQuantity == null ? '-' : `${formatNumber(item.availableQuantity)}개`}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function StrategyTypeSelector({ values, disabled, onChange }) {
  const toggle = (type) => {
    onChange(values.includes(type) ? values.filter((value) => value !== type) : [...values, type]);
  };

  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-bold text-[color:var(--text-heading)]">희망 전략 타입</legend>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
        선택 순서가 우선순위로 전송됩니다. 전체 추천을 선택했다면 체크를 해제한 뒤 입력할 수 있습니다.
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {STRATEGY_REQUEST_TYPES.map((option) => {
          const order = values.indexOf(option.value);
          const checked = order >= 0;
          return (
            <label
              key={option.value}
              className={`flex items-start gap-3 rounded-[var(--radius-card)] border p-3 transition-colors ${
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              } ${
                checked
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                  : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-strong)]'
              }`}
            >
              <Checkbox checked={checked} onChange={() => toggle(option.value)} aria-label={option.label} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <strong className="text-sm text-[color:var(--text-heading)]">{option.label}</strong>
                  {checked ? <Badge variant="good">우선순위 {order + 1}</Badge> : null}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[color:var(--text-muted)]">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function LotSelector({ lots, selectedIds, sourceSelected, disabled, isLoading, isError, onRetry, onChange }) {
  if (!sourceSelected) {
    return (
      <Alert variant="info" title="출발 판매처를 먼저 선택해 주세요.">
        판매처를 선택하면 해당 SKU·판매처의 활성 LOT와 판매 가능 수량을 조회합니다.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div role="status" className="space-y-2" aria-label="LOT 목록 불러오는 중">
        {[1, 2].map((item) => (
          <div key={item} className="h-16 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-subtle)]" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger" title="LOT 정보를 불러오지 못했습니다.">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>서버 연결을 확인한 뒤 다시 시도해 주세요.</span>
          <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      </Alert>
    );
  }

  if (!lots.length) {
    return (
      <Alert variant="info" title="선택한 판매처에 활성 LOT가 없습니다.">
        LOT를 지정하지 않고 요청하면 AI가 가용 재고와 FEFO/FIFO 기준으로 대상을 판단합니다.
      </Alert>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {lots.map((lot) => {
        const checked = selectedIds.includes(lot.id);
        return (
          <label
            key={lot.id}
            className={`flex items-start gap-3 rounded-[var(--radius-card)] border p-3 ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            } ${
              checked ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-[var(--border)] bg-[var(--card)]'
            }`}
          >
            <Checkbox
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(checked ? selectedIds.filter((id) => id !== lot.id) : [...selectedIds, lot.id])}
              aria-label={`${lot.lotNumber ?? lot.id} LOT 선택`}
            />
            <span className="min-w-0">
              <strong className="block truncate text-sm text-[color:var(--text-heading)]">
                {lot.lotNumber ?? `LOT ${lot.id}`}
              </strong>
              <span className="mt-1 block text-xs text-[color:var(--text-muted)]">
                판매 가능 {lot.availableQuantity == null ? '-' : `${formatNumber(lot.availableQuantity)}개`}
                {lot.expiryDate ? ` · 소비기한 ${lot.expiryDate}` : ''}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function CandidateSalesPointSelector({ points, sourceCode, values, disabled, onChange }) {
  const candidates = points.filter((point) => point.salesPointCode !== sourceCode);

  if (!candidates.length) {
    return (
      <p className="rounded-[var(--radius-card)] bg-[var(--surface-subtle)] p-3 text-xs text-[color:var(--text-muted)]">
        후보를 지정하지 않으면 접근 가능한 전체 활성 판매처를 평가합니다.
      </p>
    );
  }

  return (
    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
      {candidates.map((point) => {
        const order = values.indexOf(point.salesPointCode);
        const checked = order >= 0;
        return (
          <label
            key={point.salesPointCode}
            className={`flex items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2.5 ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            } ${
              checked ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-[var(--border)] bg-[var(--card)]'
            }`}
          >
            <Checkbox
              checked={checked}
              disabled={disabled}
              onChange={() =>
                onChange(
                  checked ? values.filter((code) => code !== point.salesPointCode) : [...values, point.salesPointCode],
                )
              }
              aria-label={`${point.salesPointName} 후보 판매처 선택`}
            />
            <span className="min-w-0 flex-1 truncate text-sm text-[color:var(--text-heading)]">
              {point.salesPointName}
            </span>
            {checked ? <Badge variant="good">{order + 1}순위</Badge> : null}
          </label>
        );
      })}
    </div>
  );
}

function RequestSummary({ item, draft, productCount, completedCount, onSubmit }) {
  const selectedTypeLabels = draft.strategyTypes.map(
    (type) => STRATEGY_REQUEST_TYPES.find((option) => option.value === type)?.label ?? type,
  );

  return (
    <aside className="xl:sticky xl:top-24 xl:self-start">
      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--primary)]">REQUEST SUMMARY</p>
          <h2 className="mt-1 text-lg font-bold text-[color:var(--text-heading)]">생성 요청 요약</h2>
          <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
            {productCount}개 상품은 각각 독립된 AI 전략 Case로 생성됩니다.
          </p>
          <Badge className="mt-3" variant={completedCount === productCount ? 'good' : 'warning'}>
            요청 조건 입력 {completedCount}/{productCount}
          </Badge>
        </div>
        <dl className="grid gap-4 p-5 text-sm">
          <div>
            <dt className="text-xs text-[color:var(--text-muted)]">현재 대상 SKU</dt>
            <dd className="mt-1 font-bold text-[color:var(--text-heading)]">{item.skuCode}</dd>
          </div>
          <div>
            <dt className="text-xs text-[color:var(--text-muted)]">전략명</dt>
            <dd className="mt-1 text-[color:var(--text-body)]">{draft.caseName.trim() || '서버 기본 제목 사용'}</dd>
          </div>
          <div>
            <dt className="text-xs text-[color:var(--text-muted)]">출발 판매처</dt>
            <dd className="mt-1 text-[color:var(--text-body)]">
              {item.salesPoints.find((point) => point.salesPointCode === draft.sourceSalesPointCode)?.salesPointName ??
                'AI 자동 선택'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[color:var(--text-muted)]">고정 조건</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {draft.recommendAllConditions ? (
                <Badge variant="good">조건 전체 AI 추천</Badge>
              ) : (
                <>
                  <Badge variant="neutral">LOT {draft.lotIds.length || '자동'}</Badge>
                  <Badge variant="neutral">후보 판매처 {draft.candidateSalesPointCodes.length || '전체'}</Badge>
                  <Badge variant="neutral">
                    기간 {draft.preferredStartDate || draft.preferredEndDate ? '지정' : 'AI 추천'}
                  </Badge>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[color:var(--text-muted)]">전략 타입 우선순위</dt>
            <dd className="mt-1 text-[color:var(--text-body)]">
              {selectedTypeLabels.length ? selectedTypeLabels.join(' → ') : '전체 타입에서 AI 선택'}
            </dd>
          </div>
        </dl>
        <div className="border-t border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <Button type="button" size="lg" className="w-full" onClick={onSubmit}>
            AI 전략 생성 요청 <Icon icon={ArrowRight} size={17} aria-hidden="true" />
          </Button>
          <p className="mt-2 text-center text-[11px] leading-4 text-[color:var(--text-muted)]">
            현재는 화면 검토용이며 서버에 전송하지 않습니다.
          </p>
        </div>
      </Card>
    </aside>
  );
}

function StrategyRequestModalContent({ selectedItems, onClose }) {
  const closeButtonRef = useRef(null);
  const [activeSkuCode, setActiveSkuCode] = useState(() => selectedItems[0]?.skuCode ?? '');
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(selectedItems.map((item) => [item.skuCode, createStrategyRequestDraft(item)])),
  );
  const [errorsBySku, setErrorsBySku] = useState({});
  const [submittedPayloads, setSubmittedPayloads] = useState(null);
  const today = getSeoulToday();

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement?.focus?.();
    };
  }, [onClose]);

  const activeItem = selectedItems.find((item) => item.skuCode === activeSkuCode) ?? selectedItems[0];
  const draft = drafts[activeItem.skuCode] ?? createStrategyRequestDraft(activeItem);
  const errors = errorsBySku[activeItem.skuCode] ?? {};
  const completedCount = selectedItems.filter((item) => hasStrategyRequestPreference(drafts[item.skuCode])).length;
  const selectedSourceCode = draft.recommendAllConditions ? '' : draft.sourceSalesPointCode;
  const lotsQuery = useQuery({
    ...inventoryLotsQueryOptions(activeItem.skuCode, selectedSourceCode),
    enabled: Boolean(selectedSourceCode),
  });

  const updateDraft = (changes) => {
    setSubmittedPayloads(null);
    setDrafts((current) => ({
      ...current,
      [activeItem.skuCode]: { ...current[activeItem.skuCode], ...changes },
    }));
    setErrorsBySku((current) => ({ ...current, [activeItem.skuCode]: {} }));
  };

  const handleSourceChange = (event) => {
    const code = event.target.value;
    const point = activeItem.salesPoints.find((candidate) => candidate.salesPointCode === code);
    updateDraft({
      sourceSalesPointCode: code,
      sourceSalesPointId: point?.salesPointId ?? null,
      candidateSalesPointCodes: draft.candidateSalesPointCodes.filter((candidateCode) => candidateCode !== code),
      candidateSalesPointIds: draft.candidateSalesPointIds.filter((id) => id !== point?.salesPointId),
      lotIds: [],
    });
  };

  const handleCandidateChange = (codes) => {
    const ids = codes
      .map((code) => activeItem.salesPoints.find((point) => point.salesPointCode === code)?.salesPointId)
      .filter((id) => id != null);
    updateDraft({ candidateSalesPointCodes: codes, candidateSalesPointIds: ids });
  };

  const handleRecommendAllConditions = (checked) => {
    updateDraft({
      recommendAllConditions: checked,
      ...(checked
        ? {
            sourceSalesPointCode: '',
            sourceSalesPointId: null,
            lotIds: [],
            candidateSalesPointCodes: [],
            candidateSalesPointIds: [],
            strategyTypes: [],
            preferredStartDate: '',
            preferredEndDate: '',
          }
        : {}),
    });
  };

  const handleSubmit = () => {
    const nextErrors = {};
    let firstInvalidSku = '';

    selectedItems.forEach((item) => {
      const itemDraft = drafts[item.skuCode];
      const itemErrors = validateStrategyRequestDraft(itemDraft, today);
      if (Object.keys(itemErrors).length) {
        nextErrors[item.skuCode] = itemErrors;
        firstInvalidSku ||= item.skuCode;
      }
    });

    setErrorsBySku(nextErrors);
    if (firstInvalidSku) {
      setActiveSkuCode(firstInvalidSku);
      return;
    }

    setSubmittedPayloads(selectedItems.map((item) => buildStrategyRequestPayload(drafts[item.skuCode])));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="strategy-request-dialog-title"
        className="flex max-h-[92vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--background)] shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--card)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--primary)]">
              AI STRATEGY REQUEST
            </p>
            <h2 id="strategy-request-dialog-title" className="mt-1 text-xl font-bold text-[color:var(--text-heading)]">
              AI 전략 생성
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              상품마다 조건을 하나 이상 설정하거나 전체 조건 AI 추천을 선택해야 합니다.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-[color:var(--text-muted)] sm:flex">
              <Badge variant="good">1 · 요청 조건</Badge>
              <Icon icon={ArrowRight} size={14} aria-hidden="true" />
              <Badge variant="outline">2 · 생성 상태 확인</Badge>
            </div>
            <IconButton ref={closeButtonRef} label="AI 전략 생성 팝업 닫기" variant="ghost" onClick={onClose}>
              <Icon icon={CloseCircle} size={20} aria-hidden="true" />
            </IconButton>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <Alert variant="info" title={`선택한 ${selectedItems.length}개 SKU는 각각 별도의 전략 Case로 생성됩니다.`}>
            상품 탭마다 조건을 하나 이상 입력해 주세요. 직접 정하지 않으려면 각 상품에서 전체 조건 AI 추천을 선택할 수
            있습니다.
          </Alert>

          {submittedPayloads ? (
            <Alert
              variant="good"
              title={`${submittedPayloads.length}건의 목업 요청 구성이 완료되었습니다.`}
              className="mt-4"
            >
              실제 API 연결 시 각 요청에 별도의 <code>Idempotency-Key</code>를 발급하고 생성 상태 목록으로 이동합니다.
            </Alert>
          ) : null}

          <section className="mt-5" aria-label="전략 생성 대상 상품 선택">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {selectedItems.map((item, index) => (
                <ProductTargetTab
                  key={item.skuCode}
                  item={item}
                  index={index}
                  active={item.skuCode === activeItem.skuCode}
                  ready={hasStrategyRequestPreference(drafts[item.skuCode])}
                  needsAttention={Boolean(errorsBySku[item.skuCode]?.requestPreference)}
                  onClick={() => setActiveSkuCode(item.skuCode)}
                />
              ))}
            </div>
          </section>

          <div className="mt-4 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
              <TargetProductSummary item={activeItem} />

              <Card padding="lg">
                <div className="mb-5 flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-lg bg-[var(--primary-soft)] text-[color:var(--primary)]">
                        <Icon icon={DocumentText} size={17} aria-hidden="true" />
                      </span>
                      <h2 className="text-lg font-bold text-[color:var(--text-heading)]">기본 정보</h2>
                    </div>
                    <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                      전략명은 비워두면 서버가 상품명과 생성 시각으로 만듭니다.
                    </p>
                  </div>
                  <Badge variant="outline">{activeItem.skuCode}</Badge>
                </div>

                <div>
                  <FieldLabel htmlFor="case-name" optional>
                    전략명
                  </FieldLabel>
                  <Input
                    id="case-name"
                    value={draft.caseName}
                    maxLength={201}
                    tone={errors.caseName ? 'error' : 'default'}
                    placeholder={`${activeItem.productName} AI 전략`}
                    onChange={(event) => updateDraft({ caseName: event.target.value })}
                    aria-describedby={errors.caseName ? 'case-name-error' : 'case-name-help'}
                  />
                  <div className="mt-1 flex justify-between gap-3 text-xs">
                    <span
                      id={errors.caseName ? 'case-name-error' : 'case-name-help'}
                      className={errors.caseName ? 'text-[color:var(--danger)]' : 'text-[color:var(--text-muted)]'}
                    >
                      {errors.caseName ?? '미입력 시 서버 기본 제목을 사용합니다.'}
                    </span>
                    <span className="tabular-nums text-[color:var(--text-muted)]">{draft.caseName.length}/200</span>
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <div className="mb-5 flex items-center gap-2 border-b border-[var(--border)] pb-4">
                  <span className="grid size-8 place-items-center rounded-lg bg-[var(--primary-soft)] text-[color:var(--primary)]">
                    <Icon icon={Store} size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-[color:var(--text-heading)]">재고 위치와 판매처</h2>
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                      출발 위치와 이동·판매 후보를 고정하지 않으면 AI가 실행 가능성을 평가합니다.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="source-sales-point" optional>
                      현재·출발 판매처
                    </FieldLabel>
                    <Select
                      id="source-sales-point"
                      value={draft.sourceSalesPointCode}
                      disabled={draft.recommendAllConditions}
                      onChange={handleSourceChange}
                    >
                      <option value="">AI 자동 선택</option>
                      {activeItem.unassignedInventory?.hasStock ? (
                        <option value="UNASSIGNED">공용 미할당 재고</option>
                      ) : null}
                      {activeItem.salesPoints.map((point) => (
                        <option key={point.salesPointCode} value={point.salesPointCode}>
                          {point.salesPointName}
                        </option>
                      ))}
                    </Select>
                    <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
                      공용 창고를 고정하려면 아래에서 해당 창고의 LOT를 선택해야 합니다.
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[color:var(--text-heading)]">희망 후보 판매처</span>
                      <span className="text-xs text-[color:var(--text-muted)]">선택 순서 = 우선순위</span>
                    </div>
                    <CandidateSalesPointSelector
                      points={activeItem.salesPoints}
                      sourceCode={draft.sourceSalesPointCode}
                      values={draft.candidateSalesPointCodes}
                      disabled={draft.recommendAllConditions}
                      onChange={handleCandidateChange}
                    />
                  </div>
                </div>

                <div className="mt-6 border-t border-[var(--border)] pt-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[color:var(--text-heading)]">대상 LOT</span>
                    <span className="text-xs text-[color:var(--text-muted)]">미선택 시 FEFO/FIFO 자동 선택</span>
                  </div>
                  <LotSelector
                    lots={lotsQuery.data?.items ?? []}
                    selectedIds={draft.lotIds}
                    sourceSelected={Boolean(selectedSourceCode)}
                    disabled={draft.recommendAllConditions}
                    isLoading={lotsQuery.isLoading}
                    isError={lotsQuery.isError}
                    onRetry={() => lotsQuery.refetch()}
                    onChange={(lotIds) => updateDraft({ lotIds })}
                  />
                </div>
              </Card>

              <Card padding="lg">
                <div className="mb-5 flex items-center gap-2 border-b border-[var(--border)] pb-4">
                  <span className="grid size-8 place-items-center rounded-lg bg-[var(--primary-soft)] text-[color:var(--primary)]">
                    <Icon icon={Layers} size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-[color:var(--text-heading)]">전략 범위</h2>
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                      초기 지원 5개 타입만 노출하며 쿠폰·포인트·무료배송은 포함하지 않습니다.
                    </p>
                  </div>
                </div>
                <StrategyTypeSelector
                  values={draft.strategyTypes}
                  disabled={draft.recommendAllConditions}
                  onChange={(strategyTypes) => updateDraft({ strategyTypes })}
                />
              </Card>

              <Card padding="lg">
                <div className="mb-5 flex items-center gap-2 border-b border-[var(--border)] pb-4">
                  <span className="grid size-8 place-items-center rounded-lg bg-[var(--primary-soft)] text-[color:var(--primary)]">
                    <Icon icon={Calendar} size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-[color:var(--text-heading)]">희망 전략 기간</h2>
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                      입력한 날짜는 AI가 변경하지 않으며, 모두 비우면 AI가 추천합니다.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="preferred-start-date" optional>
                      시작일
                    </FieldLabel>
                    <Input
                      id="preferred-start-date"
                      type="date"
                      min={today}
                      value={draft.preferredStartDate}
                      disabled={draft.recommendAllConditions}
                      tone={errors.preferredStartDate ? 'error' : 'default'}
                      onChange={(event) => updateDraft({ preferredStartDate: event.target.value })}
                    />
                    {errors.preferredStartDate ? (
                      <p className="mt-1 text-xs text-[color:var(--danger)]">{errors.preferredStartDate}</p>
                    ) : null}
                  </div>
                  <div>
                    <FieldLabel htmlFor="preferred-end-date" optional>
                      종료일
                    </FieldLabel>
                    <Input
                      id="preferred-end-date"
                      type="date"
                      min={draft.preferredStartDate || today}
                      value={draft.preferredEndDate}
                      disabled={draft.recommendAllConditions}
                      tone={errors.preferredEndDate ? 'error' : 'default'}
                      onChange={(event) => updateDraft({ preferredEndDate: event.target.value })}
                    />
                    {errors.preferredEndDate ? (
                      <p className="mt-1 text-xs text-[color:var(--danger)]">{errors.preferredEndDate}</p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-card)] bg-[var(--surface-subtle)] p-3 text-xs leading-5 text-[color:var(--text-muted)]">
                  <Icon
                    icon={InfoCircle}
                    size={16}
                    className="mt-0.5 shrink-0 text-[color:var(--info)]"
                    aria-hidden="true"
                  />
                  시작일은 오늘부터 90일 이내, 시작·종료일은 포함 최대 90일입니다. 종료일만 입력하면 오늘과 종료일-89일
                  중 늦은 날부터 예측합니다.
                </div>
              </Card>

              <Card
                padding="lg"
                className={errors.requestPreference ? 'border-[var(--danger)]' : 'border-[var(--primary)]'}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    size="lg"
                    checked={draft.recommendAllConditions}
                    onChange={(event) => handleRecommendAllConditions(event.target.checked)}
                    aria-describedby={errors.requestPreference ? 'request-preference-error' : 'recommend-all-help'}
                  />
                  <span>
                    <strong className="block text-sm text-[color:var(--text-heading)]">
                      조건 전체를 AI에게 추천받기
                    </strong>
                    <span
                      id="recommend-all-help"
                      className="mt-1 block text-xs leading-5 text-[color:var(--text-muted)]"
                    >
                      출발 판매처, LOT, 후보 판매처, 전략 타입과 기간을 직접 지정하지 않고 AI가 모두 판단합니다.
                    </span>
                  </span>
                </label>
                {draft.recommendAllConditions ? (
                  <p className="mt-3 rounded-[var(--radius-card)] bg-[var(--primary-soft)] p-3 text-xs leading-5 text-[color:var(--primary)]">
                    전체 추천을 선택해 직접 입력한 조건을 초기화했습니다. 개별 조건을 지정하려면 체크를 해제해 주세요.
                  </p>
                ) : null}
                {errors.requestPreference ? (
                  <p id="request-preference-error" role="alert" className="mt-3 text-xs text-[color:var(--danger)]">
                    {errors.requestPreference}
                  </p>
                ) : null}
              </Card>

              <Alert variant="warning" title="실제 API 연결 전에 응답 식별자 보완이 필요합니다.">
                통합 재고 응답에 숫자형 <code>skuId</code>와 <code>salesPointId</code>가 추가되어야 문서의 생성
                Request를 완성할 수 있습니다.
              </Alert>
            </div>

            <RequestSummary
              item={activeItem}
              draft={draft}
              productCount={selectedItems.length}
              completedCount={completedCount}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export function StrategyRequestModal({ selectedItems = [], onClose }) {
  if (!selectedItems.length) return null;
  return <StrategyRequestModalContent selectedItems={selectedItems} onClose={onClose} />;
}
