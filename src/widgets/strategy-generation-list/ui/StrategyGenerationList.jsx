import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowRight, ChevronLeft, ChevronRight, InfoCircle, Package, SearchNormal } from 'reicon-react';
import {
  aiStrategyDetailQueryOptions,
  aiStrategyListQueryOptions,
  actionTypeMeta,
  StrategyGenerationProgress,
  StrategyGenerationStatus,
  strategyGenerationStageMeta,
} from '@/entities/strategy';
import { formatDate, formatDateTime } from '@/shared/lib/format';
import { Alert, Badge, Button, DataTable, Drawer, Icon, IconButton, Input, StateView } from '@/shared/ui';

const PAGE_SIZE = 10;
const EMPTY_STRATEGIES = Object.freeze([]);
const statusTabs = Object.freeze([
  { value: 'ALL', label: '전체' },
  { value: 'GENERATED', label: '생성완료' },
  { value: 'GENERATING', label: '생성중' },
  { value: 'GENERATION_FAILED', label: '생성실패' },
]);
const validStatuses = new Set(statusTabs.map(({ value }) => value));
const columnHelper = createColumnHelper();
const MAINTAIN_CURRENT_STATE = 'MAINTAIN_CURRENT_STATE';

function shouldOpenStrategyDrawer(strategy) {
  return strategy?.caseStatus !== 'GENERATED' || strategy?.recommendationOutcome === MAINTAIN_CURRENT_STATE;
}

function ProductThumbnail({ product }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(product.imageUrl) && failedSrc !== product.imageUrl;

  return (
    <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)]">
      {showImage ? (
        <img
          src={product.imageUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(product.imageUrl)}
        />
      ) : (
        <span data-product-fallback={product.skuCode} aria-hidden="true">
          <Icon icon={Package} size={22} className="text-[color:var(--text-muted)]" />
        </span>
      )}
    </span>
  );
}

function StrategyProductCell({ product }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ProductThumbnail product={product} />
      <div className="min-w-0">
        <strong className="block truncate text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
          {product.name}
        </strong>
        <span className="mt-1 block truncate font-mono text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          {product.skuCode}
        </span>
      </div>
    </div>
  );
}

function DrawerDetails({ strategy }) {
  const isFailed = strategy.caseStatus === 'GENERATION_FAILED';
  const stageLabel = strategyGenerationStageMeta[strategy.generationStage]?.label ?? '수요예측';

  return (
    <div className="grid gap-6">
      <StrategyProductCell product={strategy.product} />

      <section aria-labelledby="generation-progress-title">
        <h3
          id="generation-progress-title"
          className="mb-4 text-[length:var(--font-size-subtitle2)] font-bold text-[color:var(--text-heading)]"
        >
          생성 진행 상태
        </h3>
        <StrategyGenerationProgress
          status={strategy.caseStatus}
          currentStage={strategy.generationStage}
          className="max-w-sm"
        />
      </section>

      <dl className="grid grid-cols-[112px_1fr] gap-x-4 gap-y-3 rounded-[var(--radius-panel)] bg-[var(--surface-subtle)] p-4 text-[length:var(--font-size-body-sm)]">
        <dt className="text-[color:var(--text-muted)]">전략 번호</dt>
        <dd className="m-0 font-mono font-bold text-[color:var(--text-heading)]">{strategy.strategyNumber}</dd>
        <dt className="text-[color:var(--text-muted)]">현재 단계</dt>
        <dd className="m-0 font-semibold text-[color:var(--text-heading)]">{stageLabel}</dd>
        <dt className="text-[color:var(--text-muted)]">생성 시작</dt>
        <dd className="m-0 text-[color:var(--text-body)]">{formatDateTime(strategy.createdAt)}</dd>
        {isFailed ? (
          <>
            <dt className="text-[color:var(--text-muted)]">실패 시각</dt>
            <dd className="m-0 text-[color:var(--text-body)]">{formatDateTime(strategy.failure?.failedAt)}</dd>
          </>
        ) : null}
      </dl>

      {isFailed ? (
        <div className="grid gap-3">
          <Alert variant="danger" title="전략 생성에 실패했습니다.">
            {strategy.failure?.summary ?? '실패 사유를 확인하지 못했습니다. 담당자에게 문의해 주세요.'}
          </Alert>
          <Button type="button" variant="secondary" disabled>
            다시 생성
          </Button>
          <p className="m-0 text-center text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            재시도 API 연결 후 사용할 수 있습니다.
          </p>
        </div>
      ) : (
        <Alert variant="info" title={`${stageLabel} 단계가 진행 중입니다.`}>
          현재 진행 상태만 제공하며 예상 완료 시간은 표시하지 않습니다.
        </Alert>
      )}
    </div>
  );
}

