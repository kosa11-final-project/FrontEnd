import { lazy, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Bookmark, CloseCircle, Filter, Refresh, SearchNormal } from 'reicon-react';
import { INVENTORY_CHANNEL_TYPES } from '../model/filterState.js';
import { CHANNEL_NAMES, STORAGE_NAMES } from '@/entities/inventory/model/inventory.js';
import { getRiskGradeLabel } from '@/entities/risk/model/risk.js';
import { useFilterPresetStore } from '../model/filterPresetStore.js';
import { FilterPresetPopover } from './FilterPresetPopover.jsx';
import { SaveFilterPresetDialog } from './SaveFilterPresetDialog.jsx';

const LazyInventoryFilterModal = lazy(() =>
  import('./InventoryFilterModal.jsx').then((module) => ({ default: module.InventoryFilterModal })),
);

export function InventoryFilterBar({
  filters,
  filterOptions,
  isFilterOptionsLoading = false,
  onFilterChange,
  onReset,
}) {
  const searchInputRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const currentQueryRef = useRef(filters.q || '');
  const baseSessionId = useId();
  // 사용자가 페이지에 머무는 동안 하나의 세션 ID를 유지하여, 조건이 계속 바뀌어도
  // 1개의 슬롯에만 최종 업데이트되도록 합니다. (페이지 이탈/재방문/초기화 시 확정)
  const pageSessionIdRef = useRef(baseSessionId);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const handleCloseFilterModal = useCallback(() => setIsFilterModalOpen(false), []);
  const handleApplyFilter = useCallback((nextFilters) => onFilterChange(nextFilters), [onFilterChange]);

  // URL이 뒤로가기/초기화로 변경될 때 uncontrolled 입력과 디바운스를 동기화합니다.
  useEffect(() => {
    const nextQuery = filters.q || '';
    currentQueryRef.current = nextQuery;
    if (searchInputRef.current && searchInputRef.current.value !== nextQuery) {
      searchInputRef.current.value = nextQuery;
    }
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  }, [filters.q]);

  useEffect(
    () => () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    },
    [],
  );

  // 300ms 디바운스 검색어 자동 반영. 입력값은 URL과 분리해 타이핑 중 재조회하지 않습니다.
  const handleKeywordChange = (event) => {
    const nextValue = event.target.value;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const trimmed = nextValue.trim();
      if (trimmed !== currentQueryRef.current) {
        onFilterChange({ q: trimmed });
      }
      searchDebounceRef.current = null;
    }, 300);
  };

  const searchInputId = useId();

  const channelOptions = (
    filterOptions?.channels?.length
      ? filterOptions.channels
      : INVENTORY_CHANNEL_TYPES.map((code) => ({ code, name: CHANNEL_NAMES[code] || code }))
  ).map((opt) => ({
    code: typeof opt === 'string' ? opt : opt.code,
    name: CHANNEL_NAMES[typeof opt === 'string' ? opt : opt.code] || (typeof opt === 'object' ? opt.name : opt),
  }));

  const selectedChannels = Array.isArray(filters.channelType)
    ? filters.channelType
    : filters.channelType
      ? [filters.channelType]
      : [];

  const selectedStorageTypes = Array.isArray(filters.storageType)
    ? filters.storageType
    : filters.storageType
      ? [filters.storageType]
      : [];

  const selectedRiskGrades = Array.isArray(filters.riskGrade)
    ? filters.riskGrade
    : filters.riskGrade
      ? [filters.riskGrade]
      : [];

  const selectedCategoryIds = useMemo(
    () => (Array.isArray(filters.categoryIds) ? filters.categoryIds : filters.categoryId ? [filters.categoryId] : []),
    [filters.categoryIds, filters.categoryId],
  );

  const selectedWarehouses = useMemo(
    () =>
      Array.isArray(filters.warehouseCode)
        ? filters.warehouseCode.filter(Boolean)
        : filters.warehouseCode
          ? [filters.warehouseCode]
          : [],
    [filters.warehouseCode],
  );

  const selectedSalesPoints = useMemo(
    () =>
      Array.isArray(filters.salesPointCode)
        ? filters.salesPointCode.filter(Boolean)
        : filters.salesPointCode
          ? [filters.salesPointCode]
          : [],
    [filters.salesPointCode],
  );

  // 상세 필터 활성 조건 개수 계산 (카테고리, 보관유형, 위험도, 재고 부족, 물류센터, 판매처)
  const detailFilterCount =
    selectedCategoryIds.length +
    selectedStorageTypes.length +
    selectedRiskGrades.length +
    selectedWarehouses.length +
    selectedSalesPoints.length +
    (filters.shortageYn === 'Y' ? 1 : 0);

  // 검색창 엔터 즉시 제출
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    onFilterChange({ q: (searchInputRef.current?.value || '').trim() });
  };

  // 채널 세그먼트 토글
  const handleChannelToggle = (channelCode) => {
    if (!channelCode) {
      onFilterChange({ channelType: [] });
      return;
    }
    const next = selectedChannels.includes(channelCode)
      ? selectedChannels.filter((c) => c !== channelCode)
      : [...selectedChannels, channelCode];
    onFilterChange({ channelType: next });
  };

  const categories = filterOptions?.categories;
  const warehouses = filterOptions?.warehouses;
  const salesPoints = filterOptions?.salesPoints;

  // 전체 초기화
  const handleReset = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchInputRef.current) searchInputRef.current.value = '';
    // 초기화 시 지금까지의 세션을 픽스하고, 다음 탐색을 위해 새 세션 ID 발급
    pageSessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    onReset();
  };

  // 카테고리명 역조회
  const activeCategoryLabels = useMemo(() => {
    if (!selectedCategoryIds.length) return [];

    return selectedCategoryIds.map((categoryId) => {
      const target = categories?.find((c) => String(c.code) === String(categoryId));
      if (!target) return { id: categoryId, label: `카테고리 (${categoryId})` };

      const path = [target.name];
      let curr = target;
      const visited = new Set([String(target.code)]);
      while (curr?.parentCode) {
        const parentCode = String(curr.parentCode);
        if (visited.has(parentCode)) break;

        const parent = categories.find((c) => String(c.code) === parentCode);
        if (!parent) break;
        path.unshift(parent.name);
        visited.add(parentCode);
        curr = parent;
      }
      return { id: categoryId, label: path.join(' › ') };
    });
  }, [selectedCategoryIds, categories]);

  // 물류센터명 조회
  const activeWarehouseNames = useMemo(
    () =>
      selectedWarehouses.map((code) => {
        const target = warehouses?.find((w) => (w.code || w.warehouseCode) === code);
        return target?.name || target?.warehouseName || code;
      }),
    [selectedWarehouses, warehouses],
  );

  // 판매처명 조회
  const activeSalesPointNames = useMemo(
    () =>
      selectedSalesPoints.map((code) => {
        const target = salesPoints?.find((sp) => (sp.code || sp.salesPointCode) === code);
        return target?.name || target?.salesPointName || code;
      }),
    [selectedSalesPoints, salesPoints],
  );

  // 어떤 조건이라도 활성화되었는지 여부
  const hasAnyActiveFilter = Boolean(filters.q) || selectedChannels.length > 0 || detailFilterCount > 0;

  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const addRecentFilter = useFilterPresetStore((state) => state.addRecentFilter);
  const recentDebounceTimerRef = useRef(null);

  // 필터 조건이 변경될 때 현재 세션의 슬롯에만 '최종 필터'를 갱신 (중간 단계가 누적되지 않음)
  useEffect(() => {
    if (recentDebounceTimerRef.current) {
      clearTimeout(recentDebounceTimerRef.current);
    }

    if (hasAnyActiveFilter) {
      recentDebounceTimerRef.current = setTimeout(() => {
        addRecentFilter(filters, pageSessionIdRef.current);
      }, 500);
    }

    return () => {
      if (recentDebounceTimerRef.current) {
        clearTimeout(recentDebounceTimerRef.current);
      }
    };
  }, [filters, hasAnyActiveFilter, addRecentFilter]);

  // 프리셋 또는 최근 검색 클릭 시 필터 적용
  const handleApplyPreset = useCallback(
    (presetFilters) => {
      if (searchInputRef.current) {
        searchInputRef.current.value = presetFilters.q || '';
      }
      currentQueryRef.current = presetFilters.q || '';
      onFilterChange(presetFilters);
    },
    [onFilterChange],
  );

  return (
    <div className="inventory-filter-bar flex flex-col gap-3.5 rounded-2xl border border-gray-200/90 bg-white p-4.5 shadow-2xs">
      {/* 1층: 검색바 + 채널 빠른 전환 칩 + 상세 필터 버튼 + 초기화 */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* 검색창 */}
        <form onSubmit={handleSearchSubmit} className="relative w-full min-w-0 max-w-md flex-1 lg:min-w-[280px]">
          <label htmlFor={searchInputId} className="sr-only">
            상품명 또는 SKU 코드 검색
          </label>
          <input
            ref={searchInputRef}
            id={searchInputId}
            type="search"
            placeholder="상품명, SKU 코드"
            defaultValue={filters.q || ''}
            onChange={handleKeywordChange}
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] pl-10 pr-20 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[var(--primary)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
          <SearchNormal
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={17}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[var(--primary-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
          >
            검색
          </button>
          {isFilterOptionsLoading && (
            <span className="text-[11px] font-medium text-gray-400" role="status" aria-live="polite">
              필터 기준정보 불러오는 중...
            </span>
          )}
        </form>

        {/* 우측 컨트롤 그룹 (채널 세그먼트 + 상세 필터 팝오버 버튼 + 초기화) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 채널 퀵 세그먼트 */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-1">
            <button
              type="button"
              onClick={() => handleChannelToggle('')}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                selectedChannels.length === 0 ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              전체 채널
            </button>
            {channelOptions.map((option) => {
              const type = typeof option === 'string' ? option : option.code;
              const isSelected = selectedChannels.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChannelToggle(type)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    isSelected ? 'bg-[var(--primary)] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {typeof option === 'string' ? CHANNEL_NAMES[type] || type : option.name || type}
                </button>
              );
            })}
          </div>

          {/* 검색·채널·상세 필터 조건의 결합 방식 */}
          <div
            className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1"
            role="group"
            aria-label="필터 조건 결합 방식"
          >
            {['AND', 'OR'].map((operator) => {
              const isSelected = (filters.filterOperator || 'AND') === operator;
              return (
                <button
                  key={operator}
                  type="button"
                  aria-label={`${operator} 조건으로 필터링`}
                  aria-pressed={isSelected}
                  title={operator === 'AND' ? '선택한 조건을 모두 만족' : '선택한 조건 중 하나 이상 만족'}
                  onClick={() => onFilterChange({ filterOperator: operator })}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-black transition-colors ${
                    isSelected
                      ? 'bg-white text-[color:var(--primary-strong)] shadow-xs ring-1 ring-[var(--primary)]/30'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {operator}
                </button>
              );
            })}
          </div>

          {/* 상세 필터 팝오버 열기 버튼 */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all ${
              detailFilterCount > 0
                ? 'border-[var(--primary)] bg-[#EBF7F0] text-[color:var(--primary-strong)] shadow-2xs'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <Filter size={15} />
            <span>상세 필터</span>
            {detailFilterCount > 0 && (
              <span className="flex size-4.5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-mono font-bold text-white">
                {detailFilterCount}
              </span>
            )}
          </button>

          {/* 최근/저장 필터 프리셋 팝오버 */}
          <FilterPresetPopover onApplyPreset={handleApplyPreset} />

          {/* 필터 초기화 버튼 */}
          <button
            type="button"
            onClick={handleReset}
            title="필터 초기화"
            aria-label="필터 초기화"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <Refresh size={14} />
            <span>필터 초기화</span>
          </button>
        </div>
      </div>

      {/* 2층: 활성 필터 칩 (Active Filter Badges) - 적용된 조건이 있을 때만 스마트 노출 */}
      {hasAnyActiveFilter && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-gray-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[11px] font-bold text-gray-400 mr-1 shrink-0">적용된 조건:</span>

            {/* 1. 검색어 칩 */}
            {filters.q && (
              <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-700">
                <span className="text-gray-400">검색:</span>
                <span className="font-semibold">"{filters.q}"</span>
                <button
                  type="button"
                  onClick={() => {
                    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                    if (searchInputRef.current) searchInputRef.current.value = '';
                    onFilterChange({ q: '' });
                  }}
                  className="text-gray-400 hover:text-gray-700"
                  aria-label="검색어 필터 해제"
                >
                  <CloseCircle size={13} />
                </button>
              </span>
            )}

            {/* 2. 채널 칩 */}
            {selectedChannels.map((channelCode) => (
              <span
                key={channelCode}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-[#1E8251]"
              >
                <span>{CHANNEL_NAMES[channelCode] || channelCode}</span>
                <button
                  type="button"
                  onClick={() => handleChannelToggle(channelCode)}
                  className="text-emerald-600 hover:text-emerald-900"
                  aria-label={`${CHANNEL_NAMES[channelCode]} 필터 해제`}
                >
                  <CloseCircle size={13} />
                </button>
              </span>
            ))}

            {/* 3. 카테고리 칩들 */}
            {activeCategoryLabels.map(({ id, label }) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-900"
              >
                <span className="text-emerald-700 font-bold">카테고리:</span>
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextCategoryIds = selectedCategoryIds.filter((categoryId) => categoryId !== id);
                    onFilterChange({ categoryId: nextCategoryIds[0] || '', categoryIds: nextCategoryIds });
                  }}
                  className="text-emerald-600 hover:text-emerald-900"
                  aria-label={`${label} 카테고리 필터 해제`}
                >
                  <CloseCircle size={13} />
                </button>
              </span>
            ))}

            {/* 4. 보관유형 칩들 */}
            {selectedStorageTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-medium text-blue-800"
              >
                <span className="text-blue-600 font-bold">보관:</span>
                <span>{STORAGE_NAMES[type] || type}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ storageType: selectedStorageTypes.filter((t) => t !== type) })}
                  className="text-blue-500 hover:text-blue-800"
                  aria-label={`${STORAGE_NAMES[type]} 필터 해제`}
                >
                  <CloseCircle size={13} />
                </button>
              </span>
            ))}

            {/* 5. 위험등급 칩들 */}
            {selectedRiskGrades.map((grade) => (
              <span
                key={grade}
                className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-900"
              >
                <span className="text-amber-700 font-bold">위험:</span>
                <span>{getRiskGradeLabel(grade)}</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ riskGrade: selectedRiskGrades.filter((g) => g !== grade) })}
                  className="text-amber-600 hover:text-amber-900"
                  aria-label={`${getRiskGradeLabel(grade)} 필터 해제`}
                >
                  <CloseCircle size={13} />
                </button>
              </span>
            ))}

            {/* 6. 재고 부족 상품이 포함된 SKU 칩 */}
            {filters.shortageYn === 'Y' && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-900">
                <span className="text-amber-700 font-bold">재고:</span>
                <span>재고 부족 상품 포함</span>
                <button
                  type="button"
                  onClick={() => onFilterChange({ shortageYn: '' })}
                  className="text-amber-600 hover:text-amber-900"
                  aria-label="재고 부족 상품 포함 필터 해제"
                >
                  <CloseCircle size={13} />
                </button>
              </span>
            )}

            {/* 7. 물류센터 칩들 */}
            {activeWarehouseNames.map((name, index) => (
              <span
                key={`warehouse-${selectedWarehouses[index]}`}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-800"
              >
                <span className="text-gray-500 font-bold">센터:</span>
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      warehouseCode: selectedWarehouses.filter((_, selectedIndex) => selectedIndex !== index),
                    })
                  }
                  className="text-gray-400 hover:text-gray-700"
                  aria-label={`${name} 물류센터 필터 해제`}
                >
                  <CloseCircle size={13} />
                </button>
              </span>
            ))}

            {/* 8. 판매처 칩들 */}
            {activeSalesPointNames.map((name, index) => (
              <span
                key={`sales-point-${selectedSalesPoints[index]}`}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-800"
              >
                <span className="text-gray-500 font-bold">판매처:</span>
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      salesPointCode: selectedSalesPoints.filter((_, selectedIndex) => selectedIndex !== index),
                    })
                  }
                  className="text-gray-400 hover:text-gray-700"
                  aria-label={`${name} 판매처 필터 해제`}
                >
                  <CloseCircle size={13} />
                </button>
              </span>
            ))}
          </div>

          {/* 우측 끝 여백: 현재 필터 저장하기 버튼 */}
          <button
            type="button"
            onClick={() => setIsSavePresetModalOpen(true)}
            aria-label="현재 선택된 필터 조건 저장하기"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 shadow-2xs transition-all shrink-0 ml-auto"
          >
            <Bookmark size={13} className="text-emerald-600" />
            <span>현재 필터 저장하기</span>
          </button>
        </div>
      )}

      {/* 프리셋 저장 모달 다이얼로그 */}
      <SaveFilterPresetDialog
        open={isSavePresetModalOpen}
        filters={filters}
        onClose={() => setIsSavePresetModalOpen(false)}
      />

      {/* 상세 필터 팝오버 / 모달 다이얼로그 */}
      {isFilterModalOpen ? (
        <Suspense fallback={null}>
          <LazyInventoryFilterModal
            open
            filters={filters}
            filterOptions={filterOptions}
            isFilterOptionsLoading={isFilterOptionsLoading}
            onClose={handleCloseFilterModal}
            onApply={handleApplyFilter}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
