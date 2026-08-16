import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { SearchNormal, Refresh, Filter, CloseCircle } from 'reicon-react';
import { INVENTORY_CHANNEL_TYPES } from '../model/filterState.js';
import { CHANNEL_NAMES, RISK_GRADE_META, STORAGE_NAMES, REGION_NAMES } from '@/entities/inventory';
import { InventoryFilterModal } from './InventoryFilterModal.jsx';

const ASSESSMENT_STATUS_LABELS = {
  ASSESSED: '판정완료',
  UNASSESSED: '미판정',
  REASSESSING: '재판정중',
  STALE: '만료',
  FAILED: '실패',
};

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

  const selectedAssessmentStatuses = Array.isArray(filters.assessmentStatus)
    ? filters.assessmentStatus
    : filters.assessmentStatus
      ? [filters.assessmentStatus]
      : [];

  const selectedWarehouse = Array.isArray(filters.warehouseCode)
    ? filters.warehouseCode[0] || ''
    : filters.warehouseCode || '';

  const selectedSalesPoint = Array.isArray(filters.salesPointCode)
    ? filters.salesPointCode[0] || ''
    : filters.salesPointCode || '';

  const selectedRegion = Array.isArray(filters.regionCode) ? filters.regionCode[0] || '' : filters.regionCode || '';

  // 상세 필터 활성 조건 개수 계산 (상세 모달에 들어가는 항목들)
  const detailFilterCount =
    (filters.categoryId ? 1 : 0) +
    selectedStorageTypes.length +
    selectedRiskGrades.length +
    selectedAssessmentStatuses.length +
    (selectedWarehouse ? 1 : 0) +
    (selectedSalesPoint ? 1 : 0) +
    (selectedRegion ? 1 : 0);

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
  const regions = filterOptions?.regions;

  // 전체 초기화
  const handleReset = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchInputRef.current) searchInputRef.current.value = '';
    onReset();
  };

  // 카테고리명 역조회
  const activeCategoryLabel = useMemo(() => {
    if (!filters.categoryId || !categories?.length) return '';
    const target = categories.find((c) => String(c.code) === String(filters.categoryId));
    if (!target) return `카테고리 (${filters.categoryId})`;

    // 부모를 추적하여 경로 생성
    const path = [target.name];
    let curr = target;
    const visited = new Set([String(target.code)]);
    while (curr?.parentCode) {
      const parentCode = String(curr.parentCode);
      if (visited.has(parentCode)) break;

      const parent = categories.find((c) => String(c.code) === parentCode);
      if (parent) {
        path.unshift(parent.name);
        visited.add(parentCode);
        curr = parent;
      } else {
        break;
      }
    }
    return path.join(' › ');
  }, [filters.categoryId, categories]);

  // 물류센터명 조회
  const activeWarehouseName = useMemo(() => {
    if (!selectedWarehouse || !warehouses?.length) return selectedWarehouse || '';
    const target = warehouses.find((w) => (w.code || w.warehouseCode) === selectedWarehouse);
    return target?.name || target?.warehouseName || selectedWarehouse;
  }, [selectedWarehouse, warehouses]);

  // 판매처명 조회
  const activeSalesPointName = useMemo(() => {
    if (!selectedSalesPoint || !salesPoints?.length) return selectedSalesPoint || '';
    const target = salesPoints.find((sp) => (sp.code || sp.salesPointCode) === selectedSalesPoint);
    return target?.name || target?.salesPointName || selectedSalesPoint;
  }, [selectedSalesPoint, salesPoints]);

  // 권역명 조회
  const activeRegionName = useMemo(() => {
    if (!selectedRegion) return '';
    if (REGION_NAMES[selectedRegion]) return REGION_NAMES[selectedRegion];
    if (!regions?.length) return selectedRegion;
    const target = regions.find((r) => (r.code || r.regionCode) === selectedRegion);
    return target?.name || target?.regionName || selectedRegion;
  }, [selectedRegion, regions]);

  // 어떤 조건이라도 활성화되었는지 여부
  const hasAnyActiveFilter = Boolean(filters.q) || selectedChannels.length > 0 || detailFilterCount > 0;

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-gray-200/90 bg-white p-4.5 shadow-2xs">
      {/* 1층: 검색바 + 채널 빠른 전환 칩 + 상세 필터 버튼 + 초기화 */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* 검색창 */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[280px] flex-1 max-w-md">
          <label htmlFor={searchInputId} className="sr-only">
            상품명, SKU 또는 판매처 검색
          </label>
          <input
            ref={searchInputRef}
            id={searchInputId}
            type="search"
            placeholder="상품명, SKU 코드, 판매처명으로 빠른 검색..."
            defaultValue={filters.q || ''}
            onChange={handleKeywordChange}
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] pl-10 pr-20 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#27B06E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#27B06E]/20"
          />
          <SearchNormal
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={17}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-[#27B06E] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#20945C] focus:outline-none focus:ring-2 focus:ring-[#27B06E]/40"
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
                    isSelected ? 'bg-[#27B06E] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {typeof option === 'string' ? CHANNEL_NAMES[type] || type : option.name || type}
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
                ? 'border-[#27B06E] bg-[#EBF7F0] text-[#1E8251] shadow-2xs'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            <Filter size={15} />
            <span>상세 필터</span>
            {detailFilterCount > 0 && (
              <span className="flex size-4.5 items-center justify-center rounded-full bg-[#27B06E] text-[10px] font-mono font-bold text-white">
                {detailFilterCount}
              </span>
            )}
          </button>

          {/* 전체 초기화 버튼 */}
          <button
            type="button"
            onClick={handleReset}
            title="모든 필터 초기화"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <Refresh size={14} />
            <span>초기화</span>
          </button>
        </div>
      </div>

      {/* 2층: 활성 필터 칩 (Active Filter Badges) - 적용된 조건이 있을 때만 스마트 노출 */}
      {hasAnyActiveFilter && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-xs">
          <span className="text-[11px] font-bold text-gray-400 mr-1">적용된 조건:</span>

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

          {/* 3. 카테고리 칩 */}
          {activeCategoryLabel && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-900">
              <span className="text-emerald-700 font-bold">카테고리:</span>
              <span>{activeCategoryLabel}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ categoryId: '' })}
                className="text-emerald-600 hover:text-emerald-900"
                aria-label="카테고리 필터 해제"
              >
                <CloseCircle size={13} />
              </button>
            </span>
          )}

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
              <span>{RISK_GRADE_META[grade]?.label || grade}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ riskGrade: selectedRiskGrades.filter((g) => g !== grade) })}
                className="text-amber-600 hover:text-amber-900"
                aria-label={`${grade} 필터 해제`}
              >
                <CloseCircle size={13} />
              </button>
            </span>
          ))}

          {/* 6. 판정 상태 칩들 */}
          {selectedAssessmentStatuses.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 font-medium text-purple-900"
            >
              <span className="text-purple-700 font-bold">판정:</span>
              <span>{ASSESSMENT_STATUS_LABELS[status] || status}</span>
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    assessmentStatus: selectedAssessmentStatuses.filter((s) => s !== status),
                  })
                }
                className="text-purple-600 hover:text-purple-900"
                aria-label={`${status} 판정 필터 해제`}
              >
                <CloseCircle size={13} />
              </button>
            </span>
          ))}

          {/* 7. 물류센터 칩 */}
          {activeWarehouseName && (
            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-800">
              <span className="text-gray-500 font-bold">센터:</span>
              <span>{activeWarehouseName}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ warehouseCode: [] })}
                className="text-gray-400 hover:text-gray-700"
                aria-label="물류센터 필터 해제"
              >
                <CloseCircle size={13} />
              </button>
            </span>
          )}

          {/* 8. 판매처 칩 */}
          {activeSalesPointName && (
            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-800">
              <span className="text-gray-500 font-bold">판매처:</span>
              <span>{activeSalesPointName}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ salesPointCode: [] })}
                className="text-gray-400 hover:text-gray-700"
                aria-label="판매처 필터 해제"
              >
                <CloseCircle size={13} />
              </button>
            </span>
          )}

          {/* 9. 권역 칩 */}
          {activeRegionName && (
            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-medium text-gray-800">
              <span className="text-gray-500 font-bold">권역:</span>
              <span>{activeRegionName}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ regionCode: [] })}
                className="text-gray-400 hover:text-gray-700"
                aria-label="권역 필터 해제"
              >
                <CloseCircle size={13} />
              </button>
            </span>
          )}

          {/* 1-Click 조건 전체 초기화 텍스트 버튼 */}
          <button
            type="button"
            onClick={handleReset}
            className="ml-auto text-[11px] font-semibold text-gray-400 hover:text-rose-600 transition-colors"
          >
            모든 조건 지우기
          </button>
        </div>
      )}

      {/* 상세 필터 팝오버 / 모달 다이얼로그 */}
      <InventoryFilterModal
        open={isFilterModalOpen}
        filters={filters}
        filterOptions={filterOptions}
        isFilterOptionsLoading={isFilterOptionsLoading}
        onClose={handleCloseFilterModal}
        onApply={handleApplyFilter}
      />
    </div>
  );
}
