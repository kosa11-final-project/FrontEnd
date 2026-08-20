import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowRight, ChevronLeft, ChevronRight, Package, SearchNormal } from 'reicon-react';
import { StrategyGenerationProgress, StrategyGenerationStatus, strategyGenerationStageMeta } from '@/entities/strategy';
import { formatDate, formatDateTime } from '@/shared/lib/format';
import { Alert, Badge, Button, DataTable, Drawer, Icon, IconButton, Input } from '@/shared/ui';
import { strategyGenerationFixtures } from '../model/strategyFixtures.js';
import { filterStrategies, getStrategyStatusCounts, paginateStrategies } from '../model/strategyList.js';

const PAGE_SIZE = 10;
const statusTabs = Object.freeze([
  { value: 'ALL', label: '전체' },
  { value: 'GENERATED', label: '생성완료' },
  { value: 'GENERATING', label: '생성중' },
  { value: 'GENERATION_FAILED', label: '생성실패' },
]);
const validStatuses = new Set(statusTabs.map(({ value }) => value));
const columnHelper = createColumnHelper();

function ProductThumbnail({ product }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(product.imageUrl) && !failed;

  return (
    <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)]">
      {showImage ? (
        <img
          src={product.imageUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
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
  const isFailed = strategy.generationStatus === 'GENERATION_FAILED';
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
          status={strategy.generationStatus}
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

function StrategyFilterBar({ status, counts, query, from, to, onFilterChange }) {
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
            <Input
              size="sm"
              className="pl-9"
              value={query}
              placeholder="전략번호, 전략명, 상품명 검색"
              onChange={(event) => onFilterChange('q', event.target.value)}
            />
          </span>
        </label>
      </div>
    </section>
  );
}

export function StrategyGenerationList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const latestSearchParamsRef = useRef(searchParams);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const actionButtonRefs = useRef(new Map());
  const drawerTriggerStrategyIdRef = useRef(null);

  const requestedStatus = searchParams.get('status') ?? 'ALL';
  const status = validStatuses.has(requestedStatus) ? requestedStatus : 'ALL';
  const query = searchParams.get('q') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const requestedPage = Number.parseInt(searchParams.get('page') ?? '1', 10) || 1;

  const counts = useMemo(
    () => getStrategyStatusCounts(strategyGenerationFixtures, { query, from, to }),
    [from, query, to],
  );
  const filteredStrategies = useMemo(
    () => filterStrategies(strategyGenerationFixtures, { query, from, to, status }),
    [from, query, status, to],
  );
  const pagination = useMemo(
    () => paginateStrategies(filteredStrategies, requestedPage, PAGE_SIZE),
    [filteredStrategies, requestedPage],
  );

  useLayoutEffect(() => {
    latestSearchParamsRef.current = searchParams;
  }, [searchParams]);

  function updateFilter(key, value, { resetPage = true } = {}) {
    const next = new URLSearchParams(latestSearchParamsRef.current);
    const shouldDelete = value === '' || value === null || (key === 'status' && value === 'ALL');
    if (shouldDelete) next.delete(key);
    else next.set(key, String(value));
    if (resetPage) next.delete('page');
    latestSearchParamsRef.current = next;
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    if (pagination.page === requestedPage) return;
    const next = new URLSearchParams(latestSearchParamsRef.current);
    if (pagination.page === 1) next.delete('page');
    else next.set('page', String(pagination.page));
    latestSearchParamsRef.current = next;
    setSearchParams(next, { replace: true });
  }, [pagination.page, requestedPage, setSearchParams]);

  function closeDrawer() {
    const triggerStrategyId = drawerTriggerStrategyIdRef.current;
    setSelectedStrategy(null);
    window.requestAnimationFrame(() => actionButtonRefs.current.get(triggerStrategyId)?.focus());
  }

  function handleStrategyAction(strategy) {
    if (strategy.generationStatus === 'GENERATED') {
      const currentSearch = searchParams.toString();
      navigate(`/ai-strategy/${strategy.id}`, {
        state: { from: `/ai-strategy${currentSearch ? `?${currentSearch}` : ''}` },
      });
      return;
    }
    drawerTriggerStrategyIdRef.current = strategy.id;
    setSelectedStrategy(strategy);
  }

  const columns = [
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
    columnHelper.accessor('generationStatus', {
      header: '상태',
      enableSorting: false,
      cell: ({ row, getValue }) => (
        <div className="grid gap-3">
          <StrategyGenerationStatus status={getValue()} className="w-fit" />
          <StrategyGenerationProgress status={getValue()} currentStage={row.original.generationStage} />
        </div>
      ),
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
          strategy.generationStatus === 'GENERATED'
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
  ];

  return (
    <div className="grid min-w-0 gap-4" data-widget="strategy-generation-list">
      <StrategyFilterBar
        status={status}
        counts={counts}
        query={query}
        from={from}
        to={to}
        onFilterChange={updateFilter}
      />

      <section className="min-w-0" aria-label="AI 전략 생성 목록">
        <DataTable
          columns={columns}
          data={pagination.items}
          getRowId={(row) => String(row.id)}
          enableSorting={false}
          layout="fixed"
          ariaLabel="AI 전략 생성 목록"
          emptyMessage="검색 조건에 맞는 AI 전략이 없습니다."
          className="min-w-0 max-w-full rounded-b-none border-b-0 [&_table]:min-w-[1074px] [&_tbody_td]:py-4"
        />

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-[var(--radius-panel)] border-x border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          <span>
            총 <strong className="text-[color:var(--text-heading)]">{pagination.totalItems}</strong>건
          </span>
          <div className="flex items-center gap-2" aria-label="페이지 이동">
            <IconButton
              label="이전 페이지"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => updateFilter('page', pagination.page - 1, { resetPage: false })}
            >
              <Icon icon={ChevronLeft} size={16} />
            </IconButton>
            <span className="min-w-14 text-center tabular-nums text-[color:var(--text-body)]">
              {pagination.page} / {pagination.totalPages}
            </span>
            <IconButton
              label="다음 페이지"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => updateFilter('page', pagination.page + 1, { resetPage: false })}
            >
              <Icon icon={ChevronRight} size={16} />
            </IconButton>
          </div>
        </footer>
      </section>

      <Drawer
        open={Boolean(selectedStrategy)}
        onClose={closeDrawer}
        title={selectedStrategy?.generationStatus === 'GENERATION_FAILED' ? '생성 실패 상세' : '생성 진행 상세'}
        description={
          selectedStrategy ? `${selectedStrategy.strategyNumber} · ${formatDate(selectedStrategy.createdAt)}` : ''
        }
      >
        {selectedStrategy ? <DrawerDetails strategy={selectedStrategy} /> : null}
      </Drawer>
    </div>
  );
}
