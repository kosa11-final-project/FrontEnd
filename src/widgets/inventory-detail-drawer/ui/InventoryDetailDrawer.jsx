import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Danger, Refresh } from 'reicon-react';
import { inventoryDetailQueryOptions, inventoryLotsQueryOptions } from '@/entities/inventory/api/inventoryQueries.js';
import { demandForecastQueryOptions } from '@/entities/forecast/api/forecastQueries.js';
import { DemandForecastStateView } from '@/entities/forecast/ui/DemandForecastStateView.jsx';
import { DemandForecastTable } from '@/entities/forecast/ui/DemandForecastTable.jsx';

const DemandForecastChart = lazy(() =>
  import('@/entities/forecast/ui/DemandForecastChart.jsx').then((m) => ({ default: m.DemandForecastChart })),
);
import { inventoryRiskQueryOptions } from '@/entities/risk/api/riskQueries.js';
import { RiskExplanationPanel } from '@/entities/risk/ui/RiskExplanationPanel.jsx';
import { RiskAssessmentStateView } from '@/entities/risk/ui/RiskAssessmentStateView.jsx';
import { formatDate, formatQuantity } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button.jsx';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/Tabs.jsx';
import { InventoryDetailHeader } from './InventoryDetailHeader.jsx';
import { InventoryOverviewSkeleton } from './InventoryOverviewSkeleton.jsx';
import { InventorySalesPointsSection } from './InventorySalesPointsSection.jsx';
import { InventoryLotsSection } from './InventoryLotsSection.jsx';
import { CHANNEL_BADGE_LABELS, CHANNEL_BADGE_STYLES } from './constants.js';

