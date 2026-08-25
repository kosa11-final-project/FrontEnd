import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  inventoryFilterOptionsQueryOptions,
  inventoryListQueryOptions,
  inventorySummaryQueryOptions,
  RESULT_STATE,
} from '@/entities/inventory';
import {
  DEFAULT_INVENTORY_FILTERS,
  applyFilterChanges,
  parseInventoryFilters,
  serializeInventoryFilters,
  toInventoryQueryParams,
} from '@/features/inventory-filter';
import { InventoryFilterBar } from '@/features/inventory-filter';
import { InventorySyncControl } from '@/features/inventory-sync';
import { InventorySummaryBar } from '@/widgets/inventory-summary';
import { InventoryTable } from '@/widgets/inventory-table';
import { InventoryDetailDrawer } from '@/widgets/inventory-detail-drawer';
import { StrategyRequestModal } from '@/widgets/strategy-request-modal';

const FILTER_QUERY_KEYS_TO_RESET_ON_ENTRY = Object.freeze([
  'q',
  'filterOperator',
  'channelType',
  'salesPointCode',
  'warehouseCode',
  'regionCode',
  'categoryId',
  'categoryIds',
  'storageType',
  'riskGrade',
  'assessmentStatus',
  'shortageYn',
]);

const hasPersistedFilterQuery = (searchParams) =>
  FILTER_QUERY_KEYS_TO_RESET_ON_ENTRY.some((key) => searchParams.has(key));

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shouldResetFilterQueryOnEntry] = useState(() => hasPersistedFilterQuery(searchParams));
  const [selectedSkuItems, setSelectedSkuItems] = useState([]);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const selectedSkuCodes = useMemo(() => selectedSkuItems.map((item) => item.skuCode), [selectedSkuItems]);

  // 페이지에 다시 진입하거나 새로고침하면 이전 필터 query를 제거하고 기본 조건으로 시작합니다.
  // 상세 드로어·페이지 크기·정렬 같은 화면 문맥은 유지하되, 검색/선택 필터만 초기화합니다.
  useEffect(() => {
    if (!shouldResetFilterQueryOnEntry) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    FILTER_QUERY_KEYS_TO_RESET_ON_ENTRY.forEach((key) => nextSearchParams.delete(key));

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, shouldResetFilterQueryOnEntry]);

  // 1. URL searchParams로부터 필터 상태 파싱 (SSOT)
  const isResettingFilterQuery = shouldResetFilterQueryOnEntry && hasPersistedFilterQuery(searchParams);
  const filters = useMemo(
    () => (isResettingFilterQuery ? DEFAULT_INVENTORY_FILTERS : parseInventoryFilters(searchParams)),
    [isResettingFilterQuery, searchParams],
  );
  const queryParams = useMemo(() => toInventoryQueryParams(filters), [filters]);

  // 2. TanStack Query로 목록 데이터 조회
  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
    refetch: refetchList,
  } = useQuery(inventoryListQueryOptions(queryParams));

  // 3. TanStack Query로 상단 KPI 요약 조회
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery(inventorySummaryQueryOptions(queryParams));

  // 채널·센터·보관유형 등 기준정보는 별도 캐시로 조회해 필터 UI에 연결합니다.
  const {
    data: filterOptions,
    isLoading: isFilterOptionsLoading,
    isError: isFilterOptionsError,
    refetch: refetchFilterOptions,
  } = useQuery(inventoryFilterOptionsQueryOptions());

  // 필터 적용으로 전체 페이지 수가 줄어 현재 URL page가 범위를 벗어나면
  // 빈 목록을 그대로 보여주지 않고 마지막 유효 페이지로 보정합니다.
  useEffect(() => {
    const totalPages = listData?.totalPages;
    if (!Number.isInteger(totalPages) || totalPages < 1 || filters.page <= totalPages) return;

    const boundedPage = Math.min(filters.page, totalPages);
    setSearchParams(serializeInventoryFilters({ ...filters, page: boundedPage }), { replace: true });
  }, [filters, listData?.totalPages, setSearchParams]);

  // 필터 변경 핸들러 -> URL SearchParams 업데이트 (URL이 필터 상태의 단일 원천입니다.)
  const handleFilterChange = useCallback(
    (changes) => {
      const nextFilters = applyFilterChanges(filters, changes);
      setSearchParams(serializeInventoryFilters(nextFilters));
    },
    [filters, setSearchParams],
  );

  // 필터 초기화
  const handleResetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // 페이지 변경
  const handlePageChange = useCallback(
    (newPage) => {
      handleFilterChange({ page: newPage });
    },
    [handleFilterChange],
  );

  // 페이지 크기 변경
  const handleSizeChange = useCallback(
    (newSize) => {
      handleFilterChange({ size: newSize, page: 1 });
    },
    [handleFilterChange],
  );

  // 테이블 정렬 변경 (정렬 변경 시 1페이지로 이동)
  const handleSortChange = useCallback(
    (newSort) => {
      handleFilterChange({ sort: newSort, page: 1 });
    },
    [handleFilterChange],
  );

  // 드로어 상태 (URL 기반 SSOT)
  const isDrawerOpen = Boolean(filters.detailSkuCode);
  const selectedItem = useMemo(() => {
    if (!isDrawerOpen) return null;
    const found = listData?.items?.find((it) => it.skuCode === filters.detailSkuCode);
    return (
      found || {
        skuCode: filters.detailSkuCode,
        salesPointCode: filters.detailSalesPointCode,
        productName: '상품 상세',
      }
    );
  }, [isDrawerOpen, listData?.items, filters.detailSkuCode, filters.detailSalesPointCode]);

  // 행 클릭 시 우측 드로어 열기 (최상단 판매처 또는 미할당 재고 기본 선택)
  const handleRowClick = useCallback(
    (item) => {
      const hasUnassigned = Boolean(
        item.unassignedInventory?.hasStock ||
        item.unassignedInventory?.currentQuantity != null ||
        item.unassignedInventory?.availableQuantity != null ||
        item.unassignedInventory?.reservedQuantity != null,
      );
      const topSalesPointCode = hasUnassigned ? 'UNASSIGNED' : item.salesPoints?.[0]?.salesPointCode || '';

      handleFilterChange({
        detailSkuCode: item.skuCode,
        detailSalesPointCode: topSalesPointCode,
        detailTab: filters.detailTab || 'OVERVIEW',
      });
    },
    [filters.detailTab, handleFilterChange],
  );

  // SKU Drawer에서 판매처를 명시적으로 선택했을 때만 판매처 상세 API를 호출합니다.
  const handleSalesPointChange = useCallback(
    (salesPointCode) => {
      handleFilterChange({ detailSalesPointCode: salesPointCode });
    },
    [handleFilterChange],
  );

  // 드로어 탭 변경
  const handleDrawerTabChange = useCallback(
    (tab) => {
      handleFilterChange({ detailTab: tab });
    },
    [handleFilterChange],
  );

  // 드로어 닫기
  const handleCloseDrawer = useCallback(() => {
    handleFilterChange({
      detailSkuCode: '',
      detailSalesPointCode: '',
    });
  }, [handleFilterChange]);

  // 체크박스 다중 선택 핸들러 (최대 5개 제한)
  const handleToggleSelectSku = useCallback(
    (skuCode) => {
      setSelectedSkuItems((prev) => {
        if (prev.some((item) => item.skuCode === skuCode)) {
          return prev.filter((item) => item.skuCode !== skuCode);
        }
        if (prev.length >= 5) {
          return prev;
        }
        const item = listData?.items?.find((candidate) => candidate.skuCode === skuCode);
        return item ? [...prev, item] : prev;
      });
    },
    [listData?.items],
  );

  const handleSelectAllSkus = useCallback(
    (skuCodesToSelect) => {
      if (Array.isArray(skuCodesToSelect)) {
        const selectedCodeSet = new Set(skuCodesToSelect.slice(0, 5));
        setSelectedSkuItems((listData?.items ?? []).filter((item) => selectedCodeSet.has(item.skuCode)));
      } else {
        setSelectedSkuItems([]);
      }
    },
    [listData?.items],
  );

  const handleClearSelectedSkus = useCallback(() => {
    setSelectedSkuItems([]);
  }, []);

  const handleGenerateStrategy = useCallback(() => {
    if (!selectedSkuItems.length) return;
    setIsStrategyModalOpen(true);
  }, [selectedSkuItems.length]);

  return (
    <div className="inventory-page flex flex-col gap-4">
      <InventorySyncControl />

      {/* 1. 상단 KPI 요약 카드 바 */}
      <InventorySummaryBar
        summary={summaryData}
        isLoading={isSummaryLoading}
        isError={isSummaryError}
        error={summaryError}
        onRetry={refetchSummary}
      />

      {/* 필터 기준정보 로드 오류 안내 */}
      {isFilterOptionsError && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-800">
          <span>필터 기준정보(카테고리/물류센터 등)를 불러오지 못했습니다. 목록 데이터는 정상 표시됩니다.</span>
          <button
            type="button"
            onClick={() => refetchFilterOptions()}
            className="font-bold text-amber-900 underline hover:text-amber-700 ml-2 shrink-0"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 2. 다중 검색 및 필터바 */}
      <InventoryFilterBar
        filters={filters}
        filterOptions={filterOptions}
        isFilterOptionsLoading={isFilterOptionsLoading}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* 3. 통합 재고 테이블 */}
      <InventoryTable
        items={listData?.items || []}
        totalCount={listData?.totalCount || 0}
        // URL 필터가 단일 원천이므로 keepPreviousData 중에도 페이지네이션은
        // 새 필터의 page/size를 즉시 반영합니다.
        page={filters.page}
        size={filters.size}
        sort={filters.sort}
        totalPages={listData?.totalPages || 1}
        selectedItem={selectedItem}
        selectedSkuCodes={selectedSkuCodes}
        onToggleSelectSku={handleToggleSelectSku}
        onSelectAllSkus={handleSelectAllSkus}
        onClearSelectedSkus={handleClearSelectedSkus}
        onGenerateStrategy={handleGenerateStrategy}
        resultState={listData?.resultState || RESULT_STATE.HAS_DATA}
        isLoading={isListLoading}
        isError={isListError}
        error={listError}
        onRetry={refetchList}
        onPageChange={handlePageChange}
        onSizeChange={handleSizeChange}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
        onRowClick={handleRowClick}
      />

      {isStrategyModalOpen ? (
        <StrategyRequestModal selectedItems={selectedSkuItems} onClose={() => setIsStrategyModalOpen(false)} />
      ) : null}

      {/* 4. 우측 상세 관제 드로어 */}
      <InventoryDetailDrawer
        // 닫힘/재오픈 또는 SKU 전환은 새 상세 세션으로 취급해 내부 판매처 선택을 초기화합니다.
        key={isDrawerOpen ? filters.detailSkuCode : 'closed'}
        item={selectedItem}
        open={isDrawerOpen}
        activeTab={filters.detailTab}
        onTabChange={handleDrawerTabChange}
        selectedSalesPointCode={filters.detailSalesPointCode}
        onSalesPointChange={handleSalesPointChange}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
