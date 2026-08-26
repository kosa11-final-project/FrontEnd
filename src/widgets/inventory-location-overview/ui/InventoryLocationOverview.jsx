import { lazy, Suspense, useEffect, useState } from 'react';
import { Building, Database, Store } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/format';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery.js';
import { Badge } from '@/shared/ui/Badge.jsx';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card.jsx';
import { Icon } from '@/shared/ui/Icon.jsx';
import { StateView } from '@/shared/ui/StateView.jsx';
import { getInventoryLocationTone } from '../model/inventoryLocationTone.js';

const InventoryLocationScene = lazy(() =>
  import('./InventoryLocationScene.jsx').then((module) => ({ default: module.InventoryLocationScene })),
);

const viewMeta = Object.freeze({
  stores: {
    label: '오프라인 판매처 할당',
    tabLabel: '오프라인',
    shortLabel: '오프라인 판매처',
    countUnit: '판매처',
    icon: Building,
    description: '전국 오프라인 판매처에 할당된 재고 분포',
    totalLabel: '오프라인 판매처 재고 합계',
    sceneLabel: '전국 오프라인 판매처 관제 (백화점 + 직영점)',
  },
  centers: {
    label: '판매처 미할당',
    tabLabel: '미할당',
    shortLabel: '보관 물류센터',
    countUnit: '센터',
    icon: Database,
    description: '판매처가 지정되지 않은 재고를 보관하는 물류센터',
    totalLabel: '판매처 미할당 재고 합계',
    sceneLabel: '물류센터 관제',
  },
  online: {
    label: '온라인 판매처 할당',
    tabLabel: '온라인',
    shortLabel: '온라인 판매처',
    countUnit: '판매처',
    icon: Store,
    description: '그리팅몰과 모두의맛집에 연결된 온라인 재고 흐름',
    totalLabel: '온라인 판매처 재고 합계',
    sceneLabel: '온라인 판매처 관제',
  },
});

const detailToneClasses = Object.freeze({
  neutral: 'text-[color:var(--text-heading)]',
  good: 'text-[color:var(--good)]',
  warning: 'text-[color:var(--warning)]',
  danger: 'text-[color:var(--danger)]',
});

function getLocationDetailItems(location, viewMode) {
  return [
    { label: '현재고', value: formatQuantity(location.currentStock), tone: 'neutral' },
    { label: '가용수량', value: formatQuantity(location.availableStock), tone: 'good' },
    { label: '소비기한 임박', value: formatQuantity(location.nearExpiryStock), tone: 'warning' },
    viewMode === 'centers'
      ? { label: '출고 예정', value: formatQuantity(location.outboundStock), tone: 'neutral' }
      : { label: '예상 폐기', value: formatQuantity(location.expectedDisposal), tone: 'danger' },
    { label: '위험 SKU', value: formatQuantity(location.riskSkuCount), tone: 'danger' },
  ];
}

