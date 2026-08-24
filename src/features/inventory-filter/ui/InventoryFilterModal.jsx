import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CloseCircle, Refresh, TickCircle, ChevronRight, Filter } from 'reicon-react';
import { STORAGE_NAMES } from '@/entities/inventory';
import { ASSESSMENT_STATUS_LABELS, getRiskGradeLabel, normalizeRiskGrade } from '@/entities/risk';
import { INVENTORY_ASSESSMENT_STATUSES } from '../model/filterState.js';

const STORAGE_BADGE_COLORS = {
  FROZEN: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  COLD: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  ROOM_TEMP: 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
};

const RISK_BADGE_COLORS = {
  DANGER: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  CAUTION: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
  SAFE: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  NORMAL: 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
};

const RISK_BADGE_COLOR_ALIASES = {
  GOOD: RISK_BADGE_COLORS.SAFE,
  WARNING: RISK_BADGE_COLORS.CAUTION,
  CRITICAL: RISK_BADGE_COLORS.DANGER,
};

const ASSESSMENT_STATUS_META = {
  ASSESSED: {
    label: ASSESSMENT_STATUS_LABELS.ASSESSED,
    color: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  },
  UNASSESSED: {
    label: ASSESSMENT_STATUS_LABELS.UNASSESSED,
    color: 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
  },
};

