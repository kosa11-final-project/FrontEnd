import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CloseCircle, TickCircle, ChevronDown, ChevronRight, Filter } from 'reicon-react';
import { STORAGE_NAMES } from '@/entities/inventory/model/inventory.js';
import { getRiskGradeLabel, normalizeRiskGrade } from '@/entities/risk/model/risk.js';

const STORAGE_BADGE_COLORS = {
  FROZEN: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  COLD: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  ROOM_TEMP: 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
};

const STORAGE_SELECTED_BADGE_COLORS = {
  FROZEN: 'border-blue-400 bg-blue-100 text-blue-800 shadow-2xs',
  COLD: 'border-indigo-400 bg-indigo-100 text-indigo-800 shadow-2xs',
  ROOM_TEMP: 'border-slate-400 bg-slate-100 text-slate-800 shadow-2xs',
};

const RISK_BADGE_COLORS = {
  GOOD: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  NORMAL: 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
  WARNING: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
  CRITICAL: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
};

const RISK_SELECTED_BADGE_COLORS = {
  GOOD: 'border-emerald-400 bg-emerald-100 text-emerald-800 shadow-2xs',
  NORMAL: 'border-gray-400 bg-gray-100 text-gray-800 shadow-2xs',
  WARNING: 'border-amber-400 bg-amber-100 text-amber-800 shadow-2xs',
  CRITICAL: 'border-rose-400 bg-rose-100 text-rose-800 shadow-2xs',
};

const SELECTED_FILTER_TONE_STYLES = {
  category: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    group: 'text-emerald-700',
    action: 'text-emerald-600 hover:text-emerald-900',
  },
  storage: {
    container: 'border-blue-200 bg-blue-50 text-blue-950',
    group: 'text-blue-700',
    action: 'text-blue-600 hover:text-blue-900',
  },
  risk: {
    container: 'border-amber-200 bg-amber-50 text-amber-950',
    group: 'text-amber-700',
    action: 'text-amber-600 hover:text-amber-900',
  },
  warehouse: {
    container: 'border-violet-200 bg-violet-50 text-violet-950',
    group: 'text-violet-700',
    action: 'text-violet-600 hover:text-violet-900',
  },
  salesPoint: {
    container: 'border-slate-200 bg-slate-50 text-slate-950',
    group: 'text-slate-700',
    action: 'text-slate-600 hover:text-slate-900',
  },
  shortage: {
    container: 'border-orange-200 bg-orange-50 text-orange-950',
    group: 'text-orange-700',
    action: 'text-orange-600 hover:text-orange-900',
  },
};

function toSelectionArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return value ? [String(value)] : [];
}

function getOptionCode(option, type) {
  const code = typeof option === 'string' ? option : option?.code || option?.[type] || '';
  return code == null ? '' : String(code);
}

function getOptionLabel(option, type, code) {
  if (typeof option === 'string') return option;
  return option?.name || option?.[type === 'warehouseCode' ? 'warehouseName' : 'salesPointName'] || code;
}

