import { useEffect, useRef } from 'react';
import { CloseCircle, Refresh, SearchNormal } from 'reicon-react';
import { STRATEGY_STATUSES, SUPPORTED_ACTION_TYPES, actionTypeMeta, strategyStatusMeta } from '@/entities/strategy';
import { Icon, SelectMenu } from '@/shared/ui';
import { defaultStrategyExecutionFilters } from '../model/filterState.js';

function ActiveFilterChip({ label, value, onRemove, tone = 'neutral' }) {
  const toneClasses = {
    neutral: 'border-gray-200 bg-gray-50 text-gray-700',
    primary: 'border-emerald-200 bg-emerald-50 text-[color:var(--primary-strong)]',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[length:var(--font-size-meta)] font-medium ${toneClasses[tone]}`}
    >
      <span className="opacity-70">{label}:</span>
      <strong className="font-[var(--font-weight-semibold)]">{value}</strong>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded text-current opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
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

  const setFilter = (key, value) => onChange({ ...filters, [key]: value });
  const hasActiveFilter =
    Boolean(filters.query) || ['strategyStatus', 'actionType'].some((key) => filters[key] !== 'ALL');

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
      className="flex flex-col gap-3.5 rounded-2xl border border-gray-200/90 bg-white p-4.5 shadow-2xs"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <form onSubmit={handleSearch} className="relative min-w-0 flex-1 sm:min-w-[280px] xl:max-w-md">
          <label htmlFor="strategy-execution-search" className="sr-only">
            전략 번호 또는 상품명 검색
          </label>
          <input
            ref={searchInputRef}
            id="strategy-execution-search"
            type="search"
            defaultValue={filters.query}
            placeholder="전략 번호 또는 상품명으로 빠른 검색..."
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] pl-10 pr-20 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#27B06E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#27B06E]/20"
          />
          <Icon
            icon={SearchNormal}
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-[#27B06E] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#20945C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#27B06E]/40"
          >
            검색
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-1"
            role="group"
            aria-label="액션 타입"
          >
            <button
              type="button"
              aria-pressed={filters.actionType === 'ALL'}
              onClick={() => setFilter('actionType', 'ALL')}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                filters.actionType === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              전체 액션
            </button>
            {SUPPORTED_ACTION_TYPES.map((type) => {
              const selected = filters.actionType === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFilter('actionType', selected ? 'ALL' : type)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    selected ? 'bg-[#27B06E] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {actionTypeMeta[type].shortLabel}
                </button>
              );
            })}
          </div>

          <div className="w-[132px]">
            <SelectMenu
              value={filters.strategyStatus}
              onValueChange={(value) => setFilter('strategyStatus', value)}
              aria-label="전략 전체 상태"
              options={[
                { value: 'ALL', label: '전체 상태' },
                ...STRATEGY_STATUSES.map((status) => ({ value: status, label: strategyStatusMeta[status].label })),
              ]}
            />
          </div>

          <button
            type="button"
            onClick={handleReset}
            title="모든 필터 초기화"
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <Icon icon={Refresh} size={14} aria-hidden="true" />
            초기화
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
        {hasActiveFilter ? (
          <>
            <span className="mr-1 text-[11px] font-bold text-gray-400">적용된 조건:</span>
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
            {filters.actionType !== 'ALL' ? (
              <ActiveFilterChip
                label="액션"
                value={actionTypeMeta[filters.actionType].label}
                tone="primary"
                onRemove={() => setFilter('actionType', 'ALL')}
              />
            ) : null}
            {filters.strategyStatus !== 'ALL' ? (
              <ActiveFilterChip
                label="전략 상태"
                value={strategyStatusMeta[filters.strategyStatus].label}
                tone="info"
                onRemove={() => setFilter('strategyStatus', 'ALL')}
              />
            ) : null}
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-semibold text-gray-400 transition-colors hover:text-rose-600"
            >
              모든 조건 지우기
            </button>
          </>
        ) : (
          <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            모든 전략을 표시하고 있습니다.
          </span>
        )}
        <span className="ml-auto text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          검색 결과 <strong className="text-[color:var(--text-heading)]">{resultCount}건</strong>
        </span>
      </div>
    </section>
  );
}
