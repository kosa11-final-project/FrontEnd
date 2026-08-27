import { useEffect, useRef } from 'react';
import { CloseCircle, Refresh, SearchNormal } from 'reicon-react';
import { actionTypeMeta, strategyStatusMeta } from '@/entities/strategy';
import { Button, Icon, SelectMenu } from '@/shared/ui';
import {
  defaultStrategyExecutionFilters,
  STRATEGY_EXECUTION_FILTER_ACTION_TYPES,
  STRATEGY_EXECUTION_FILTER_STATUSES,
} from '../model/filterState.js';

function ActiveFilterChip({ label, value, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-1 text-[length:var(--font-size-meta)] font-medium text-[color:var(--text-body)]">
      <span className="text-[color:var(--text-muted)]">{label}</span>
      <strong className="font-[var(--font-weight-semibold)] text-[color:var(--text-heading)]">{value}</strong>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded text-[color:var(--text-muted)] hover:text-[color:var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        aria-label={`${label} 필터 해제`}
      >
        <Icon icon={CloseCircle} size={13} aria-hidden="true" />
      </button>
    </span>
  );
}

export function StrategyExecutionFilters({ filters, resultCount, onChange, onReset }) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current && searchInputRef.current.value !== filters.query) {
      searchInputRef.current.value = filters.query;
    }
  }, [filters.query]);

  const selectedActionType = STRATEGY_EXECUTION_FILTER_ACTION_TYPES.includes(filters.actionType)
    ? filters.actionType
    : 'ALL';
  const selectedStatus = STRATEGY_EXECUTION_FILTER_STATUSES.includes(filters.strategyStatus)
    ? filters.strategyStatus
    : 'ALL';
  const hasActiveFilter = Boolean(filters.query) || selectedStatus !== 'ALL' || selectedActionType !== 'ALL';
  const setFilter = (key, value) => onChange({ ...filters, [key]: value });

  const handleReset = () => {
    if (searchInputRef.current) searchInputRef.current.value = '';
    onChange(defaultStrategyExecutionFilters);
    onReset?.();
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setFilter('query', searchInputRef.current?.value.trim() ?? '');
  };

  return (
    <section
      aria-label="전략 실행 관제 조회 조건"
      className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-soft)]"
    >
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-[1_1_320px]">
          <label
            htmlFor="strategy-execution-search"
            className="mb-1 block text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-body)]"
          >
            검색어
          </label>
          <div className="relative">
            <input
              ref={searchInputRef}
              id="strategy-execution-search"
              aria-label="전략 번호 또는 상품명 검색"
              type="search"
              maxLength={100}
              defaultValue={filters.query}
              placeholder="전략 번호, 상품명 또는 SKU"
              className="h-9 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-subtle)] pl-9 pr-3 text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)] placeholder:text-[color:var(--text-muted)] focus:border-[var(--primary)] focus:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)]"
            />
            <Icon
              icon={SearchNormal}
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="w-full min-w-40 flex-1 sm:w-44 sm:flex-none">
          <span className="mb-1 block text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-body)]">
            전략 유형
          </span>
          <SelectMenu
            value={selectedActionType}
            onValueChange={(value) => setFilter('actionType', value)}
            aria-label="전략 유형"
            options={[
              { value: 'ALL', label: '전체 전략 유형' },
              ...STRATEGY_EXECUTION_FILTER_ACTION_TYPES.map((type) => ({
                value: type,
                label: actionTypeMeta[type].label,
              })),
            ]}
          />
        </div>

        <div className="w-full min-w-36 flex-1 sm:w-40 sm:flex-none">
          <span className="mb-1 block text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-body)]">
            상태
          </span>
          <SelectMenu
            value={selectedStatus}
            onValueChange={(value) => setFilter('strategyStatus', value)}
            aria-label="전략 전체 상태"
            options={[
              { value: 'ALL', label: '전체 상태' },
              ...STRATEGY_EXECUTION_FILTER_STATUSES.map((status) => ({
                value: status,
                label: strategyStatusMeta[status].label,
              })),
            ]}
          />
        </div>

        <Button type="button" variant="secondary" size="md" onClick={handleReset} title="검색어와 필터 초기화">
          <Icon icon={Refresh} size={14} aria-hidden="true" />
          초기화
        </Button>
        <Button type="submit" size="md">
          <Icon icon={SearchNormal} size={14} aria-hidden="true" />
          검색
        </Button>
      </form>

      <div className="mt-2 flex min-h-7 flex-wrap items-center gap-1.5 border-t border-[var(--border)] pt-2">
        {hasActiveFilter ? (
          <>
            <span className="mr-1 text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
              적용된 조건
            </span>
            {filters.query ? (
              <ActiveFilterChip
                label="검색"
                value={`“${filters.query}”`}
                onRemove={() => {
                  if (searchInputRef.current) searchInputRef.current.value = '';
                  setFilter('query', '');
                }}
              />
            ) : null}
            {selectedActionType !== 'ALL' ? (
              <ActiveFilterChip
                label="유형"
                value={actionTypeMeta[selectedActionType].shortLabel}
                onRemove={() => setFilter('actionType', 'ALL')}
              />
            ) : null}
            {selectedStatus !== 'ALL' ? (
              <ActiveFilterChip
                label="상태"
                value={strategyStatusMeta[selectedStatus].label}
                onRemove={() => setFilter('strategyStatus', 'ALL')}
              />
            ) : null}
          </>
        ) : (
          <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-body)]">적용된 필터 없음</span>
        )}
        <span className="ml-auto text-[length:var(--font-size-meta)] text-[color:var(--text-body)]" aria-live="polite">
          검색 결과 <strong className="text-[color:var(--text-heading)]">{resultCount}건</strong>
        </span>
      </div>
    </section>
  );
}
