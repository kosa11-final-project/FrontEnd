import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  inventoryFilterOptionsQueryOptions,
  inventoryListQueryOptions,
  inventorySummaryQueryOptions,
  RESULT_STATE,
} from '@/entities/inventory';
import {
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

export default function InventoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSkuItems, setSelectedSkuItems] = useState([]);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const selectedSkuCodes = useMemo(() => selectedSkuItems.map((item) => item.skuCode), [selectedSkuItems]);

  // 1. URL searchParams로부터 필터 상태 파싱 (SSOT)
  const filters = useMemo(() => parseInventoryFilters(searchParams), [searchParams]);
  const queryParams = useMemo(() => toInventoryQueryParams(filters), [filters]);

  // 2. TanStack Query로 목록 데이터 조회
  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
    isFetching: isListFetching,
    refetch: refetchList,
  } = useQuery(inventoryListQueryOptions(queryParams));

  // 3. TanStack Query로 상단 KPI 요약 조회
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useQuery(inventorySummaryQueryOptions(queryParams));

  // 채널·센터·보관유형 등 기준정보는 별도 캐시로 조회해 필터 UI에 연결합니다.
  const {
    data: filterOptions,
    isLoading: isFilterOptionsLoading,
    isError: isFilterOptionsError,
    refetch: refetchFilterOptions,
  } = useQuery(inventoryFilterOptionsQueryOptions());

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

  const handleStrategyCreated = useCallback(() => {
    setIsStrategyModalOpen(false);
    setSelectedSkuItems([]);
    navigate('/ai-strategy');
  }, [navigate]);

  return (
    <div className="flex flex-col gap-6">
      {/* 상단: 프리미엄 대시보드 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">통합 재고 관제</h1>
            {isListFetching && !isListLoading ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700"
                aria-live="polite"
              >
                <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />
                업데이트 중...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B7ECCF] bg-[#DAF7E9] px-2.5 py-0.5 text-xs font-semibold text-[#1E8251]">
                <span className="size-1.5 rounded-full bg-[#27B06E]" />
                현재 DB 기준
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-gray-500">
            통합 판매채널과 물류센터에 적재된 현재 재고 현황과 위험도를 관제합니다.
          </p>
        </div>

        <InventorySyncControl />
      </div>

      {/* 1. 상단 KPI 요약 카드 바 */}
      <InventorySummaryBar
        summary={summaryData}
        isLoading={isSummaryLoading}
        isError={isSummaryError}
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
        page={listData?.page || filters.page}
        size={listData?.size || filters.size}
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
        onRetry={refetchList}
        onPageChange={handlePageChange}
        onSizeChange={handleSizeChange}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
        onRowClick={handleRowClick}
      />

      {isStrategyModalOpen ? (
        <StrategyRequestModal
          selectedItems={selectedSkuItems}
          onClose={() => setIsStrategyModalOpen(false)}
          onCreated={handleStrategyCreated}
        />
      ) : null}

      {/* 4. 우측 상세 관제 드로어 */}
      <InventoryDetailDrawer
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
