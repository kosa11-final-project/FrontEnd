import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DocumentText } from 'reicon-react';
import { formatNumber } from '@/shared/lib/format';
import { toRect } from '@/shared/lib/geometry.js';
import { RESULT_STATE } from '@/entities/inventory/model/inventory.js';
import { Button } from '@/shared/ui/Button.jsx';
import { Icon } from '@/shared/ui/Icon.jsx';
import { StateView } from '@/shared/ui/StateView.jsx';
import { InventoryTableDesktop } from './InventoryTableDesktop.jsx';
import { InventoryTableMobile } from './InventoryTableMobile.jsx';
import { InventoryPagination } from './InventoryPagination.jsx';
import { InventoryTableEmptyRefetchSkeleton, InventoryTableSkeleton } from './InventoryTableSkeleton.jsx';

const FETCHING_HINT_DELAY_MS = 400;
const BODY_SKELETON_DELAY_MS = 1000;

const LazyImageLightbox = lazy(() =>
  import('@/shared/ui/ImageLightbox.jsx').then((module) => ({ default: module.ImageLightbox })),
);

function ImageLightboxFallback({ image, onClose }) {
  useEffect(() => {
    if (!image) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose]);

  if (!image || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${image.alt} 크게 보기`}
      className="fixed inset-0 z-[110] grid place-items-center bg-black/55 p-4 backdrop-blur-[2px]"
    >
      <button
        type="button"
        aria-label="이미지 크게 보기 닫기"
        className="absolute inset-0 size-full cursor-zoom-out"
        onClick={onClose}
      />
      <img
        src={image.src}
        alt={image.alt}
        className="pointer-events-auto relative max-h-[80vh] max-w-[86vw] rounded-2xl border border-white/70 bg-white object-contain shadow-2xl"
      />
      <button
        type="button"
        aria-label="이미지 크게 보기 닫기"
        className="absolute right-5 top-5 z-10 inline-grid size-10 place-items-center rounded-full border border-white/50 bg-black/45 text-2xl leading-none text-white shadow-lg transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        onClick={onClose}
      >
        ×
      </button>
    </div>,
    document.body,
  );
}

function useProgressiveFetching(isFetching, fetchKey) {
  const [fetchState, setFetchState] = useState(() => ({ fetchKey, isFetching, stage: 'idle' }));

  if (fetchState.isFetching !== isFetching || fetchState.fetchKey !== fetchKey) {
    setFetchState({ fetchKey, isFetching, stage: 'idle' });
  }

  useEffect(() => {
    if (!isFetching) return undefined;

    const hintTimerId = window.setTimeout(() => {
      setFetchState((current) =>
        current.isFetching && current.fetchKey === fetchKey ? { ...current, stage: 'hint' } : current,
      );
    }, FETCHING_HINT_DELAY_MS);
    const skeletonTimerId = window.setTimeout(() => {
      setFetchState((current) =>
        current.isFetching && current.fetchKey === fetchKey ? { ...current, stage: 'skeleton' } : current,
      );
    }, BODY_SKELETON_DELAY_MS);

    return () => {
      window.clearTimeout(hintTimerId);
      window.clearTimeout(skeletonTimerId);
    };
  }, [fetchKey, isFetching]);

  const isCurrentRequest = fetchState.isFetching === isFetching && fetchState.fetchKey === fetchKey;
  const stage = isCurrentRequest ? fetchState.stage : 'idle';
  return {
    showFetchingHint: isFetching && (stage === 'hint' || stage === 'skeleton'),
    showBodySkeleton: isFetching && stage === 'skeleton',
  };
}

function FetchingHint() {
  return (
    <span role="status" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--primary)] motion-safe:animate-pulse" />
      조회 중
    </span>
  );
}

export function InventoryTable({
  items = [],
  totalCount = 0,
  page = 1,
  size = 20,
  sort = 'updatedAt,desc',
  totalPages = 1,
  selectedItem = null,
  selectedSkuCodes = [],
  onToggleSelectSku,
  onSelectAllSkus,
  onClearSelectedSkus,
  onGenerateStrategy,
  maxSelection = 5,
  resultState = RESULT_STATE.HAS_DATA,
  fetchKey,
  isLoading = false,
  isFetching = false,
  isError = false,
  error,
  onRetry,
  onPageChange,
  onSizeChange,
  onSortChange,
  onResetFilters,
  onRowClick,
}) {
  const [lightboxImage, setLightboxImage] = useState(null);
  const { showFetchingHint, showBodySkeleton } = useProgressiveFetching(isFetching, fetchKey);

  const handleImageClick = useCallback((event, item, alt) => {
    event.stopPropagation();
    const target = event.currentTarget.querySelector('img') || event.currentTarget;
    const rect = target.getBoundingClientRect();

    setLightboxImage({
      id: item.rowId || item.skuCode || alt,
      src: item.imageUrl,
      alt,
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight,
      originRect: toRect(rect),
    });
  }, []);

  const handleImageClose = useCallback(() => setLightboxImage(null), []);

  if (isLoading) {
    return <InventoryTableSkeleton rowCount={Math.min(Math.max(size, 1), 100)} />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-12 shadow-xs">
        <StateView
          state="error"
          title="재고 데이터를 불러오지 못했습니다"
          description={
            error?.code === 'REQUEST_TIMEOUT'
              ? '재고 조회 시간이 초과되었습니다. 조건을 줄이거나 잠시 후 다시 시도해 주세요.'
              : '서버와의 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
          }
          actionLabel="다시 조회"
          onAction={onRetry || (() => onPageChange?.(page))}
        />
      </div>
    );
  }

  if (resultState === RESULT_STATE.FILTER_EMPTY || items.length === 0) {
    return (
      <div
        data-testid="inventory-table-empty-state"
        className="relative rounded-xl border border-[var(--border)] bg-white p-12 shadow-xs"
        aria-busy={isFetching || undefined}
      >
        {showFetchingHint && (
          <div className="absolute right-5 top-4">
            <FetchingHint />
          </div>
        )}
        {showBodySkeleton ? (
          <InventoryTableEmptyRefetchSkeleton />
        ) : (
          <StateView
            state="empty"
            title={resultState === RESULT_STATE.FILTER_EMPTY ? '일치하는 재고가 없습니다' : '등록된 재고가 없습니다'}
            description={
              resultState === RESULT_STATE.FILTER_EMPTY
                ? '설정하신 검색어나 필터 조건에 맞는 재고가 없습니다. 조건을 변경해 보세요.'
                : '현재 시스템에 등록된 통합 재고 데이터가 존재하지 않습니다.'
            }
            actionLabel={resultState === RESULT_STATE.FILTER_EMPTY ? '필터 초기화' : undefined}
            onAction={resultState === RESULT_STATE.FILTER_EMPTY ? onResetFilters : undefined}
          />
        )}
      </div>
    );
  }

  const startIdx = totalCount > 0 ? (page - 1) * size + 1 : 0;
  const endIdx = Math.min(page * size, totalCount);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-xs"
      aria-busy={isFetching || undefined}
    >
      {/* 표 상단 메타 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-6 py-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-bold text-gray-900">통합 재고 현황 목록</span>
          <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-semibold text-gray-700 tabular-nums">
            총 {formatNumber(totalCount)}건
          </span>
          <span className="text-xs text-gray-500 tabular-nums">
            {startIdx} - {endIdx}건 표시 중
          </span>
          {showFetchingHint && <FetchingHint />}
          {selectedSkuCodes.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/30 bg-[#F4FAF6] px-2.5 py-0.5 text-xs font-bold text-[color:var(--primary-strong)]">
              <span>
                {selectedSkuCodes.length}/{maxSelection}개 선택됨
              </span>
              {onClearSelectedSkus && (
                <button
                  type="button"
                  onClick={onClearSelectedSkus}
                  className="ml-0.5 text-[11px] font-medium text-gray-400 hover:text-gray-700 underline cursor-pointer"
                >
                  선택 해제
                </button>
              )}
            </span>
          )}
          <span className="text-xs text-gray-400">
            (체크박스로 최대 {maxSelection}개 선택 또는 행 클릭 시 상세 드로어 열림)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={selectedSkuCodes.length === 0}
            onClick={onGenerateStrategy}
            className="disabled:opacity-100 disabled:bg-[var(--primary-soft)] disabled:text-[color:var(--text-muted)]"
          >
            <Icon icon={DocumentText} size={15} aria-hidden="true" /> AI 전략 생성
          </Button>
        </div>
      </div>

      {/* 1. 데스크톱 테이블 (lg 이상) */}
      <InventoryTableDesktop
        items={items}
        sort={sort}
        selectedItem={selectedItem}
        selectedSkuCodes={selectedSkuCodes}
        onToggleSelectSku={onToggleSelectSku}
        onSelectAllSkus={onSelectAllSkus}
        maxSelection={maxSelection}
        onSortChange={onSortChange}
        onRowClick={onRowClick}
        onImageClick={handleImageClick}
        isFetching={isFetching}
        showBodySkeleton={showBodySkeleton}
      />

      {/* 2. 모바일/태블릿 반응형 카드 뷰 (lg 미만) */}
      <InventoryTableMobile
        items={items}
        selectedItem={selectedItem}
        selectedSkuCodes={selectedSkuCodes}
        onToggleSelectSku={onToggleSelectSku}
        maxSelection={maxSelection}
        onRowClick={onRowClick}
        onImageClick={handleImageClick}
        isFetching={isFetching}
        showBodySkeleton={showBodySkeleton}
      />

      {/* 3. 하단 페이지네이션 및 단위 선택 */}
      <InventoryPagination
        page={page}
        size={size}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onSizeChange={onSizeChange}
      />
      {lightboxImage ? (
        <Suspense fallback={<ImageLightboxFallback image={lightboxImage} onClose={handleImageClose} />}>
          <LazyImageLightbox image={lightboxImage} onClose={handleImageClose} />
        </Suspense>
      ) : null}
    </div>
  );
}