function LocationMetrics({ className, compact = false, layout = 'default', location, viewMode }) {
  return (
    <dl
      className={cn('grid gap-2', layout === 'dock' ? 'grid-cols-5' : 'grid-cols-1 min-[360px]:grid-cols-2', className)}
    >
      {getLocationDetailItems(location, viewMode).map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex rounded-[var(--radius-control)] bg-[var(--surface-subtle)]',
            layout === 'dock' ? 'flex-col items-start justify-center gap-0.5' : 'items-center justify-between gap-2',
            compact ? 'min-h-10 px-2.5 py-2' : 'min-h-11 px-3 py-2.5',
          )}
        >
          <dt
            className={cn(
              'font-[var(--font-weight-medium)] text-[color:var(--text-body)]',
              layout === 'dock'
                ? 'break-keep text-center text-[10px] leading-tight lg:text-[length:var(--font-size-meta)]'
                : 'whitespace-nowrap text-[length:var(--font-size-meta)]',
            )}
          >
            {item.label}
          </dt>
          <dd
            className={cn(
              'whitespace-nowrap tabular-nums font-[var(--font-weight-bold)]',
              layout === 'dock'
                ? 'text-[11px] lg:text-[length:var(--font-size-body)]'
                : 'text-[length:var(--font-size-body)]',
              detailToneClasses[item.tone],
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ViewModeButton({ active, count, disabled = false, icon, id, label, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls="inventory-location-tabpanel"
      disabled={disabled}
      className={cn(
        'group inline-flex min-h-10 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-[var(--radius-control)] px-1 text-[11px] font-[var(--font-weight-bold)] transition-colors xl:flex-none xl:shrink-0 xl:justify-start xl:gap-2 xl:px-3 xl:text-[13px]',
        active
          ? 'bg-[var(--primary-strong)] text-[color:var(--text-inverse)] shadow-[var(--shadow-soft)]'
          : 'text-[color:var(--text-body)] hover:bg-[var(--primary-soft)] hover:text-[color:var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent',
      )}
      onClick={onClick}
    >
      <Icon icon={icon} size={14} className="hidden shrink-0 xl:block" aria-hidden="true" />
      {label}
      <span
        className={cn(
          'rounded-full px-1 py-0.5 text-[10px] xl:px-1.5 xl:text-[11px]',
          active
            ? 'bg-white text-[var(--primary-strong)] font-bold'
            : 'bg-[var(--surface)] text-[color:var(--text-body)] font-medium group-hover:bg-white/90 group-hover:text-[color:var(--primary-strong)]',
        )}
      >
        {count}
      </span>
    </button>
  );
}

function MobileLocationList({ activeLocationId, locations, onActivate, viewMode }) {
  const meta = viewMeta[viewMode];

  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] sm:hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
        <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
          {meta.shortLabel} {locations.length}개
        </strong>
        <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          3D 장면 대신 위치별 핵심 수치를 제공합니다.
        </p>
      </div>

      <ul className="max-h-[460px] divide-y divide-[var(--border)] overflow-y-auto">
        {locations.map((location) => {
          const selected = location.id === activeLocationId;
          const tone = getInventoryLocationTone(location, viewMode);
          const statusLabel = tone === 'danger' ? '위험' : tone === 'warning' ? '주의' : '정상';

          return (
            <li key={location.id}>
              <button
                type="button"
                aria-pressed={selected}
                className={cn(
                  'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition-colors',
                  selected ? 'bg-[var(--primary-faint)]' : 'hover:bg-[var(--surface-subtle)]',
                )}
                onClick={() => onActivate(location.id)}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="truncate text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                      {location.name}
                    </strong>
                    <Badge variant={tone}>{statusLabel}</Badge>
                  </span>
                  <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                    {location.region} · 위험 SKU {formatQuantity(location.riskSkuCount)} · 소비기한 임박{' '}
                    <strong className="text-[color:var(--warning)]">{formatQuantity(location.nearExpiryStock)}</strong>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[length:var(--font-size-tiny)] text-[color:var(--text-muted)]">
                    가용수량
                  </span>
                  <strong className="mt-1 block tabular-nums text-[length:var(--font-size-body)] text-[color:var(--good)]">
                    {formatQuantity(location.availableStock)}
                  </strong>
                </span>
              </button>

              {selected ? (
                <div className="border-t border-[var(--border)] bg-[var(--primary-faint)] p-3">
                  <LocationMetrics location={location} viewMode={viewMode} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SceneTotalSummary({ meta, totalAvailableStock, totalNearExpiryStock }) {
  return (
    <aside
      aria-label={meta.totalLabel}
      className="pointer-events-none absolute right-3 top-3 z-[2000] hidden min-w-[292px] grid-cols-2 items-stretch overflow-hidden rounded-[var(--radius-panel)] border border-white/85 bg-white/95 shadow-[0_12px_28px_rgba(21,70,53,0.13)] backdrop-blur-md md:grid"
    >
      <div className="px-3 py-2.5">
        <span className="block text-[length:var(--font-size-meta)] text-[color:var(--text-body)]">전체 가용수량</span>
        <strong className="mt-0.5 block whitespace-nowrap tabular-nums text-[length:var(--font-size-body)] text-[color:var(--good)]">
          {formatQuantity(totalAvailableStock)}
        </strong>
      </div>
      <div className="border-l border-[var(--border)] px-3 py-2.5">
        <span className="block text-[length:var(--font-size-meta)] text-[color:var(--text-body)]">소비기한 임박</span>
        <strong className="mt-0.5 block whitespace-nowrap tabular-nums text-[length:var(--font-size-body)] text-[color:var(--warning)]">
          {formatQuantity(totalNearExpiryStock)}
        </strong>
      </div>
    </aside>
  );
}

function SceneDock({ location, meta, viewMode }) {
  const displayName = viewMode === 'online' ? location.shortName || location.name : location.name;
  const description =
    viewMode === 'online'
      ? `${formatQuantity(location.storageWarehouseCount)} 물류센터 보관`
      : location.address || location.description || '주소 정보 없음';

  return (
    <aside className="pointer-events-none absolute bottom-4 left-4 right-4 z-[2000] hidden grid-cols-[minmax(230px,1fr)_minmax(0,3fr)] items-center gap-3 rounded-[var(--radius-panel)] border border-white/85 bg-white/95 p-3 shadow-[0_16px_36px_rgba(21,70,53,0.16)] backdrop-blur-md sm:grid">
      <div className="flex min-w-0 items-center gap-3 border-r border-[var(--border)] pr-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--primary-soft)] text-[color:var(--primary-strong)]">
          <Icon icon={meta.icon} size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <strong className="block truncate text-[length:var(--font-size-body)] leading-tight text-[color:var(--text-heading)]">
            {displayName}
          </strong>
          <p className="mt-0.5 line-clamp-2 break-keep text-[length:var(--font-size-meta)] leading-tight text-[color:var(--text-body)]">
            {location.region} · {description}
          </p>
        </div>
      </div>
      <LocationMetrics
        compact
        layout="dock"
        location={location}
        viewMode={viewMode}
        className="gap-2 [&>div]:min-w-0"
      />
    </aside>
  );
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function getInitialViewMode(centers, onlineSalesPoints, stores) {
  if (stores.length > 0) return 'stores';
  if (centers.length > 0) return 'centers';
  if (onlineSalesPoints.length > 0) return 'online';
  return 'stores';
}

function useDeferredScene(enabled) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const SCENE_DEFER_MS = 180;
    let cancelled = false;
    let timeoutId;
    let idleId;
    const start = () => {
      if (!cancelled) setReady(true);
    };
    const startWhenIdle = () => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(start, { timeout: 900 });
      } else {
        start();
      }
    };

    // The scene is requested explicitly, so only a short delay is needed to
    // let the interaction settle before importing the 3D module and GLB data.
    timeoutId = window.setTimeout(startWhenIdle, SCENE_DEFER_MS);

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [enabled]);

  return enabled && ready;
}

function SceneLoadingPlaceholder() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[var(--surface-subtle)]">
      <div className="flex flex-col items-center justify-center text-center">
        <span className="size-9 animate-spin rounded-full border-3 border-[var(--primary-soft)] border-t-[var(--primary)]" />
        <strong className="mt-3 block text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
          3D 재고 관제 장면을 불러오는 중...
        </strong>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          전국 매장 및 물류센터 3D 공간 데이터를 시각화하고 있습니다.
        </p>
      </div>
    </div>
  );
}

export function InventoryLocationOverview({
  centers,
  onlineSalesPoints,
  stores,
  onSalesPointSelect,
  onViewModeChange,
}) {
  const [viewMode, setViewMode] = useState(() => getInitialViewMode(centers, onlineSalesPoints, stores));
  const [hoveredLocationId, setHoveredLocationId] = useState(null);
  const [activeLocationIds, setActiveLocationIds] = useState({
    centers: centers[0]?.id,
    online: onlineSalesPoints[0]?.id,
    stores: stores[0]?.id,
  });
  const [webglAvailable] = useState(supportsWebGL);
  const desktopSceneAvailable = useMediaQuery('(min-width: 640px)');
  const locationGroups = { stores, centers, online: onlineSalesPoints };
  const locations = locationGroups[viewMode];
  const meta = viewMeta[viewMode];
  const sceneEnabled = desktopSceneAvailable && webglAvailable && locations.length > 0;
  const sceneReady = useDeferredScene(sceneEnabled);
  const activeLocation = locations.find((location) => location.id === activeLocationIds[viewMode]) ?? locations[0];
  const hoveredLocation = locations.find((location) => location.id === hoveredLocationId);
  const displayLocation = hoveredLocation ?? activeLocation;
  const totalAvailableStock = locations.reduce((sum, location) => sum + location.availableStock, 0);
  const totalNearExpiryStock = locations.reduce((sum, location) => sum + location.nearExpiryStock, 0);

  const notifySalesPointSelection = (mode, locationId) => {
    if (mode === 'centers') {
      onSalesPointSelect?.(null);
      return;
    }

    const selectedLocation = locationGroups[mode].find((location) => location.id === locationId);
    onSalesPointSelect?.(selectedLocation?.salesPointId ?? null);
  };

  const handleLocationActivate = (locationId) => {
    setActiveLocationIds((current) => ({ ...current, [viewMode]: locationId }));
    notifySalesPointSelection(viewMode, locationId);
  };

  const handleViewModeChange = (mode) => {
    setHoveredLocationId(null);
    setViewMode(mode);
    onViewModeChange?.(mode);
    const nextLocationId = activeLocationIds[mode] ?? locationGroups[mode][0]?.id;
    notifySalesPointSelection(mode, nextLocationId);
  };

  return (
    <Card asChild padding="none" className="h-full min-w-0 overflow-hidden shadow-[var(--shadow-card)]">
      <section className="flex h-full min-h-0 flex-col" aria-labelledby="inventory-location-title">
        <CardHeader className="shrink-0 flex-col gap-3 border-b border-[var(--border)] p-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle id="inventory-location-title" className="flex items-center gap-2 text-lg">
              <Icon icon={Database} size={20} className="text-[color:var(--primary)]" aria-hidden="true" />
              재고 위치별 현황
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-[color:var(--text-body)]">
              3D 장면에서 재고 규모와 위험 위치를 비교하고 시설을 선택해 상세 수치를 확인합니다.
            </CardDescription>
          </div>

          <div
            role="tablist"
            aria-label="재고 위치 유형"
            className="flex w-full max-w-full flex-nowrap gap-1 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] p-1 xl:w-fit"
          >
            {Object.entries(locationGroups).map(([mode, group]) => (
              <ViewModeButton
                key={mode}
                id={`tab-${mode}`}
                active={viewMode === mode}
                count={group.length}
                disabled={group.length === 0}
                icon={viewMeta[mode].icon}
                label={viewMeta[mode].tabLabel}
                onClick={() => handleViewModeChange(mode)}
              />
            ))}
          </div>
        </CardHeader>

        {locations.length > 0 ? (
          <div
            role="tabpanel"
            id="inventory-location-tabpanel"
            aria-labelledby={`tab-${viewMode}`}
            className="flex min-h-0 flex-1 flex-col p-3 sm:p-4"
          >
            <MobileLocationList
              activeLocationId={activeLocation?.id}
              locations={locations}
              onActivate={handleLocationActivate}
              viewMode={viewMode}
            />

            <div className="relative hidden h-[clamp(380px,49vh,500px)] min-h-0 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-strong)] bg-[var(--surface-subtle)] sm:block 2xl:h-auto 2xl:flex-1">
              {desktopSceneAvailable && webglAvailable && sceneReady ? (
                <Suspense fallback={<SceneLoadingPlaceholder />}>
                  <InventoryLocationScene
                    key={viewMode}
                    activeLocationId={activeLocation?.id}
                    locations={locations}
                    onActivate={handleLocationActivate}
                    onHoverChange={setHoveredLocationId}
                    viewMode={viewMode}
                  />
                </Suspense>
              ) : desktopSceneAvailable && webglAvailable ? (
                <SceneLoadingPlaceholder />
              ) : (
                <StateView
                  state="empty"
                  title="3D 장면을 표시할 수 없습니다."
                  description="그래픽 가속을 지원하는 브라우저에서 다시 확인해 주세요."
                  className="absolute inset-4"
                />
              )}

              <div className="pointer-events-none absolute left-3 top-3 z-[2000] flex max-w-[calc(100%_-_24px)] items-center rounded-full border border-white/80 bg-white/95 px-3 py-1.5 shadow-[var(--shadow-soft)] backdrop-blur-sm">
                <span className="text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)] tracking-[0.04em] text-[color:var(--primary-strong)]">
                  {meta.sceneLabel}
                </span>
                <span className="ml-2 text-[length:var(--font-size-meta)] text-[color:var(--text-body)]">
                  {locations.length}개 {meta.countUnit}
                </span>
              </div>

              <SceneTotalSummary
                meta={meta}
                totalAvailableStock={totalAvailableStock}
                totalNearExpiryStock={totalNearExpiryStock}
              />

              {viewMode === 'stores' ? (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-[1500] h-5 bg-[#edf7f4]"
                  aria-hidden="true"
                />
              ) : null}

              {displayLocation ? <SceneDock location={displayLocation} meta={meta} viewMode={viewMode} /> : null}

              <p className="sr-only">
                {meta.shortLabel} {locations.length}개의 가용수량과 위험도를 보여주는 3D 재고 관제 장면입니다.
                {viewMode === 'centers'
                  ? '시설 이름을 선택하면 해당 위치로 카메라가 이동합니다.'
                  : '판매처에 마우스를 올리거나 이름을 선택하면 하단 상세 수치가 변경됩니다.'}
              </p>
            </div>
          </div>
        ) : (
          <StateView
            state="empty"
            title="표시할 재고 위치가 없습니다."
            description="다음 재고 동기화 완료 후 다시 확인해 주세요."
            className="m-5"
          />
        )}
      </section>
    </Card>
  );
}