function InventoryFilterModalContent({ filters, filterOptions, isFilterOptionsLoading, onClose, onApply }) {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const closeButtonRef = useRef(null);

  const categories = filterOptions?.categories;
  const allCategories = useMemo(() => categories || [], [categories]);
  const storageOptions = filterOptions?.storageTypes || [];
  const riskOptions = filterOptions?.riskGrades || [];
  const warehouseOptions = filterOptions?.warehouses || [];
  const salesPointOptions = filterOptions?.salesPoints || [];
  const regionOptions = filterOptions?.regions || [];
  const assessmentStatuses = filterOptions?.assessmentStatuses;
  const assessmentStatusOptions = useMemo(
    () =>
      (assessmentStatuses?.length ? assessmentStatuses : INVENTORY_ASSESSMENT_STATUSES).filter((option) =>
        INVENTORY_ASSESSMENT_STATUSES.includes(typeof option === 'string' ? option : option.code),
      ),
    [assessmentStatuses],
  );

  // 카테고리 역추적 초기 상태 계산: URL의 filters.categoryId가 최우선 단일 진실 공급원(SSOT)입니다.
  const initialCategoryHierarchy = useMemo(() => {
    if (filters.categoryId && allCategories.length > 0) {
      const targetCat = allCategories.find((c) => String(c.code) === String(filters.categoryId));
      if (targetCat) {
        let l1 = null;
        let l2 = null;
        let l3 = null;
        if (targetCat.categoryLevel === 1) {
          l1 = targetCat;
        } else if (targetCat.categoryLevel === 2) {
          l1 = allCategories.find((c) => String(c.code) === String(targetCat.parentCode)) || null;
          l2 = targetCat;
        } else if (targetCat.categoryLevel === 3) {
          const parent = allCategories.find((c) => String(c.code) === String(targetCat.parentCode));
          l1 = parent ? allCategories.find((c) => String(c.code) === String(parent.parentCode)) || null : null;
          l2 = parent || null;
          l3 = targetCat;
        }
        return { l1, l2, l3 };
      }
    }

    return { l1: null, l2: null, l3: null };
  }, [filters.categoryId, allCategories]);

  // 모달 내부 로컬 드래프트 상태 (마운트 시 초기화)
  const [draftCategoryId, setDraftCategoryId] = useState(filters.categoryId || '');
  const [draftFilterOperator, setDraftFilterOperator] = useState(filters.filterOperator === 'OR' ? 'OR' : 'AND');
  const [draftStorageTypes, setDraftStorageTypes] = useState(
    Array.isArray(filters.storageType) ? filters.storageType : filters.storageType ? [filters.storageType] : [],
  );
  const [draftRiskGrades, setDraftRiskGrades] = useState(
    Array.isArray(filters.riskGrade) ? filters.riskGrade : filters.riskGrade ? [filters.riskGrade] : [],
  );
  const [draftAssessmentStatuses, setDraftAssessmentStatuses] = useState(
    Array.isArray(filters.assessmentStatus)
      ? filters.assessmentStatus
      : filters.assessmentStatus
        ? [filters.assessmentStatus]
        : [],
  );
  const [draftWarehouseCode, setDraftWarehouseCode] = useState(
    Array.isArray(filters.warehouseCode) ? filters.warehouseCode[0] || '' : filters.warehouseCode || '',
  );
  const [draftSalesPointCode, setDraftSalesPointCode] = useState(
    Array.isArray(filters.salesPointCode) ? filters.salesPointCode[0] || '' : filters.salesPointCode || '',
  );
  const [draftRegionCode, setDraftRegionCode] = useState(
    Array.isArray(filters.regionCode) ? filters.regionCode[0] || '' : filters.regionCode || '',
  );

  // 카테고리 계층 선택 탐색 상태
  const [selectedL1, setSelectedL1] = useState(initialCategoryHierarchy.l1);
  const [selectedL2, setSelectedL2] = useState(initialCategoryHierarchy.l2);
  const [selectedL3, setSelectedL3] = useState(initialCategoryHierarchy.l3);

  const warehouseSelectId = useId();
  const salesPointSelectId = useId();
  const regionSelectId = useId();

  const selectedWarehouseOption = warehouseOptions.find((option) => {
    const code = typeof option === 'string' ? option : option.code || option.warehouseCode;
    return code === draftWarehouseCode;
  });
  const isRegisteredEmptyWarehouse =
    selectedWarehouseOption &&
    typeof selectedWarehouseOption !== 'string' &&
    selectedWarehouseOption.availability === 'REGISTERED_EMPTY';

  // 카테고리 트리 계층 필터
  const l1Categories = useMemo(() => {
    return allCategories.filter((c) => c.categoryLevel === 1 || !c.parentCode);
  }, [allCategories]);

  const l2Categories = useMemo(() => {
    if (!selectedL1) return [];
    return allCategories.filter(
      (c) => String(c.parentCode) === String(selectedL1.code) && (c.categoryLevel === 2 || !c.categoryLevel),
    );
  }, [allCategories, selectedL1]);

  const l3Categories = useMemo(() => {
    if (!selectedL2) return [];
    return allCategories.filter(
      (c) => String(c.parentCode) === String(selectedL2.code) && (c.categoryLevel === 3 || !c.categoryLevel),
    );
  }, [allCategories, selectedL2]);

  // ESC 키 닫기, Body Scroll Lock, Focus Trap 및 닫기 후 포커스 복원
  useEffect(() => {
    previousActiveElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [onClose]);

  // 카테고리 선택 핸들러
  const handleSelectL1 = (cat) => {
    if (selectedL1?.code === cat.code) {
      setSelectedL1(null);
      setSelectedL2(null);
      setSelectedL3(null);
      setDraftCategoryId('');
    } else {
      setSelectedL1(cat);
      setSelectedL2(null);
      setSelectedL3(null);
      setDraftCategoryId(String(cat.code));
    }
  };

  const handleSelectL2 = (cat) => {
    if (selectedL2?.code === cat.code) {
      setSelectedL2(null);
      setSelectedL3(null);
      setDraftCategoryId(selectedL1 ? String(selectedL1.code) : '');
    } else {
      setSelectedL2(cat);
      setSelectedL3(null);
      setDraftCategoryId(String(cat.code));
    }
  };

  const handleSelectL3 = (cat) => {
    if (selectedL3?.code === cat.code) {
      setSelectedL3(null);
      setDraftCategoryId(selectedL2 ? String(selectedL2.code) : selectedL1 ? String(selectedL1.code) : '');
    } else {
      setSelectedL3(cat);
      setDraftCategoryId(String(cat.code));
    }
  };

  const handleClearCategory = () => {
    setSelectedL1(null);
    setSelectedL2(null);
    setSelectedL3(null);
    setDraftCategoryId('');
  };

  // 보관유형 토글
  const toggleStorageType = (code) => {
    setDraftStorageTypes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  // 위험등급 토글
  const toggleRiskGrade = (code) => {
    setDraftRiskGrades((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  // 판정 상태 토글
  const toggleAssessmentStatus = (code) => {
    setDraftAssessmentStatuses((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  // 로컬 전체 초기화
  const handleResetDraft = () => {
    setDraftFilterOperator('AND');
    setDraftCategoryId('');
    setDraftStorageTypes([]);
    setDraftRiskGrades([]);
    setDraftAssessmentStatuses([]);
    setDraftWarehouseCode('');
    setDraftSalesPointCode('');
    setDraftRegionCode('');
    setSelectedL1(null);
    setSelectedL2(null);
    setSelectedL3(null);
  };

  // 필터 적용 실행
  const handleApply = () => {
    // URL을 유일한 조회 상태 저장소로 사용하고 부모에 한 번만 방출합니다.
    onApply({
      filterOperator: draftFilterOperator,
      categoryId: draftCategoryId || '',
      storageType: draftStorageTypes,
      riskGrade: draftRiskGrades,
      assessmentStatus: draftAssessmentStatuses,
      warehouseCode: draftWarehouseCode ? [draftWarehouseCode] : [],
      salesPointCode: draftSalesPointCode ? [draftSalesPointCode] : [],
      regionCode: draftRegionCode ? [draftRegionCode] : [],
    });
    onClose();
  };

  // 활성 조건 수 계산
  const activeCount =
    (draftCategoryId ? 1 : 0) +
    draftStorageTypes.length +
    draftRiskGrades.length +
    draftAssessmentStatuses.length +
    (draftWarehouseCode ? 1 : 0) +
    (draftSalesPointCode ? 1 : 0) +
    (draftRegionCode ? 1 : 0);

  // 현재 선택된 카테고리 브레드크럼 라벨
  const currentCategoryBreadcrumb = [selectedL1?.name, selectedL2?.name, selectedL3?.name].filter(Boolean).join(' › ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* 배경 오버레이 (Backdrop) */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 팝오버 / 모달 컨테이너 */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#1E8251]">
              <Filter size={18} />
            </div>
            <div>
              <h2 id="filter-modal-title" className="text-base font-bold text-gray-900">
                상세 필터 설정
              </h2>
              <p className="text-xs text-gray-500">검색어, 채널, 상세 필터 그룹을 AND 또는 OR로 조합합니다.</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="필터 설정 닫기"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <CloseCircle size={20} />
          </button>
        </div>

        {isFilterOptionsLoading && (
          <div className="border-b border-blue-100 bg-blue-50 px-6 py-2 text-xs text-blue-800" role="status">
            필터 기준정보를 불러오는 중입니다. 잠시만 기다려 주세요.
          </div>
        )}

        {/* 모달 바디 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <fieldset className="rounded-xl border border-gray-200 bg-gray-50/80 p-3.5">
            <legend className="px-1 text-xs font-bold text-gray-800">조건 결합 방식</legend>
            <div className="flex flex-col gap-2 sm:flex-row" role="group" aria-label="필터 조건 결합 방식">
              {[
                { value: 'AND', label: '모든 조건 만족 (AND)', description: '선택한 각 필터 그룹을 모두 만족' },
                { value: 'OR', label: '하나 이상 만족 (OR)', description: '선택한 필터 그룹 중 하나 이상 만족' },
              ].map((option) => {
                const isSelected = draftFilterOperator === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={isSelected}
                    onClick={() => setDraftFilterOperator(option.value)}
                    className={`flex flex-1 items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? 'border-[#27B06E] bg-[#EBF7F0] text-[#1E8251] shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>
                      <span className="block text-xs font-bold">{option.label}</span>
                      <span className="mt-0.5 block text-[11px] font-normal opacity-80">{option.description}</span>
                    </span>
                    {isSelected && <TickCircle size={15} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              같은 그룹에서 여러 값을 선택하면 그 값들은 항상 하나 이상 일치(OR)로 처리됩니다.
            </p>
          </fieldset>

          {/* 1. 카테고리 3단계 계층 브라우저 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <span>카테고리 계층 선택</span>
                <span className="text-[11px] font-normal text-gray-500">(대분류 › 중분류 › 소분류)</span>
              </label>
              {draftCategoryId && (
                <button
                  type="button"
                  onClick={handleClearCategory}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline flex items-center gap-1"
                >
                  선택 해제
                </button>
              )}
            </div>

            {/* 선택된 카테고리 브레드크럼 피드백 */}
            {currentCategoryBreadcrumb ? (
              <div className="mb-2.5 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-emerald-900">
                  <span className="font-bold text-[#1E8251]">선택됨:</span>
                  <span>{currentCategoryBreadcrumb}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  {selectedL3 ? '소분류 필터' : selectedL2 ? '중분류 하위 전체' : '대분류 하위 전체'}
                </span>
              </div>
            ) : (
              <div className="mb-2.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-500">
                카테고리를 선택하지 않으면 전체 카테고리 상품이 표시됩니다.
              </div>
            )}

            {/* 3열 계층 선택 그리드 */}
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-gray-50/40 p-2.5 h-56">
              {/* 1열: 대분류 */}
              <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-600">
                  <span>1. 대분류</span>
                  <span className="text-[10px] text-gray-400 font-normal">{l1Categories.length}개</span>
                </div>
                <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                  {l1Categories.map((cat) => {
                    const isSelected = selectedL1?.code === cat.code;
                    return (
                      <button
                        key={cat.code}
                        type="button"
                        disabled={isFilterOptionsLoading}
                        onClick={() => handleSelectL1(cat)}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition-colors ${
                          isSelected ? 'bg-[#EBF7F0] font-bold text-[#1E8251]' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <ChevronRight size={12} className={isSelected ? 'text-[#27B06E]' : 'text-gray-300'} />
                      </button>
                    );
                  })}
                  {l1Categories.length === 0 && (
                    <div className="p-3 text-center text-xs text-gray-400">카테고리 없음</div>
                  )}
                </div>
              </div>

              {/* 2열: 중분류 */}
              <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-600">
                  <span>2. 중분류</span>
                  {selectedL1 && <span className="text-[10px] text-gray-400 font-normal">{l2Categories.length}개</span>}
                </div>
                <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                  {selectedL1 ? (
                    l2Categories.map((cat) => {
                      const isSelected = selectedL2?.code === cat.code;
                      return (
                        <button
                          key={cat.code}
                          type="button"
                          disabled={isFilterOptionsLoading}
                          onClick={() => handleSelectL2(cat)}
                          className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition-colors ${
                            isSelected ? 'bg-[#EBF7F0] font-bold text-[#1E8251]' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          <ChevronRight size={12} className={isSelected ? 'text-[#27B06E]' : 'text-gray-300'} />
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex h-full items-center justify-center p-3 text-center text-[11px] text-gray-400">
                      대분류를 먼저 선택하세요
                    </div>
                  )}
                  {selectedL1 && l2Categories.length === 0 && (
                    <div className="p-3 text-center text-xs text-gray-400">하위 중분류 없음</div>
                  )}
                </div>
              </div>

              {/* 3열: 소분류 */}
              <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-600">
                  <span>3. 소분류</span>
                  {selectedL2 && <span className="text-[10px] text-gray-400 font-normal">{l3Categories.length}개</span>}
                </div>
                <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                  {selectedL2 ? (
                    l3Categories.map((cat) => {
                      const isSelected = selectedL3?.code === cat.code;
                      return (
                        <button
                          key={cat.code}
                          type="button"
                          disabled={isFilterOptionsLoading}
                          onClick={() => handleSelectL3(cat)}
                          className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition-colors ${
                            isSelected ? 'bg-[#EBF7F0] font-bold text-[#1E8251]' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          {isSelected && <TickCircle size={14} className="text-[#27B06E]" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex h-full items-center justify-center p-3 text-center text-[11px] text-gray-400">
                      중분류를 먼저 선택하세요
                    </div>
                  )}
                  {selectedL2 && l3Categories.length === 0 && (
                    <div className="p-3 text-center text-xs text-gray-400">하위 소분류 없음</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. 보관유형 & 종합 위험등급 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-gray-100">
            {/* 보관유형 */}
            <div>
              <label className="text-xs font-bold text-gray-800 mb-2 block">
                보관유형 <span className="text-[11px] font-normal text-gray-500">(다중 선택 가능)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {storageOptions.map((opt) => {
                  const code = typeof opt === 'string' ? opt : opt.code;
                  const isChecked = draftStorageTypes.includes(code);
                  const label = typeof opt === 'string' ? STORAGE_NAMES[code] || code : opt.name || code;
                  const colorClass = STORAGE_BADGE_COLORS[code] || 'border-gray-200 bg-gray-50 text-gray-700';

                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={isFilterOptionsLoading}
                      onClick={() => toggleStorageType(code)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        isChecked ? 'border-[#27B06E] bg-[#EBF7F0] text-[#1E8251] shadow-2xs' : colorClass
                      }`}
                    >
                      {isChecked && <TickCircle size={13} className="text-[#27B06E]" />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 위험등급 */}
            <div>
              <label className="text-xs font-bold text-gray-800 mb-2 block">
                종합 위험등급 <span className="text-[11px] font-normal text-gray-500">(다중 선택 가능)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {riskOptions.map((opt) => {
                  const code = typeof opt === 'string' ? opt : opt.code;
                  const isChecked = draftRiskGrades.includes(code);
                  const normalizedCode = normalizeRiskGrade(code);
                  const label = normalizedCode
                    ? getRiskGradeLabel(normalizedCode)
                    : typeof opt === 'object' && opt.name
                      ? opt.name
                      : '위험 등급 확인 필요';
                  const colorClass =
                    RISK_BADGE_COLORS[code] ||
                    RISK_BADGE_COLOR_ALIASES[code] ||
                    'border-gray-200 bg-gray-50 text-gray-700';

                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={isFilterOptionsLoading}
                      onClick={() => toggleRiskGrade(code)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        isChecked ? 'border-[#27B06E] bg-[#EBF7F0] text-[#1E8251] shadow-2xs' : colorClass
                      }`}
                    >
                      {isChecked && <TickCircle size={13} className="text-[#27B06E]" />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. 판정 상태 (다중 선택) */}
          <div className="pt-2 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-800 mb-2 block">
              위험 판정 상태 <span className="text-[11px] font-normal text-gray-500">(다중 선택 가능)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {assessmentStatusOptions.map((opt) => {
                const code = typeof opt === 'string' ? opt : opt.code;
                const isChecked = draftAssessmentStatuses.includes(code);
                const meta = ASSESSMENT_STATUS_META[code] || {
                  label: ASSESSMENT_STATUS_LABELS[code] || '판정 상태 확인 필요',
                  color: 'border-gray-200 bg-gray-50 text-gray-700',
                };

                return (
                  <button
                    key={code}
                    type="button"
                    disabled={isFilterOptionsLoading}
                    onClick={() => toggleAssessmentStatus(code)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                      isChecked ? 'border-[#27B06E] bg-[#EBF7F0] text-[#1E8251] shadow-2xs' : meta.color
                    }`}
                  >
                    {isChecked && <TickCircle size={13} className="text-[#27B06E]" />}
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 거점 (물류센터 · 상세 판매처 · 판매처 권역) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
            {/* 물류센터 */}
            <div>
              <label htmlFor={warehouseSelectId} className="text-xs font-bold text-gray-800 mb-1.5 block">
                물류센터
              </label>
              <select
                id={warehouseSelectId}
                value={draftWarehouseCode}
                disabled={isFilterOptionsLoading}
                onChange={(e) => setDraftWarehouseCode(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-700 focus:border-[#27B06E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#27B06E]/20"
              >
                <option value="">전체 물류센터</option>
                {warehouseOptions.map((opt) => {
                  const code = typeof opt === 'string' ? opt : opt.code || opt.warehouseCode;
                  const name = typeof opt === 'string' ? opt : opt.name || opt.warehouseName || code;
                  const suffix =
                    typeof opt !== 'string' && opt.availability === 'REGISTERED_EMPTY' ? ' · 재고 없음' : '';
                  return (
                    <option key={code} value={code}>
                      {name}
                      {suffix}
                    </option>
                  );
                })}
              </select>
              {isRegisteredEmptyWarehouse && (
                <p className="mt-1 text-[11px] text-amber-700" role="status">
                  등록된 물류센터지만 현재 재고 balance가 없어 결과가 없을 수 있습니다.
                </p>
              )}
            </div>

            {/* 상세 판매처 */}
            <div>
              <label htmlFor={salesPointSelectId} className="text-xs font-bold text-gray-800 mb-1.5 block">
                상세 판매처
              </label>
              <select
                id={salesPointSelectId}
                value={draftSalesPointCode}
                disabled={isFilterOptionsLoading}
                onChange={(e) => setDraftSalesPointCode(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-700 focus:border-[#27B06E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#27B06E]/20"
              >
                <option value="">전체 판매처</option>
                {salesPointOptions.map((opt) => {
                  const code = typeof opt === 'string' ? opt : opt.code || opt.salesPointCode;
                  const name = typeof opt === 'string' ? opt : opt.name || opt.salesPointName || code;
                  return (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 판매처 권역 */}
            <div>
              <label htmlFor={regionSelectId} className="text-xs font-bold text-gray-800 mb-1.5 block">
                판매처 권역
              </label>
              <select
                id={regionSelectId}
                value={draftRegionCode}
                disabled={isFilterOptionsLoading}
                onChange={(e) => setDraftRegionCode(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-700 focus:border-[#27B06E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#27B06E]/20"
              >
                <option value="">전체 권역</option>
                {regionOptions.map((opt) => {
                  const code = typeof opt === 'string' ? opt : opt.code || opt.regionCode;
                  const name = typeof opt === 'string' ? opt : opt.name || opt.regionName || code;
                  return (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* 모달 푸터 액션 바 */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-3.5 rounded-b-2xl">
          <button
            type="button"
            onClick={handleResetDraft}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          >
            <Refresh size={14} />
            <span>조건 초기화</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#27B06E] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#20945C] focus:outline-none focus:ring-2 focus:ring-[#27B06E]/40 transition-colors"
            >
              <span>필터 적용하기</span>
              {activeCount > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InventoryFilterModal({
  open,
  filters,
  filterOptions,
  isFilterOptionsLoading = false,
  onClose,
  onApply,
}) {
  if (!open) return null;

  return (
    <InventoryFilterModalContent
      key={filterOptions ? 'ready' : 'loading'}
      filters={filters}
      filterOptions={filterOptions}
      isFilterOptionsLoading={isFilterOptionsLoading}
      onClose={onClose}
      onApply={onApply}
    />
  );
}