function FilterMultiSelect({
  label,
  placeholder,
  options,
  selectedValues,
  optionType,
  isFilterOptionsLoading,
  isOpen,
  onOpenChange,
  onToggle,
  onClear,
}) {
  const listboxRef = useRef(null);
  const normalizedOptions = options
    .map((option) => {
      const code = getOptionCode(option, optionType);
      return {
        code,
        label: getOptionLabel(option, optionType, code),
        suffix: option?.availability === 'REGISTERED_EMPTY' ? ' · 재고 없음' : '',
      };
    })
    .filter((option) => option.code);
  const selectedOptions = normalizedOptions.filter((option) => selectedValues.includes(option.code));
  const triggerLabel =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : selectedOptions.map((option) => option.label).join(', ');

  useEffect(() => {
    if (!isOpen) return undefined;

    const timerId = window.setTimeout(() => {
      listboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`${label} 선택`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isFilterOptionsLoading}
        onClick={() => onOpenChange(isOpen ? null : label)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-left text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-white focus:border-[var(--primary)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={`min-w-0 truncate ${selectedOptions.length ? 'text-gray-800' : 'text-gray-500'}`}>
          {triggerLabel}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          aria-label={`${label} 목록`}
          aria-multiselectable="true"
          className="absolute inset-x-0 top-full bottom-auto z-20 mt-1 max-h-56 origin-top overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          <button
            type="button"
            role="option"
            aria-selected={selectedValues.length === 0}
            onClick={onClear}
            className="flex min-h-9 w-full items-center rounded-md px-2.5 py-2 text-left text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
          >
            전체 {label}
          </button>
          {normalizedOptions.map((option) => {
            const isSelected = selectedValues.includes(option.code);
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onToggle(option.code)}
                className={`flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                  isSelected ? 'bg-[#EBF7F0] text-[#1E8251]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-4 shrink-0 place-items-center rounded border ${
                    isSelected ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && <TickCircle size={12} />}
                </span>
                <span className="min-w-0 truncate">
                  {option.label}
                  {option.suffix}
                </span>
              </button>
            );
          })}
          {normalizedOptions.length === 0 && (
            <div className="px-2.5 py-3 text-center text-xs text-gray-400">선택 가능한 항목 없음</div>
          )}
        </div>
      )}
    </div>
  );
}

function InventoryFilterModalContent({ filters, filterOptions, isFilterOptionsLoading, onClose, onApply }) {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const closeButtonRef = useRef(null);

  const categories = filterOptions?.categories;
  const allCategories = useMemo(() => categories || [], [categories]);
  const categoryByCode = useMemo(
    () => new Map(allCategories.map((category) => [String(category.code), category])),
    [allCategories],
  );
  const storageOptions = filterOptions?.storageTypes || [];
  const riskOptions = useMemo(() => {
    const options = filterOptions?.riskGrades || [];
    const order = ['GOOD', 'NORMAL', 'WARNING', 'CRITICAL'];
    return [...options].sort((a, b) => {
      const codeA = normalizeRiskGrade(typeof a === 'string' ? a : a?.code) || '';
      const codeB = normalizeRiskGrade(typeof b === 'string' ? b : b?.code) || '';
      const indexA = order.indexOf(codeA);
      const indexB = order.indexOf(codeB);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [filterOptions?.riskGrades]);
  const warehouseOptions = useMemo(
    () => (filterOptions?.warehouses || []).filter((w) => w.availability !== 'REGISTERED_EMPTY'),
    [filterOptions?.warehouses],
  );
  const salesPointOptions = filterOptions?.salesPoints || [];
  const initialCategoryIds = useMemo(
    () => (Array.isArray(filters.categoryIds) ? filters.categoryIds : filters.categoryId ? [filters.categoryId] : []),
    [filters.categoryIds, filters.categoryId],
  );
  const initialWarehouseCodes = useMemo(() => toSelectionArray(filters.warehouseCode), [filters.warehouseCode]);
  const initialSalesPointCodes = useMemo(() => toSelectionArray(filters.salesPointCode), [filters.salesPointCode]);

  // 카테고리 역추적 초기 상태 계산: 첫 선택 항목을 현재 탐색 경로로 사용합니다.
  const initialCategoryHierarchy = useMemo(() => {
    const initialCategoryId = initialCategoryIds[0];
    if (initialCategoryId && allCategories.length > 0) {
      const targetCat = allCategories.find((c) => String(c.code) === String(initialCategoryId));
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
  }, [initialCategoryIds, allCategories]);

  // 모달 내부 로컬 드래프트 상태 (마운트 시 초기화)
  const [draftCategoryIds, setDraftCategoryIds] = useState(initialCategoryIds.map(String));
  const [draftStorageTypes, setDraftStorageTypes] = useState(
    Array.isArray(filters.storageType) ? filters.storageType : filters.storageType ? [filters.storageType] : [],
  );
  const [draftRiskGrades, setDraftRiskGrades] = useState(
    Array.isArray(filters.riskGrade) ? filters.riskGrade : filters.riskGrade ? [filters.riskGrade] : [],
  );
  const [draftWarehouseCodes, setDraftWarehouseCodes] = useState(initialWarehouseCodes);
  const [draftSalesPointCodes, setDraftSalesPointCodes] = useState(initialSalesPointCodes);
  const [draftShortageYn, setDraftShortageYn] = useState(filters.shortageYn === 'Y' ? 'Y' : '');
  const [openMultiSelect, setOpenMultiSelect] = useState(null);

  // 카테고리 계층 선택 탐색 상태
  const [selectedL1, setSelectedL1] = useState(initialCategoryHierarchy.l1);
  const [selectedL2, setSelectedL2] = useState(initialCategoryHierarchy.l2);
  const [selectedL3, setSelectedL3] = useState(initialCategoryHierarchy.l3);

  const shortageFilterId = useId();

  const selectedWarehouseOptions = warehouseOptions.filter((option) =>
    draftWarehouseCodes.includes(getOptionCode(option, 'warehouseCode')),
  );
  const isRegisteredEmptyWarehouse = selectedWarehouseOptions.some(
    (option) => typeof option !== 'string' && option.availability === 'REGISTERED_EMPTY',
  );

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

  const hasCategoryParent = (category) => category?.parentCode != null && String(category.parentCode).trim() !== '';

  const isCategoryDescendant = (candidateCode, ancestorCode) => {
    let current = categoryByCode.get(String(candidateCode));
    const visited = new Set();

    while (current?.parentCode) {
      const parentCode = String(current.parentCode);
      if (parentCode === String(ancestorCode)) return true;
      if (visited.has(parentCode)) break;
      visited.add(parentCode);
      current = categoryByCode.get(parentCode);
    }

    return false;
  };

  // 카테고리 선택 핸들러. 같은 부모 아래에서는 하나만 유지하고, 다른 루트는 추가할 수 있습니다.
  const toggleCategory = (code, ancestorCodes = [], { clearSelectedBranch = false } = {}) => {
    const normalizedCode = String(code);
    const normalizedAncestors = new Set(ancestorCodes.filter(Boolean).map(String));
    const targetCategory = categoryByCode.get(normalizedCode);
    const hasSelectedDescendant = (selectedCode) => isCategoryDescendant(selectedCode, normalizedCode);
    const shouldRemoveBranch = (selectedCode, branchCode) =>
      selectedCode === branchCode || isCategoryDescendant(selectedCode, branchCode);

    setDraftCategoryIds((prev) => {
      if (prev.includes(normalizedCode) || (clearSelectedBranch && prev.some(hasSelectedDescendant))) {
        return prev.filter((item) => !shouldRemoveBranch(item, normalizedCode));
      }

      const sameParentBranchCodes = !hasCategoryParent(targetCategory)
        ? []
        : prev
            .map((item) => categoryByCode.get(item))
            .filter(
              (category) =>
                hasCategoryParent(category) && String(category.parentCode) === String(targetCategory.parentCode),
            )
            .map((category) => String(category.code));
      const selectedRootCodes = !hasCategoryParent(targetCategory)
        ? prev
            .map((item) => categoryByCode.get(item))
            .filter((category) => category && !hasCategoryParent(category))
            .map((category) => String(category.code))
        : [];

      return [
        ...prev.filter((item) => {
          if (normalizedAncestors.has(item)) return false;
          if ([...normalizedAncestors].some((ancestorCode) => isCategoryDescendant(item, ancestorCode))) {
            return false;
          }
          if (selectedRootCodes.includes(item)) return false;
          return !sameParentBranchCodes.some((branchCode) => shouldRemoveBranch(item, branchCode));
        }),
        normalizedCode,
      ];
    });
  };

  const handleSelectL1 = (cat) => {
    if (selectedL1?.code === cat.code) {
      setSelectedL1(null);
      setSelectedL2(null);
      setSelectedL3(null);
    } else {
      setSelectedL1(cat);
      setSelectedL2(null);
      setSelectedL3(null);
    }
    toggleCategory(cat.code, [], { clearSelectedBranch: selectedL1?.code === cat.code });
  };

  const handleSelectL2 = (cat) => {
    if (selectedL2?.code === cat.code) {
      setSelectedL2(null);
      setSelectedL3(null);
    } else {
      setSelectedL2(cat);
      setSelectedL3(null);
    }
    toggleCategory(cat.code, [selectedL1?.code], { clearSelectedBranch: selectedL2?.code === cat.code });
  };

  const handleSelectL3 = (cat) => {
    if (selectedL3?.code === cat.code) {
      setSelectedL3(null);
    } else {
      setSelectedL3(cat);
    }
    toggleCategory(cat.code, [selectedL1?.code, selectedL2?.code], {
      clearSelectedBranch: selectedL3?.code === cat.code,
    });
  };

  // 보관유형 토글
  const toggleStorageType = (code) => {
    setDraftStorageTypes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  // 위험등급 토글
  const toggleRiskGrade = (code) => {
    setDraftRiskGrades((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  // 로컬 전체 초기화
  const handleResetDraft = () => {
    setDraftCategoryIds([]);
    setDraftStorageTypes([]);
    setDraftRiskGrades([]);
    setDraftWarehouseCodes([]);
    setDraftSalesPointCodes([]);
    setDraftShortageYn('');
    setSelectedL1(null);
    setSelectedL2(null);
    setSelectedL3(null);
    setOpenMultiSelect(null);
  };

  // 필터 적용 실행
  const handleApply = () => {
    // URL을 유일한 조회 상태 저장소로 사용하고 부모에 한 번만 방출합니다.
    onApply({
      categoryId: draftCategoryIds[0] || '',
      categoryIds: draftCategoryIds,
      storageType: draftStorageTypes,
      riskGrade: draftRiskGrades,
      warehouseCode: draftWarehouseCodes,
      salesPointCode: draftSalesPointCodes,
      shortageYn: draftShortageYn,
    });
    onClose();
  };

  // 활성 조건 수 계산
  const activeCount =
    draftCategoryIds.length +
    draftStorageTypes.length +
    draftRiskGrades.length +
    draftWarehouseCodes.length +
    draftSalesPointCodes.length +
    (draftShortageYn ? 1 : 0);

  const selectedCategoryPaths = draftCategoryIds.map((categoryId) => {
    const target = allCategories.find((category) => String(category.code) === String(categoryId));
    if (!target) return { id: categoryId, label: `카테고리 (${categoryId})` };

    const path = [target.name];
    let current = target;
    const visited = new Set([String(target.code)]);
    while (current?.parentCode) {
      const parentCode = String(current.parentCode);
      if (visited.has(parentCode)) break;
      const parent = allCategories.find((category) => String(category.code) === parentCode);
      if (!parent) break;
      path.unshift(parent.name);
      visited.add(parentCode);
      current = parent;
    }
    return { id: categoryId, label: path.join(' › ') };
  });

  const selectedFilterEntries = [
    ...selectedCategoryPaths.map(({ id, label }) => ({
      key: `category-${id}`,
      label,
      group: '카테고리',
      tone: 'category',
      onRemove: () => toggleCategory(id),
    })),
    ...draftStorageTypes.map((code) => ({
      key: `storage-${code}`,
      label: STORAGE_NAMES[code] || code,
      group: '보관',
      tone: 'storage',
      onRemove: () => toggleStorageType(code),
    })),
    ...draftRiskGrades.map((code) => ({
      key: `risk-${code}`,
      label: getRiskGradeLabel(normalizeRiskGrade(code)) || code,
      group: '위험',
      tone: 'risk',
      onRemove: () => toggleRiskGrade(code),
    })),
    ...draftWarehouseCodes.map((code) => ({
      key: `warehouse-${code}`,
      label: getOptionLabel(
        warehouseOptions.find((option) => getOptionCode(option, 'warehouseCode') === code),
        'warehouseCode',
        code,
      ),
      group: '물류센터(미할당 재고)',
      tone: 'warehouse',
      onRemove: () => setDraftWarehouseCodes((prev) => prev.filter((value) => value !== code)),
    })),
    ...draftSalesPointCodes.map((code) => ({
      key: `sales-point-${code}`,
      label: getOptionLabel(
        salesPointOptions.find((option) => getOptionCode(option, 'salesPointCode') === code),
        'salesPointCode',
        code,
      ),
      group: '판매처',
      tone: 'salesPoint',
      onRemove: () => setDraftSalesPointCodes((prev) => prev.filter((value) => value !== code)),
    })),
    ...(draftShortageYn
      ? [
          {
            key: 'shortage-Y',
            label: '재고 부족 상품 포함',
            group: '재고',
            tone: 'shortage',
            onRemove: () => setDraftShortageYn(''),
          },
        ]
      : []),
  ];

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
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="필터 설정 닫기"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <CloseCircle size={20} />
            </button>
          </div>
        </div>

        {isFilterOptionsLoading && (
          <div className="border-b border-blue-100 bg-blue-50 px-6 py-2 text-xs text-blue-800" role="status">
            필터 기준정보를 불러오는 중입니다. 잠시만 기다려 주세요.
          </div>
        )}

        {/* 모달 바디 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* 1. 카테고리 3단계 계층 브라우저 */}
          <div>
            <div className="mb-2">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <span>카테고리 계층 선택</span>
                <span className="text-[11px] font-normal text-gray-500">(대분류 › 중분류 › 소분류)</span>
              </label>
            </div>

            {/* 카테고리·보관·위험·센터·판매처를 하나로 모은 선택 필터 요약 */}
            {selectedFilterEntries.length > 0 ? (
              <div className="mb-2.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-xs">
                <div className="mb-1.5 flex items-center justify-between font-medium text-emerald-900">
                  <span className="font-bold text-[#1E8251]">선택된 필터</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {selectedFilterEntries.length}개 선택
                    </span>
                    <button
                      type="button"
                      onClick={handleResetDraft}
                      className="text-[10px] font-semibold text-rose-600 transition-colors hover:text-rose-700 hover:underline"
                      aria-label="선택된 필터 일괄 해제"
                    >
                      전체 해제
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFilterEntries.map(({ key, group, label, tone, onRemove }) => {
                    const toneStyle = SELECTED_FILTER_TONE_STYLES[tone] || SELECTED_FILTER_TONE_STYLES.category;
                    return (
                      <span
                        key={key}
                        className={`inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 font-medium ${toneStyle.container}`}
                      >
                        <span className={`shrink-0 text-[10px] font-bold ${toneStyle.group}`}>{group}:</span>
                        <span className="truncate">{label}</span>
                        <button
                          type="button"
                          onClick={onRemove}
                          className={`shrink-0 ${toneStyle.action}`}
                          aria-label={`${label}${group === '카테고리' ? ' 선택 해제' : ' 필터 해제'}`}
                        >
                          <CloseCircle size={13} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-2.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-500">
                필터를 선택하면 이곳에 모두 함께 표시됩니다.
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
                    const isChecked = draftCategoryIds.includes(String(cat.code));
                    return (
                      <button
                        key={cat.code}
                        type="button"
                        disabled={isFilterOptionsLoading}
                        onClick={() => handleSelectL1(cat)}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition-colors ${
                          isSelected || isChecked
                            ? 'bg-[#EBF7F0] font-bold text-[#1E8251]'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {isChecked ? (
                          <TickCircle size={14} className="text-[var(--primary)]" />
                        ) : (
                          <ChevronRight size={12} className={isSelected ? 'text-[var(--primary)]' : 'text-gray-300'} />
                        )}
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
                      const isChecked = draftCategoryIds.includes(String(cat.code));
                      return (
                        <button
                          key={cat.code}
                          type="button"
                          disabled={isFilterOptionsLoading}
                          onClick={() => handleSelectL2(cat)}
                          className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition-colors ${
                            isSelected || isChecked
                              ? 'bg-[#EBF7F0] font-bold text-[#1E8251]'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          {isChecked ? (
                            <TickCircle size={14} className="text-[var(--primary)]" />
                          ) : (
                            <ChevronRight
                              size={12}
                              className={isSelected ? 'text-[var(--primary)]' : 'text-gray-300'}
                            />
                          )}
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
                      const isSelected = draftCategoryIds.includes(String(cat.code));
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
                          {isSelected && <TickCircle size={14} className="text-[var(--primary)]" />}
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
          <div className="grid grid-cols-1 gap-5 border-t border-gray-100 pt-2 sm:grid-cols-[max-content_minmax(0,1fr)_max-content]">
            {/* 보관유형 */}
            <div>
              <label className="mb-2 block whitespace-nowrap text-xs font-bold text-gray-800">
                보관유형 <span className="text-[11px] font-normal text-gray-500">(복수 선택 가능)</span>
              </label>
              <div className="flex flex-nowrap gap-2 overflow-x-auto">
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
                      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        isChecked ? STORAGE_SELECTED_BADGE_COLORS[code] || colorClass : colorClass
                      }`}
                    >
                      {isChecked && <TickCircle size={13} className="text-current" />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 위험등급 */}
            <div>
              <label className="mb-2 block whitespace-nowrap text-xs font-bold text-gray-800">
                종합 위험등급 <span className="text-[11px] font-normal text-gray-500">(복수 선택 가능)</span>
              </label>
              <div className="flex flex-nowrap gap-2 overflow-x-auto">
                {riskOptions.map((opt) => {
                  const code = typeof opt === 'string' ? opt : opt.code;
                  const isChecked = draftRiskGrades.includes(code);
                  const normalizedCode = normalizeRiskGrade(code);
                  const label = normalizedCode
                    ? getRiskGradeLabel(normalizedCode)
                    : typeof opt === 'object' && opt.name
                      ? opt.name === '관찰'
                        ? '보통'
                        : opt.name
                      : '위험 등급 확인 필요';
                  const colorClass =
                    RISK_BADGE_COLORS[normalizedCode] ||
                    RISK_BADGE_COLORS[code] ||
                    'border-gray-200 bg-gray-50 text-gray-700';

                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={isFilterOptionsLoading}
                      onClick={() => toggleRiskGrade(code)}
                      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        isChecked ? RISK_SELECTED_BADGE_COLORS[normalizedCode] || colorClass : colorClass
                      }`}
                    >
                      {isChecked && <TickCircle size={13} className="text-current" />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 재고 부족 상품 포함 여부 */}
            <div className="flex items-end">
              <label htmlFor={shortageFilterId} className="inline-flex cursor-pointer items-center gap-2">
                <input
                  id={shortageFilterId}
                  type="checkbox"
                  aria-label="재고 부족 상품 포함여부"
                  checked={draftShortageYn === 'Y'}
                  disabled={isFilterOptionsLoading}
                  onChange={(event) => setDraftShortageYn(event.target.checked ? 'Y' : '')}
                  className="size-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="whitespace-nowrap text-[11px] font-semibold text-gray-700">
                  재고 부족 상품 포함여부
                </span>
              </label>
            </div>
          </div>

          {/* 3. 거점 (물류센터 · 상세 판매처) */}
          <div className="grid grid-cols-1 gap-4 pt-2 border-t border-gray-100 sm:grid-cols-2">
            {/* 물류센터 */}
            <div>
              <label className="text-xs font-bold text-gray-800 mb-1.5 block">물류센터(미할당 재고)</label>
              <FilterMultiSelect
                label="물류센터(미할당 재고)"
                placeholder="전체 물류센터"
                options={warehouseOptions}
                optionType="warehouseCode"
                selectedValues={draftWarehouseCodes}
                isFilterOptionsLoading={isFilterOptionsLoading}
                isOpen={openMultiSelect === '물류센터(미할당 재고)'}
                onOpenChange={setOpenMultiSelect}
                onToggle={(code) =>
                  setDraftWarehouseCodes((prev) =>
                    prev.includes(code) ? prev.filter((value) => value !== code) : [...prev, code],
                  )
                }
                onClear={() => setDraftWarehouseCodes([])}
              />
              {isRegisteredEmptyWarehouse && (
                <p className="mt-1 text-[11px] text-amber-700" role="status">
                  선택한 물류센터 중 현재 재고 balance가 없는 센터가 있어 결과가 없을 수 있습니다.
                </p>
              )}
            </div>

            {/* 상세 판매처 */}
            <div>
              <label className="text-xs font-bold text-gray-800 mb-1.5 block">상세 판매처</label>
              <FilterMultiSelect
                label="상세 판매처"
                placeholder="전체 판매처"
                options={salesPointOptions}
                optionType="salesPointCode"
                selectedValues={draftSalesPointCodes}
                isFilterOptionsLoading={isFilterOptionsLoading}
                isOpen={openMultiSelect === '상세 판매처'}
                onOpenChange={setOpenMultiSelect}
                onToggle={(code) =>
                  setDraftSalesPointCodes((prev) =>
                    prev.includes(code) ? prev.filter((value) => value !== code) : [...prev, code],
                  )
                }
                onClear={() => setDraftSalesPointCodes([])}
              />
            </div>
          </div>
        </div>

        {/* 모달 푸터 액션 바 */}
        <div className="flex items-center justify-end border-t border-gray-100 bg-gray-50 px-6 py-3.5 rounded-b-2xl">
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-colors"
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