/**
 * 재고 상세 사이드 드로어 위젯 (재고 개요 + 수요예측 2단 탭 구성)
 * @param {object} props
 * @param {import('@/entities/inventory').InventoryItem | null} props.item - 상세 조회 대상 재고 아이템
 * @param {boolean} props.open - 드로어 열림 여부
 * @param {'OVERVIEW' | 'FORECAST'} [props.activeTab='OVERVIEW'] - 활성 탭
 * @param {string} [props.selectedSalesPointCode=''] - 선택된 판매처 코드
 * @param {(salesPointCode: string) => void} [props.onSalesPointChange] - 판매처 변경 콜백
 * @param {(tab: 'OVERVIEW' | 'FORECAST') => void} [props.onTabChange] - 탭 변경 콜백
 * @param {() => void} [props.onClose] - 드로어 닫기 콜백
 */
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
  const queryClient = useQueryClient();

  const skuCode = initialItem?.skuCode || '';

  const initialLocations = initialItem?.locations?.length ? initialItem.locations : [];
  const initialUnassignedInventory = initialItem?.unassignedInventory || {
    currentQuantity: null,
    availableQuantity: null,
    reservedQuantity: null,
    locations: initialLocations,
    locationCount: initialLocations.length,
  };
  const hasInitialUnassignedInventory = Boolean(
    initialUnassignedInventory?.hasStock ||
    initialUnassignedInventory?.currentQuantity != null ||
    initialUnassignedInventory?.availableQuantity != null ||
    initialUnassignedInventory?.reservedQuantity != null,
  );

  const topOverviewSalesPointCode = useMemo(() => {
    if (hasInitialUnassignedInventory) return 'UNASSIGNED';
    return initialItem?.salesPoints?.[0]?.salesPointCode || '';
  }, [hasInitialUnassignedInventory, initialItem]);

  const topForecastSalesPointCode = useMemo(() => {
    return initialItem?.salesPoints?.[0]?.salesPointCode || '';
  }, [initialItem]);

  // 1) 재고 개요 탭 전용 판매처 선택 상태 (URL 및 부모 상태와 연동, 미지정 시 최상단 기본 선택)
  const effectiveOverviewSalesPointCode = useMemo(() => {
    if (selectedSalesPointCode && selectedSalesPointCode !== '__ALL__') return selectedSalesPointCode;
    return topOverviewSalesPointCode;
  }, [selectedSalesPointCode, topOverviewSalesPointCode]);

  // 2) 수요예측 탭 전용 판매처 선택 상태 (SKU 변경 시 자동 동기화 및 URL 상태 동기화)
  const [forecastSelection, setForecastSelection] = useState({
    skuCode: '',
    salesPointCode: '',
  });

  const currentForecastSalesPointCode =
    forecastSelection.skuCode === skuCode && forecastSelection.salesPointCode !== undefined
      ? forecastSelection.salesPointCode
      : selectedSalesPointCode;

  const setForecastSalesPointCode = (spCode) => {
    const nextCode = spCode && spCode !== '__ALL__' ? spCode : topForecastSalesPointCode;
    setForecastSelection({
      skuCode,
      salesPointCode: nextCode,
    });
    onSalesPointChange?.(nextCode);
  };

  const effectiveForecastSalesPointCode = useMemo(() => {
    if (
      currentForecastSalesPointCode &&
      currentForecastSalesPointCode !== '__ALL__' &&
      currentForecastSalesPointCode !== 'UNASSIGNED'
    ) {
      return currentForecastSalesPointCode;
    }
    return topForecastSalesPointCode;
  }, [currentForecastSalesPointCode, topForecastSalesPointCode]);

  const currentTab = activeTab === 'FORECAST' ? 'FORECAST' : 'OVERVIEW';

  // 1. 판매처 상세 헤더 쿼리: 개요 탭 기준
  const detailQuery = useQuery({
    ...inventoryDetailQueryOptions(skuCode, effectiveOverviewSalesPointCode),
    enabled: Boolean(open && skuCode && effectiveOverviewSalesPointCode),
  });

  // 2. LOT 쿼리: 개요 탭 기준
  const lotsQuery = useQuery({
    ...inventoryLotsQueryOptions(skuCode, effectiveOverviewSalesPointCode),
    enabled: Boolean(open && activeTab === 'OVERVIEW' && skuCode && effectiveOverviewSalesPointCode),
  });

  // 3) 재고 개요 탭의 서버 위험 판정: 예상 소진일수와 부족 여부를 함께 표시합니다.
  const riskQuery = useQuery({
    ...inventoryRiskQueryOptions(skuCode, effectiveOverviewSalesPointCode),
    enabled: Boolean(open && activeTab === 'OVERVIEW' && skuCode && effectiveOverviewSalesPointCode),
  });

  // 위험 판정 스냅샷과 LOT D-day가 같은 날짜를 기준으로 보이도록 판정 시각의 서울 날짜를 공유합니다.
  const riskReferenceDate = useMemo(() => {
    if (riskQuery.data?.assessedAt) {
      const formatted = formatDate(riskQuery.data.assessedAt, { fallback: '' });
      if (formatted) return formatted.replaceAll('.', '-');
    }
    return riskQuery.data?.baseDate || null;
  }, [riskQuery.data]);

  const isForecastUnassigned = effectiveForecastSalesPointCode === 'UNASSIGNED';

  // 4. 수요예측 쿼리: 수요예측 탭 독립 판매처 기준
  const forecastQuery = useQuery({
    ...demandForecastQueryOptions(skuCode, effectiveForecastSalesPointCode),
    enabled: Boolean(
      open && skuCode && effectiveForecastSalesPointCode && !isForecastUnassigned && activeTab === 'FORECAST',
    ),
  });

  const rawSalesPoints = useMemo(
    () => (initialItem?.salesPoints?.length ? initialItem.salesPoints : []),
    [initialItem],
  );

  // 드로어 진입 시 모든 판매처의 위험도를 백그라운드에서 자동 병렬 조회합니다 (개요 탭 전용).
  const salesPointRiskQueries = useQueries({
    queries:
      open && skuCode && activeTab === 'OVERVIEW'
        ? rawSalesPoints.map((sp) => ({
            ...inventoryRiskQueryOptions(skuCode, sp.salesPointCode),
            enabled: Boolean(open && activeTab === 'OVERVIEW' && skuCode && sp.salesPointCode),
            staleTime: 60 * 1000,
          }))
        : [],
  });

  const unassignedRiskQuery = useQuery({
    ...inventoryRiskQueryOptions(skuCode, 'UNASSIGNED'),
    enabled: Boolean(open && activeTab === 'OVERVIEW' && skuCode && hasInitialUnassignedInventory),
    staleTime: 60 * 1000,
  });

  // 왼쪽 판매처 카드 목록 (서버 위험 판정 결과와 실시간 동기화)
  const allSalesPoints = useMemo(() => {
    return rawSalesPoints.map((sp, index) => {
      const isCurrent = sp.salesPointCode === effectiveOverviewSalesPointCode;
      const queryData = salesPointRiskQueries[index]?.data;
      const cachedRisk =
        !isCurrent && skuCode && sp.salesPointCode
          ? queryClient.getQueryData(inventoryRiskQueryOptions(skuCode, sp.salesPointCode).queryKey)
          : null;
      const activeRiskGrade = isCurrent
        ? (riskQuery.data?.riskGrade ?? detailQuery.data?.riskGrade ?? queryData?.riskGrade)
        : (queryData?.riskGrade ?? cachedRisk?.riskGrade);
      const activeAssessmentStatus = isCurrent
        ? (riskQuery.data?.assessmentStatus ?? detailQuery.data?.assessmentStatus ?? queryData?.assessmentStatus)
        : (queryData?.assessmentStatus ?? cachedRisk?.assessmentStatus);

      if (activeRiskGrade != null || activeAssessmentStatus != null) {
        return {
          ...sp,
          riskGrade: activeRiskGrade ?? sp.riskGrade,
          assessmentStatus: activeAssessmentStatus ?? sp.assessmentStatus,
        };
      }
      return sp;
    });
  }, [
    rawSalesPoints,
    salesPointRiskQueries,
    effectiveOverviewSalesPointCode,
    riskQuery.data,
    detailQuery.data,
    skuCode,
    queryClient,
  ]);

  // 개요 탭 선택 판매처 객체
  const selectedOverviewSalesPoint =
    allSalesPoints.find((point) => point.salesPointCode === effectiveOverviewSalesPointCode) ||
    detailQuery.data ||
    null;

  // 수요예측 탭 선택 판매처 객체
  const selectedForecastSalesPoint =
    allSalesPoints.find((point) => point.salesPointCode === effectiveForecastSalesPointCode) || null;

  // 판매처를 바꾸면 세부·LOT·위험판정 쿼리가 동시에 새 키로 전환됩니다.
  // 세 섹션을 각각 먼저 렌더링하면 기존 내용이 순차적으로 사라졌다가 채워져 깜빡이므로,
  // 새 판매처의 필수 데이터가 모두 준비될 때까지 오른쪽 개요 영역을 하나의 스켈레톤으로 유지합니다.
  const isOverviewLoading =
    open && currentTab === 'OVERVIEW' && [detailQuery, lotsQuery, riskQuery].some((query) => query.isLoading);

  // 전체 요약 vs 선택 판매처 상세 융합
  const item = effectiveOverviewSalesPointCode
    ? {
        ...initialItem,
        ...(selectedOverviewSalesPoint || {}),
        ...(detailQuery.data || {}),
      }
    : initialItem || detailQuery.data;

  const locations = initialItem?.locations?.length
    ? initialItem.locations
    : detailQuery.data?.locations?.length
      ? detailQuery.data.locations
      : [];

  const isUnassignedCurrent = effectiveOverviewSalesPointCode === 'UNASSIGNED';
  const unassignedRiskGrade = isUnassignedCurrent
    ? (riskQuery.data?.riskGrade ?? detailQuery.data?.riskGrade ?? unassignedRiskQuery.data?.riskGrade)
    : (unassignedRiskQuery.data?.riskGrade ??
      queryClient.getQueryData(inventoryRiskQueryOptions(skuCode, 'UNASSIGNED').queryKey)?.riskGrade);
  const unassignedAssessmentStatus = isUnassignedCurrent
    ? (riskQuery.data?.assessmentStatus ??
      detailQuery.data?.assessmentStatus ??
      unassignedRiskQuery.data?.assessmentStatus)
    : (unassignedRiskQuery.data?.assessmentStatus ??
      queryClient.getQueryData(inventoryRiskQueryOptions(skuCode, 'UNASSIGNED').queryKey)?.assessmentStatus);

  const baseUnassigned = item?.unassignedInventory ||
    initialItem?.unassignedInventory || {
      currentQuantity: null,
      availableQuantity: null,
      reservedQuantity: null,
      locations,
      locationCount: locations.length,
    };
  const unassignedInventory =
    unassignedRiskGrade != null || unassignedAssessmentStatus != null
      ? {
          ...baseUnassigned,
          riskGrade: unassignedRiskGrade ?? baseUnassigned.riskGrade,
          assessmentStatus: unassignedAssessmentStatus ?? baseUnassigned.assessmentStatus,
        }
      : baseUnassigned;
  const ownerSalesPointCount =
    initialItem?.ownerSalesPointCount ??
    (allSalesPoints.length > 0 ? allSalesPoints.length : (item?.ownerSalesPointCount ?? 0));

  // ESC 키로 닫기, Body Scroll Lock, Focus Trap 및 닫기 후 포커스 복원
  useEffect(() => {
    if (!open) return undefined;

    previousActiveElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      const currentPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  const handleCopySku = () => {
    if (!item.skuCode) return;
    navigator.clipboard?.writeText(item.skuCode);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleSelectSalesPoint = (spCode) => {
    const nextCode = spCode && spCode !== '__ALL__' ? spCode : topOverviewSalesPointCode;
    setForecastSelection({
      skuCode,
      salesPointCode: nextCode,
    });
    onSalesPointChange?.(nextCode);
  };

  return (
    <div
      className="inventory-detail-drawer-overlay fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <aside
        ref={drawerRef}
        className="inventory-detail-drawer-panel flex h-full w-full min-w-0 max-w-[1120px] flex-col bg-white shadow-2xl md:w-[85vw] lg:w-[78vw] xl:w-[70vw]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-product-title"
      >
        {/* 1. 슬림 일체형 와이드 헤더 */}
        <InventoryDetailHeader
          item={item}
          allSalesPoints={allSalesPoints}
          unassignedInventory={unassignedInventory}
          selectedSalesPointCode={
            currentTab === 'FORECAST' ? effectiveForecastSalesPointCode : effectiveOverviewSalesPointCode
          }
          copiedSku={copiedSku}
          closeButtonRef={closeButtonRef}
          onCopySku={handleCopySku}
          onSelectSalesPoint={currentTab === 'FORECAST' ? setForecastSalesPointCode : handleSelectSalesPoint}
          onClose={onClose}
        />

        {/* 판매처 상세 API 에러 알림 */}
        {detailQuery.isError && effectiveOverviewSalesPointCode && (
          <div className="flex items-center justify-between border-b border-rose-200 bg-rose-50 px-6 py-2 text-xs text-rose-800 shrink-0">
            <div className="flex items-center gap-1.5 font-medium">
              <Danger size={14} className="text-rose-600 shrink-0" />
              <span>선택한 판매처의 상세 재고 정보를 불러오는 중 오류가 발생했습니다.</span>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => detailQuery.refetch()}>
              <Refresh size={11} />
              다시 시도
            </Button>
          </div>
        )}

        {/* 2. 2단 통합 탭 네비게이션 (재고 개요 | 수요예측) */}
        <Tabs
          value={currentTab}
          onValueChange={onTabChange}
          className="shrink-0 border-b border-gray-200 bg-white px-6"
        >
          {({ value, setValue }) => (
            <TabsList className="gap-0" aria-label="상세 탭">
              <TabsTrigger
                id="inventory-tab-overview-trigger"
                value="OVERVIEW"
                activeValue={value}
                onSelect={setValue}
                aria-controls="inventory-tab-overview"
                className="px-4 py-2.5 text-xs"
              >
                재고 개요
              </TabsTrigger>
              <TabsTrigger
                id="inventory-tab-forecast-trigger"
                value="FORECAST"
                activeValue={value}
                onSelect={setValue}
                aria-controls="inventory-tab-forecast"
                className="px-4 py-2.5 text-xs"
              >
                수요예측
              </TabsTrigger>
            </TabsList>
          )}
        </Tabs>

        {/* 3. 본문 워크스페이스 */}
        <div className="flex-1 min-h-0 overflow-hidden bg-[#F9FAFB]">
          {/* TAB 1: 재고 개요 (보관센터 + 판매처 분산 + 기본 LOT 요약) */}
          {currentTab === 'OVERVIEW' && (
            <div
              id="inventory-tab-overview"
              role="tabpanel"
              aria-labelledby="inventory-tab-overview-trigger"
              tabIndex={0}
              className="grid grid-cols-1 lg:grid-cols-12 h-full min-h-0"
            >
              <div className="lg:col-span-5 flex flex-col border-r border-gray-200 bg-white h-full min-h-0 overflow-hidden">
                <InventorySalesPointsSection
                  allSalesPoints={allSalesPoints}
                  unassignedInventory={unassignedInventory}
                  ownerSalesPointCount={ownerSalesPointCount}
                  selectedSalesPointCode={effectiveOverviewSalesPointCode}
                  channelPrices={item?.channelPrices || []}
                  onSelectSalesPoint={handleSelectSalesPoint}
                />
              </div>

              <div
                className="lg:col-span-7 flex flex-col p-4 space-y-4 overflow-y-auto h-full min-h-0"
                aria-busy={isOverviewLoading}
              >
                {isOverviewLoading ? (
                  <InventoryOverviewSkeleton />
                ) : (
                  <>
                    {riskQuery.isError && (
                      <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                        <span>서버 위험 판정 정보를 불러오지 못했습니다.</span>
                        <button
                          type="button"
                          className="font-semibold underline underline-offset-2"
                          onClick={() => riskQuery.refetch()}
                        >
                          다시 시도
                        </button>
                      </div>
                    )}
                    {riskQuery.data && riskQuery.data.assessmentStatus !== 'ASSESSED' ? (
                      <RiskAssessmentStateView
                        status={riskQuery.data.assessmentStatus}
                        onRetry={() => riskQuery.refetch()}
                      />
                    ) : riskQuery.data ? (
                      <RiskExplanationPanel
                        data={riskQuery.data}
                        expectedDisposalQuantity={detailQuery.data?.expectedDisposalQuantity ?? null}
                      />
                    ) : null}
                    <InventoryLotsSection
                      selectedSalesPoint={selectedOverviewSalesPoint}
                      selectedSalesPointCode={effectiveOverviewSalesPointCode}
                      referenceDate={riskReferenceDate}
                      lotsQuery={lotsQuery}
                      onNavigateToOverview={() => onTabChange?.('OVERVIEW')}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 선택한 SKU × 판매처의 수요예측 */}
          {currentTab === 'FORECAST' && (
            <div
              id="inventory-tab-forecast"
              role="tabpanel"
              aria-labelledby="inventory-tab-forecast-trigger"
              tabIndex={0}
              className="h-full w-full min-h-0 overflow-y-auto p-5 pr-2 space-y-4"
            >
              {/* 판매처 다중 전환 칩 셀렉터 */}
              {allSalesPoints.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-bold text-slate-900">
                      수요예측 대상 판매처 선택 ({allSalesPoints.length}개)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      판매처를 클릭하여 지점별 예측 데이터를 바로 전환할 수 있습니다.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {allSalesPoints.map((sp) => {
                      const isSelected = effectiveForecastSalesPointCode === sp.salesPointCode;
                      const channelBadge =
                        CHANNEL_BADGE_STYLES[sp.channelType] || 'bg-gray-100 text-gray-700 border-gray-200';
                      const channelLabel = CHANNEL_BADGE_LABELS[sp.channelType] || sp.channelType || '기타';
                      return (
                        <button
                          key={sp.salesPointCode}
                          type="button"
                          onClick={() => setForecastSalesPointCode(sp.salesPointCode)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                            isSelected
                              ? 'border-[var(--primary)] bg-[#F0FDF4] text-[#1E8251] shadow-2xs ring-1 ring-[var(--primary)]/30'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className={`rounded px-1 py-0.2 text-[9px] font-bold border shrink-0 ${channelBadge}`}>
                            {channelLabel}
                          </span>
                          <span>{sp.salesPointName}</span>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            ({formatQuantity(sp.currentQuantity)})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedForecastSalesPoint?.salesPointName
                        ? `${selectedForecastSalesPoint.salesPointName} 수요예측 & 예상 잔고 추이`
                        : '수요예측 & 예상 잔고 추이'}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      D+7~D+90 예상 가용재고와 안전재고 기준선을 시각화합니다.
                    </p>
                  </div>
                </div>

                {forecastQuery.data?.freshness && (
                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                    <span>예측 기준일: {forecastQuery.data.freshness.forecastAsOf || '미제공'}</span>
                  </div>
                )}

                {!effectiveForecastSalesPointCode ? (
                  <DemandForecastStateView
                    status="NO_DATA"
                    message="수요예측을 조회할 판매처를 먼저 선택해 주세요. 상단 판매처 칩에서 원하는 지점을 클릭하세요."
                  />
                ) : isForecastUnassigned ? (
                  <DemandForecastStateView
                    status="NO_DATA"
                    message="센터 전용 재고는 판매처별 수요예측 대상이 아닙니다. 특정 판매처의 예측을 임의로 복사하지 않습니다."
                  />
                ) : forecastQuery.isError ? (
                  <DemandForecastStateView
                    status="ERROR"
                    message="선택한 판매처의 수요예측 API 조회에 실패했습니다."
                    onRetry={() => forecastQuery.refetch()}
                  />
                ) : forecastQuery.data?.status !== 'AVAILABLE' && forecastQuery.data ? (
                  <DemandForecastStateView
                    status={forecastQuery.data.status}
                    message={forecastQuery.data.freshness?.message}
                    onRetry={() => forecastQuery.refetch()}
                  />
                ) : forecastQuery.isLoading ? (
                  <div className="flex h-[280px] items-center justify-center text-xs text-slate-400 animate-pulse">
                    수요예측 데이터를 불러오는 중입니다...
                  </div>
                ) : (
                  <>
                    {forecastQuery.data?.safetyStockQty == null && (
                      <div
                        role="status"
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                      >
                        수요예측은 표시되지만 안전재고 데이터가 없어 기준선과 대비 상태는 표시되지 않습니다.
                      </div>
                    )}
                    <Suspense
                      fallback={
                        <div className="flex h-[280px] items-center justify-center text-xs text-slate-400 animate-pulse">
                          차트를 불러오는 중입니다...
                        </div>
                      }
                    >
                      <DemandForecastChart data={forecastQuery.data} height={280} />
                    </Suspense>
                    {forecastQuery.data && !['NO_DATA', 'ERROR'].includes(forecastQuery.data.status) && (
                      <DemandForecastTable data={forecastQuery.data} />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
