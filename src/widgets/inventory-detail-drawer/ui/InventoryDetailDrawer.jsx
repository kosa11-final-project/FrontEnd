import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Danger, Refresh } from 'reicon-react';
import { inventoryDetailQueryOptions, inventoryLotsQueryOptions } from '@/entities/inventory';
import { InventoryDetailHeader } from './InventoryDetailHeader.jsx';
import { InventoryDetailKpiRibbon } from './InventoryDetailKpiRibbon.jsx';
import { InventoryStorageLocationSection } from './InventoryStorageLocationSection.jsx';
import { InventorySalesPointsSection } from './InventorySalesPointsSection.jsx';
import { InventoryLotsSection } from './InventoryLotsSection.jsx';

export function InventoryDetailDrawer({
  item: initialItem,
  open,
  activeTab = 'OVERVIEW',
  selectedSalesPointCode = '',
  onSalesPointChange,
  onTabChange,
  onClose,
}) {
  const drawerRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [copiedSku, setCopiedSku] = useState(false);

  const skuCode = initialItem?.skuCode || '';
  const allSalesPoints = initialItem?.salesPoints?.length ? initialItem.salesPoints : [];

  // 1. 판매처 상세 헤더 쿼리: 판매처가 명시적으로 선택되었을 때만 호출
  const detailQuery = useQuery({
    ...inventoryDetailQueryOptions(skuCode, selectedSalesPointCode),
    enabled: Boolean(open && skuCode && selectedSalesPointCode),
  });

  // 2. LOT 쿼리: 데스크톱에서는 개요 탭에서도 우측 LOT 패널이 노출되므로
  // 판매처가 선택되면 조회합니다. 모바일에서는 탭이 전환되기 전까지 패널이
  // 숨겨져 있지만, 같은 query key를 재사용하므로 탭 전환 시 즉시 표시됩니다.
  const activeSalesPointForLots = selectedSalesPointCode;
  const lotsQuery = useQuery({
    ...inventoryLotsQueryOptions(skuCode, activeSalesPointForLots),
    enabled: Boolean(open && skuCode && activeSalesPointForLots),
  });

  // 선택된 판매처 객체
  const selectedSalesPoint =
    allSalesPoints.find((point) => point.salesPointCode === selectedSalesPointCode) || detailQuery.data || null;

  // 전체 요약 vs 선택 판매처 상세 융합
  const item = selectedSalesPointCode
    ? {
        ...initialItem,
        ...(selectedSalesPoint || {}),
        ...(detailQuery.data || {}),
      }
    : initialItem || detailQuery.data;

  const locations = initialItem?.locations?.length
    ? initialItem.locations
    : detailQuery.data?.locations?.length
      ? detailQuery.data.locations
      : [];
  // 상세 API는 선택된 판매처 하나만 반환하므로 전체 소유 판매처 수는
  // 목록의 SKU 집계값을 우선 사용합니다.
  const ownerSalesPointCount =
    initialItem?.ownerSalesPointCount ??
    (allSalesPoints.length > 0 ? allSalesPoints.length : (item?.ownerSalesPointCount ?? 0));

  const selectedSalesPointWarehouseName =
    selectedSalesPoint?.warehouseName || detailQuery.data?.locations?.[0]?.warehouseName || '';
  const selectedSalesPointWarehouseCode =
    selectedSalesPoint?.warehouseCode || detailQuery.data?.locations?.[0]?.warehouseCode || '';

  const skuTotalStockQty =
    initialItem?.currentQuantity != null
      ? Number(initialItem.currentQuantity)
      : locations.reduce((sum, loc) => sum + (Number(loc.quantity) || 0), 0);

  // ESC 키로 닫기, Body Scroll Lock, Focus Trap 및 닫기 후 포커스 복원
  useEffect(() => {
    if (!open) return undefined;

    previousActiveElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
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
  }, [open, onClose]);

  if (!open || !item) return null;

  const currentTab = activeTab === 'LOTS' ? 'LOTS' : 'OVERVIEW';

  const handleCopySku = () => {
    if (!item.skuCode) return;
    navigator.clipboard?.writeText(item.skuCode);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleSelectSalesPoint = (spCode) => {
    onSalesPointChange?.(spCode);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <aside
        ref={drawerRef}
        className="flex h-full w-full md:w-[82vw] lg:w-[72vw] xl:w-[65vw] min-w-[360px] max-w-[1040px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-product-title"
      >
        {/* 1. 슬림 일체형 와이드 헤더 */}
        <InventoryDetailHeader
          item={item}
          allSalesPoints={allSalesPoints}
          selectedSalesPointCode={selectedSalesPointCode}
          copiedSku={copiedSku}
          closeButtonRef={closeButtonRef}
          onCopySku={handleCopySku}
          onSelectSalesPoint={handleSelectSalesPoint}
          onClose={onClose}
        />

        {/* 판매처 상세 API 에러 알림 */}
        {detailQuery.isError && selectedSalesPointCode && (
          <div className="flex items-center justify-between border-b border-rose-200 bg-rose-50 px-6 py-2 text-xs text-rose-800 shrink-0">
            <div className="flex items-center gap-1.5 font-medium">
              <Danger size={14} className="text-rose-600 shrink-0" />
              <span>선택한 판매처의 상세 재고 정보를 불러오는 중 오류가 발생했습니다.</span>
            </div>
            <button
              type="button"
              onClick={() => detailQuery.refetch()}
              className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white px-2 py-0.5 font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
            >
              <Refresh size={11} />
              다시 시도
            </button>
          </div>
        )}

        {/* 2. 4대 핵심 KPI 메트릭 리본 */}
        <InventoryDetailKpiRibbon item={item} />

        {/* 3. 모바일/태블릿용 탭 바 */}
        <nav className="flex lg:hidden border-b border-gray-200 bg-white px-6 shrink-0" aria-label="상세 탭">
          <button
            type="button"
            onClick={() => onTabChange?.('OVERVIEW')}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              currentTab === 'OVERVIEW'
                ? 'border-[var(--primary)] text-[color:var(--primary)]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            재고 개요
          </button>
          <button
            type="button"
            onClick={() => onTabChange?.('LOTS')}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              currentTab === 'LOTS'
                ? 'border-[var(--primary)] text-[color:var(--primary)]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            LOT 상세 (FEFO)
          </button>
        </nav>

        {/* 4. 스크롤 없는 2분할 마스터-디테일 워크스페이스 */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white">
          {/* 좌측 패널 (45%): 거점 물류센터 + 판매처 분산 리스트 */}
          <div
            className={`lg:col-span-5 flex flex-col border-r border-gray-200 bg-white overflow-y-auto ${
              currentTab === 'LOTS' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* A. 보관 물류센터 현황 */}
            <InventoryStorageLocationSection
              locations={locations}
              skuTotalStockQty={skuTotalStockQty}
              selectedSalesPointCode={selectedSalesPointCode}
              selectedSalesPointWarehouseCode={selectedSalesPointWarehouseCode}
              selectedSalesPointWarehouseName={selectedSalesPointWarehouseName}
              selectedSalesPointName={selectedSalesPoint?.salesPointName}
            />

            {/* B. 판매처별 재고 분산 및 선택 리스트 */}
            <InventorySalesPointsSection
              allSalesPoints={allSalesPoints}
              ownerSalesPointCount={ownerSalesPointCount}
              selectedSalesPointCode={selectedSalesPointCode}
              onSelectSalesPoint={handleSelectSalesPoint}
            />
          </div>

          {/* 우측 패널 (55%): 선택 판매처의 실시간 LOT 및 FEFO 출고 우선순위 */}
          <div
            className={`lg:col-span-7 flex flex-col bg-[#F9FAFB] overflow-y-auto ${
              currentTab === 'OVERVIEW' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <InventoryLotsSection
              selectedSalesPoint={selectedSalesPoint}
              selectedSalesPointCode={selectedSalesPointCode}
              lotsQuery={lotsQuery}
              onNavigateToOverview={() => onTabChange?.('OVERVIEW')}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