function displayList(values, emptyMessage) {
  return values?.length ? values.join(', ') : emptyMessage;
}

function displayPeriod(startDate, endDate) {
  if (!startDate && !endDate) return '미선택 · 전체 예측 기간';
  return `${startDate ? formatDate(startDate) : '시작일 미지정'} ~ ${endDate ? formatDate(endDate) : '종료일 미지정'}`;
}

function MaintainCurrentStateDrawerDetails({ strategy, detail }) {
  const conditions = detail.requestConditions;
  const strategyTypeLabels = conditions.strategyTypes.map((type) => actionTypeMeta[type]?.label ?? type);

  return (
    <div className="grid gap-6">
      <StrategyProductCell product={strategy.product} />

      <div className="flex items-start gap-3 rounded-[var(--radius-panel)] border border-[var(--good-soft)] bg-[var(--good-soft)] p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--card)] text-[color:var(--good)] shadow-sm">
          <Icon icon={InfoCircle} size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <Badge variant="good">현상 유지 권장</Badge>
          <h3 className="mt-3 text-[length:var(--font-size-subtitle2)] font-bold text-[color:var(--text-heading)]">
            현재 운영 상태를 유지하는 것이 유리합니다.
          </h3>
          <p className="mt-2 text-[length:var(--font-size-body-sm)] leading-6 text-[color:var(--text-body)]">
            {detail.noRecommendation?.message ??
              '현재 수요예측과 재고 상태에서는 새로운 전략을 실행하는 것보다 현재 운영 상태를 유지하는 편이 유리합니다.'}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-[112px_1fr] gap-x-4 gap-y-3 rounded-[var(--radius-panel)] bg-[var(--surface-subtle)] p-4 text-[length:var(--font-size-body-sm)]">
        <dt className="text-[color:var(--text-muted)]">전략 번호</dt>
        <dd className="m-0 font-mono font-bold text-[color:var(--text-heading)]">{strategy.strategyNumber}</dd>
        <dt className="text-[color:var(--text-muted)]">생성 완료</dt>
        <dd className="m-0 text-[color:var(--text-body)]">
          {formatDateTime(detail.completedAt ?? detail.requestedAt)}
        </dd>
        <dt className="text-[color:var(--text-muted)]">결과 만료</dt>
        <dd className="m-0 text-[color:var(--text-body)]">{formatDateTime(detail.resultExpiresAt)}</dd>
      </dl>

      {conditions ? (
        <section aria-labelledby="maintain-request-conditions-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3
              id="maintain-request-conditions-title"
              className="text-[length:var(--font-size-subtitle2)] font-bold text-[color:var(--text-heading)]"
            >
              사용자 요청 조건
            </h3>
            <Badge variant="outline">읽기 전용</Badge>
          </div>
          <dl className="grid gap-2 rounded-[var(--radius-panel)] border border-[var(--border)] p-4 text-[length:var(--font-size-body-sm)]">
            <div className="grid grid-cols-[112px_1fr] gap-4">
              <dt className="text-[color:var(--text-muted)]">출발 판매처</dt>
              <dd className="m-0 font-semibold text-[color:var(--text-heading)]">
                {conditions.sourceSalesPointName ?? '미선택 · 전체 판매처'}
              </dd>
            </div>
            <div className="grid grid-cols-[112px_1fr] gap-4">
              <dt className="text-[color:var(--text-muted)]">대상 LOT</dt>
              <dd className="m-0 text-[color:var(--text-body)]">
                {displayList(conditions.lotLabels, '미선택 · 전체 LOT')}
              </dd>
            </div>
            <div className="grid grid-cols-[112px_1fr] gap-4">
              <dt className="text-[color:var(--text-muted)]">후보 판매처</dt>
              <dd className="m-0 text-[color:var(--text-body)]">
                {displayList(conditions.candidateSalesPointNames, '미선택 · 전체 판매처')}
              </dd>
            </div>
            <div className="grid grid-cols-[112px_1fr] gap-4">
              <dt className="text-[color:var(--text-muted)]">전략 범위</dt>
              <dd className="m-0 text-[color:var(--text-body)]">
                {displayList(strategyTypeLabels, '미선택 · 전체 전략')}
              </dd>
            </div>
            <div className="grid grid-cols-[112px_1fr] gap-4">
              <dt className="text-[color:var(--text-muted)]">희망 기간</dt>
              <dd className="m-0 text-[color:var(--text-body)]">
                {displayPeriod(conditions.preferredStartDate, conditions.preferredEndDate)}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <Alert variant="info" title="실행할 전략 대안이 생성되지 않았습니다.">
        재고나 판매 조건이 달라진 뒤 필요하면 새로운 AI 전략을 생성해 주세요.
      </Alert>
    </div>
  );
}

function StrategySearchInput({ value: externalValue, onDebouncedChange }) {
  const [value, setValue] = useState(externalValue);
  const lastEmittedValueRef = useRef(externalValue);

  useEffect(() => {
    if (externalValue === lastEmittedValueRef.current) return;

    lastEmittedValueRef.current = externalValue;
    setValue(externalValue);
  }, [externalValue]);

  useEffect(() => {
    if (value === externalValue) return undefined;

    const timeoutId = window.setTimeout(() => {
      lastEmittedValueRef.current = value;
      onDebouncedChange(value);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [externalValue, onDebouncedChange, value]);

  return (
    <Input
      size="sm"
      className="pl-9"
      value={value}
      placeholder="Case ID, 전략명, SKU·상품명 검색"
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

function StrategyFilterBar({ status, counts, query, from, to, onFilterChange, onQueryChange }) {
  return (
    <section
      className="flex flex-wrap items-end justify-between gap-4 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-4"
      aria-label="AI 전략 생성 목록 필터"
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="생성 상태">
        {statusTabs.map((tab) => {
          const selected = status === tab.value;
          return (
            <Button
              key={tab.value}
              type="button"
              variant={selected ? 'primary' : 'secondary'}
              size="sm"
              aria-pressed={selected}
              onClick={() => onFilterChange('status', tab.value)}
            >
              {tab.label}
              <span className={selected ? 'text-[color:var(--color-white)]/80' : 'text-[color:var(--text-muted)]'}>
                {counts[tab.value]}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-end justify-end gap-3">
        <label className="grid gap-1 text-[length:var(--font-size-meta)] font-medium text-[color:var(--text-muted)]">
          시작일
          <Input
            type="date"
            size="sm"
            value={from}
            max={to || undefined}
            onChange={(event) => onFilterChange('from', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-[length:var(--font-size-meta)] font-medium text-[color:var(--text-muted)]">
          종료일
          <Input
            type="date"
            size="sm"
            value={to}
            min={from || undefined}
            onChange={(event) => onFilterChange('to', event.target.value)}
          />
        </label>
        <label className="grid w-full min-w-0 flex-1 gap-1 text-[length:var(--font-size-meta)] font-medium text-[color:var(--text-muted)] sm:min-w-[240px] sm:max-w-[320px]">
          전략 검색
          <span className="relative">
            <Icon
              icon={SearchNormal}
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[color:var(--text-muted)]"
            />
            <StrategySearchInput value={query} onDebouncedChange={onQueryChange} />
          </span>
        </label>
      </div>
    </section>
  );
}

export function StrategyGenerationList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const actionButtonRefs = useRef(new Map());
  const drawerTriggerStrategyIdRef = useRef(null);

  const requestedStatus = searchParams.get('status') ?? 'ALL';
  const status = validStatuses.has(requestedStatus) ? requestedStatus : 'ALL';
  const query = searchParams.get('q') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const drawerStrategyId = Number.parseInt(searchParams.get('drawer') ?? '', 10);
  const parsedPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const requestedPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const apiParams = useMemo(
    () => ({
      page: requestedPage - 1,
      size: PAGE_SIZE,
      status,
      query,
      from,
      to,
      sort: 'createdAt,desc',
    }),
    [from, query, requestedPage, status, to],
  );
  const listQuery = useQuery(aiStrategyListQueryOptions(apiParams));
  const strategies = listQuery.data?.content ?? EMPTY_STRATEGIES;
  const totalElements = listQuery.data?.totalElements ?? 0;
  const totalPages = Math.max(listQuery.data?.totalPages ?? 0, 1);
  const counts = useMemo(
    () => ({
      ALL: listQuery.data?.statusCounts?.all ?? 0,
      GENERATED: listQuery.data?.statusCounts?.generated ?? 0,
      GENERATING: listQuery.data?.statusCounts?.generating ?? 0,
      GENERATION_FAILED: listQuery.data?.statusCounts?.generationFailed ?? 0,
    }),
    [listQuery.data?.statusCounts],
  );
  const selectedStrategy = useMemo(() => {
    if (!Number.isInteger(drawerStrategyId) || drawerStrategyId <= 0) return null;

    const strategy = strategies.find((item) => item.id === drawerStrategyId);
    return shouldOpenStrategyDrawer(strategy) ? (strategy ?? null) : null;
  }, [drawerStrategyId, strategies]);
  const shouldLoadMaintainDetail = selectedStrategy?.recommendationOutcome === MAINTAIN_CURRENT_STATE;
  const maintainDetailQuery = useQuery({
    ...aiStrategyDetailQueryOptions(selectedStrategy?.id),
    enabled: shouldLoadMaintainDetail,
  });

  const updateFilter = useCallback(
    (key, value, { resetPage = true } = {}) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          const shouldDelete =
            value === '' ||
            value === null ||
            (key === 'status' && value === 'ALL') ||
            (key === 'page' && Number(value) <= 1);
          if (shouldDelete) next.delete(key);
          else next.set(key, String(value));
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const updateSearch = useCallback((value) => updateFilter('q', value), [updateFilter]);

  useEffect(() => {
    if (!listQuery.data || listQuery.isPlaceholderData) return;
    const safePage = Math.min(requestedPage, Math.max(listQuery.data.totalPages, 1));
    if (safePage === requestedPage) return;
    updateFilter('page', safePage, { resetPage: false });
  }, [listQuery.data, listQuery.isPlaceholderData, requestedPage, updateFilter]);

  function closeDrawer() {
    const triggerStrategyId = drawerTriggerStrategyIdRef.current;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('drawer');
        return next;
      },
      { replace: true },
    );
    window.requestAnimationFrame(() => actionButtonRefs.current.get(triggerStrategyId)?.focus());
  }

  const listPath = `/ai-strategy${searchParams.size ? `?${searchParams.toString()}` : ''}`;
  const handleStrategyAction = useCallback(
    (strategy) => {
      if (!shouldOpenStrategyDrawer(strategy)) {
        navigate(`/ai-strategy/${strategy.id}`, { state: { from: listPath } });
        return;
      }
      drawerTriggerStrategyIdRef.current = strategy.id;
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('drawer', String(strategy.id));
          return next;
        },
        { replace: true },
      );
    },
    [listPath, navigate, setSearchParams],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('strategyNumber', {
        header: '전략 번호',
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="font-mono text-[length:var(--font-size-meta)] font-bold text-[color:var(--text-body)]">
            {getValue()}
          </span>
        ),
        meta: { width: '130px' },
      }),
      columnHelper.accessor('strategyName', {
        header: '전략명 · 최종 카테고리',
        enableSorting: false,
        cell: ({ row, getValue }) => (
          <div className="min-w-0">
            <strong className="block line-clamp-2 text-[length:var(--font-size-body)] leading-5 text-[color:var(--text-heading)]">
              {getValue()}
            </strong>
            <Badge variant="neutral" className="mt-2">
              {row.original.category?.name ?? '미분류'}
            </Badge>
          </div>
        ),
        meta: { width: '250px' },
      }),
      columnHelper.accessor('product', {
        header: '상품',
        enableSorting: false,
        cell: ({ getValue }) => <StrategyProductCell product={getValue()} />,
        meta: { width: '270px' },
      }),
      columnHelper.accessor('caseStatus', {
        header: '상태',
        enableSorting: false,
        cell: ({ row, getValue }) => {
          if (row.original.recommendationOutcome === MAINTAIN_CURRENT_STATE) {
            return (
              <div className="grid gap-3">
                <Badge variant="good" className="w-fit">
                  <Icon icon={InfoCircle} size={12} aria-hidden="true" />
                  현상 유지 권장
                </Badge>
                <StrategyGenerationProgress
                  status={getValue()}
                  currentStage={row.original.generationStage}
                  finalStageNotice="실행 대안 없음"
                />
              </div>
            );
          }

          return (
            <div className="grid gap-3">
              <StrategyGenerationStatus status={getValue()} className="w-fit" />
              <StrategyGenerationProgress status={getValue()} currentStage={row.original.generationStage} />
            </div>
          );
        },
        meta: { width: '250px' },
      }),
      columnHelper.accessor('createdAt', {
        header: '생성일자',
        enableSorting: false,
        cell: ({ getValue }) => {
          const formatted = formatDateTime(getValue());
          const [date, time] = formatted.split(' ');
          return (
            <time dateTime={getValue()} className="whitespace-nowrap tabular-nums text-[color:var(--text-body)]">
              <span className="block font-medium">{date}</span>
              <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                {time}
              </span>
            </time>
          );
        },
        meta: { width: '110px' },
      }),
      columnHelper.display({
        id: 'action',
        header: '상세',
        enableSorting: false,
        cell: ({ row }) => {
          const strategy = row.original;
          const actionLabel =
            strategy.recommendationOutcome === MAINTAIN_CURRENT_STATE
              ? `${strategy.strategyNumber} 현상 유지 권장 결과 보기`
              : strategy.caseStatus === 'GENERATED'
                ? `${strategy.strategyNumber} 비교·시뮬레이션으로 이동`
                : `${strategy.strategyNumber} 생성 상태 상세 보기`;
          return (
            <IconButton
              ref={(node) => {
                if (node) actionButtonRefs.current.set(strategy.id, node);
                else actionButtonRefs.current.delete(strategy.id);
              }}
              label={actionLabel}
              variant="ghost"
              onClick={() => handleStrategyAction(strategy)}
            >
              <Icon icon={ArrowRight} size={18} />
            </IconButton>
          );
        },
        meta: { width: '64px', align: 'center' },
      }),
    ],
    [handleStrategyAction],
  );

  return (
    <div className="grid min-w-0 gap-4" data-widget="strategy-generation-list">
      <StrategyFilterBar
        status={status}
        counts={counts}
        query={query}
        from={from}
        to={to}
        onFilterChange={updateFilter}
        onQueryChange={updateSearch}
      />

      {listQuery.isPending ? (
        <StateView state="loading" title="AI 전략 생성 목록을 불러오고 있습니다." />
      ) : listQuery.isError ? (
        <Alert variant="danger" title="AI 전략 생성 목록을 불러오지 못했습니다.">
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span>서버 연결 상태를 확인한 뒤 다시 시도해 주세요.</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => listQuery.refetch()}>
              다시 시도
            </Button>
          </div>
        </Alert>
      ) : (
        <section className="min-w-0" aria-label="AI 전략 생성 목록" aria-busy={listQuery.isFetching}>
          {listQuery.isFetching ? (
            <p className="sr-only" aria-live="polite">
              AI 전략 생성 목록을 업데이트하고 있습니다.
            </p>
          ) : null}
          <DataTable
            columns={columns}
            data={strategies}
            getRowId={(row) => String(row.id)}
            enableSorting={false}
            layout="fixed"
            ariaLabel="AI 전략 생성 목록"
            emptyMessage={
              status === 'ALL' && !query && !from && !to
                ? '아직 생성 요청한 AI 전략이 없습니다.'
                : '검색 조건에 맞는 AI 전략이 없습니다.'
            }
            className="min-w-0 max-w-full rounded-b-none border-b-0 [&_table]:min-w-[1074px] [&_tbody_td]:py-4"
          />

          <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-[var(--radius-panel)] border-x border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            <span>
              총 <strong className="text-[color:var(--text-heading)]">{totalElements}</strong>건
            </span>
            <div className="flex items-center gap-2" aria-label="페이지 이동">
              <IconButton
                label="이전 페이지"
                size="sm"
                disabled={requestedPage <= 1 || listQuery.isPlaceholderData}
                onClick={() => updateFilter('page', requestedPage - 1, { resetPage: false })}
              >
                <Icon icon={ChevronLeft} size={16} />
              </IconButton>
              <span className="min-w-14 text-center tabular-nums text-[color:var(--text-body)]">
                {requestedPage} / {totalPages}
              </span>
              <IconButton
                label="다음 페이지"
                size="sm"
                disabled={requestedPage >= totalPages || listQuery.isPlaceholderData}
                onClick={() => updateFilter('page', requestedPage + 1, { resetPage: false })}
              >
                <Icon icon={ChevronRight} size={16} />
              </IconButton>
            </div>
          </footer>
        </section>
      )}

      <Drawer
        open={Boolean(selectedStrategy)}
        onClose={closeDrawer}
        title={
          selectedStrategy?.recommendationOutcome === MAINTAIN_CURRENT_STATE
            ? '현상 유지 권장'
            : selectedStrategy?.caseStatus === 'GENERATION_FAILED'
              ? '생성 실패 상세'
              : '생성 진행 상세'
        }
        description={
          selectedStrategy ? `${selectedStrategy.strategyNumber} · ${formatDate(selectedStrategy.createdAt)}` : ''
        }
      >
        {selectedStrategy?.recommendationOutcome === MAINTAIN_CURRENT_STATE ? (
          maintainDetailQuery.isPending ? (
            <StateView state="loading" title="현상 유지 권장 결과를 불러오고 있습니다." />
          ) : maintainDetailQuery.isError ? (
            <Alert variant="danger" title="현상 유지 권장 결과를 불러오지 못했습니다.">
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <span>서버 연결 상태를 확인한 뒤 다시 시도해 주세요.</span>
                <Button type="button" variant="secondary" size="sm" onClick={() => maintainDetailQuery.refetch()}>
                  다시 시도
                </Button>
              </div>
            </Alert>
          ) : (
            <MaintainCurrentStateDrawerDetails strategy={selectedStrategy} detail={maintainDetailQuery.data} />
          )
        ) : selectedStrategy ? (
          <DrawerDetails strategy={selectedStrategy} />
        ) : null}
      </Drawer>
    </div>
  );
}
