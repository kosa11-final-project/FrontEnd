import { lazy, Suspense, useMemo, useState } from 'react';
import { Building, Database, Store } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/format';
import { Badge, Card, CardDescription, CardHeader, CardTitle, Icon, StateView } from '@/shared/ui';

const InventoryLocationScene = lazy(() =>
  import('./InventoryLocationScene.jsx').then((module) => ({ default: module.InventoryLocationScene })),
);

const viewMeta = Object.freeze({
  centers: {
    label: '판매처 미할당',
    tabLabel: '미할당',
    shortLabel: '보관 물류센터',
    countUnit: '센터',
    icon: Database,
    description: '판매처가 지정되지 않은 재고를 보관하는 물류 허브',
    totalLabel: '판매처 미할당 재고 합계',
    sceneLabel: '물류 허브 관제',
  },
  online: {
    label: '온라인 판매처 할당',
    tabLabel: '온라인',
    shortLabel: '온라인 판매처',
    countUnit: '판매처',
    icon: Store,
    description: '물류센터에서 온라인 판매처로 할당된 재고 흐름',
    totalLabel: '온라인 판매처 재고 합계',
    sceneLabel: '온라인 배분 네트워크',
  },
  stores: {
    label: '오프라인 판매처 할당',
    tabLabel: '오프라인',
    shortLabel: '오프라인 판매처',
    countUnit: '판매처',
    icon: Building,
    description: '전국 오프라인 판매처에 할당된 재고 분포',
    totalLabel: '오프라인 판매처 재고 합계',
    sceneLabel: '전국 판매처 관제',
  },
});

const detailToneClasses = Object.freeze({
  neutral: 'text-[color:var(--text-heading)]',
  good: 'text-[color:var(--good)]',
  warning: 'text-[color:var(--warning)]',
  danger: 'text-[color:var(--danger)]',
});

function resolveLocationTone(location) {
  if (location.riskSkuCount >= 5 || location.nearExpiryStock >= 50 || location.expectedDisposal >= 40) {
    return 'danger';
  }
  if (location.riskSkuCount >= 3 || location.nearExpiryStock >= 30 || location.expectedDisposal >= 25) {
    return 'warning';
  }
  return 'good';
}

function getLocationDetailItems(location, viewMode) {
  return [
    { label: '현재고', value: formatQuantity(location.currentStock), tone: 'neutral' },
    { label: '판매 가능', value: formatQuantity(location.availableStock), tone: 'good' },
    { label: '임박', value: formatQuantity(location.nearExpiryStock), tone: 'warning' },
    viewMode === 'centers'
      ? { label: '출고 예정', value: formatQuantity(location.outboundStock), tone: 'neutral' }
      : { label: '예상 폐기', value: formatQuantity(location.expectedDisposal), tone: 'danger' },
    { label: '위험 SKU', value: formatQuantity(location.riskSkuCount), tone: 'danger' },
  ];
}

function LocationMetrics({ className, compact = false, layout = 'default', location, viewMode }) {
  return (
    <dl className={cn('grid gap-2', layout === 'dock' ? 'grid-cols-5' : 'grid-cols-2', className)}>
      {getLocationDetailItems(location, viewMode).map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex items-center justify-between gap-2 rounded-[var(--radius-control)] bg-[var(--surface-subtle)]',
            compact ? 'min-h-8 px-2 py-1.5' : 'min-h-10 px-2.5 py-2',
          )}
        >
          <dt className="text-[length:var(--font-size-tiny)] font-[var(--font-weight-medium)] text-[color:var(--text-muted)]">
            {item.label}
          </dt>
          <dd
            className={cn(
              'tabular-nums text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)]',
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

function ViewModeButton({ active, count, disabled = false, icon, label, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)] transition-colors',
        active
          ? 'bg-[var(--primary-strong)] text-[color:var(--text-inverse)] shadow-[var(--shadow-soft)]'
          : 'text-[color:var(--text-body)] hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent',
      )}
      onClick={onClick}
    >
      <Icon icon={icon} size={14} aria-hidden="true" />
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[length:var(--font-size-tiny)]',
          active ? 'bg-white/18 text-white' : 'bg-[var(--surface)] text-[color:var(--text-muted)]',
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
          const tone = resolveLocationTone(location);
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
                    {location.region} · 위험 SKU {formatQuantity(location.riskSkuCount)} · 임박{' '}
                    <strong className="text-[color:var(--warning)]">{formatQuantity(location.nearExpiryStock)}</strong>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[length:var(--font-size-tiny)] text-[color:var(--text-muted)]">
                    판매 가능
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

function SceneDock({ location, meta, totalAvailableStock, totalNearExpiryStock, viewMode }) {
  const tone = resolveLocationTone(location);
  const statusLabel = tone === 'danger' ? '위험' : tone === 'warning' ? '주의' : '정상';
  const description =
    viewMode === 'online'
      ? `${formatQuantity(location.storageWarehouseCount)} 물류센터 보관`
      : location.address || location.description || '주소 정보 없음';

  return (
    <aside className="pointer-events-none absolute bottom-3 left-3 right-3 z-[2000] hidden grid-cols-[minmax(150px,0.8fr)_minmax(0,2.2fr)] items-center gap-3 rounded-[var(--radius-panel)] border border-white/85 bg-white/94 p-2.5 shadow-[0_16px_36px_rgba(21,70,53,0.16)] backdrop-blur-md sm:grid lg:grid-cols-[minmax(160px,0.8fr)_minmax(0,2.2fr)_auto]">
      <div className="flex min-w-0 items-center gap-2.5 border-r border-[var(--border)] pr-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--primary-soft)] text-[color:var(--primary-strong)]">
          <Icon icon={meta.icon} size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <span className="flex items-center gap-2">
            <strong className="truncate text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
              {location.name}
            </strong>
            <Badge variant={tone}>{statusLabel}</Badge>
          </span>
          <p className="mt-0.5 truncate text-[length:var(--font-size-tiny)] text-[color:var(--text-muted)]">
            {location.region} · {description}
          </p>
        </div>
      </div>
      <LocationMetrics
        compact
        layout="dock"
        location={location}
        viewMode={viewMode}
        className="gap-1.5 [&>div]:min-w-0 [&_dt]:truncate"
      />
      <div className="hidden min-w-[164px] border-l border-[var(--border)] pl-3 text-right lg:block">
        <span className="block text-[length:var(--font-size-tiny)] text-[color:var(--text-muted)]">
          {meta.totalLabel}
        </span>
        <strong className="mt-0.5 block whitespace-nowrap text-[length:var(--font-size-meta)] text-[color:var(--text-heading)]">
          판매 가능 {formatQuantity(totalAvailableStock)}
        </strong>
        <span className="mt-0.5 block whitespace-nowrap text-[length:var(--font-size-tiny)] text-[color:var(--warning)]">
          임박 {formatQuantity(totalNearExpiryStock)}
        </span>
      </div>
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

function getInitialViewMode(centers, onlineSalesPoints) {
  if (centers.length > 0) return 'centers';
  if (onlineSalesPoints.length > 0) return 'online';
  return 'stores';
}

export function InventoryLocationOverview({ centers, onlineSalesPoints, stores }) {
  const [viewMode, setViewMode] = useState(() => getInitialViewMode(centers, onlineSalesPoints));
  const [hoveredLocationId, setHoveredLocationId] = useState(null);
  const [activeLocationIds, setActiveLocationIds] = useState({
    centers: centers[0]?.id,
    online: onlineSalesPoints[0]?.id,
    stores: stores[0]?.id,
  });
  const [webglAvailable] = useState(supportsWebGL);
  const locationGroups = { centers, online: onlineSalesPoints, stores };
  const locations = locationGroups[viewMode];
  const meta = viewMeta[viewMode];
  const activeLocation = locations.find((location) => location.id === activeLocationIds[viewMode]) ?? locations[0];
  const hoveredLocation = locations.find((location) => location.id === hoveredLocationId);
  const displayLocation = hoveredLocation ?? activeLocation;
  const totalAvailableStock = useMemo(
    () => locations.reduce((sum, location) => sum + location.availableStock, 0),
    [locations],
  );
  const totalNearExpiryStock = useMemo(
    () => locations.reduce((sum, location) => sum + location.nearExpiryStock, 0),
    [locations],
  );

  const handleLocationActivate = (locationId) => {
    setActiveLocationIds((current) => ({ ...current, [viewMode]: locationId }));
  };

  const handleViewModeChange = (mode) => {
    setHoveredLocationId(null);
    setViewMode(mode);
  };

  return (
    <Card asChild padding="none" className="min-w-0 overflow-hidden shadow-[var(--shadow-card)]">
      <section aria-labelledby="inventory-location-title">
        <CardHeader className="flex-col gap-3 border-b border-[var(--border)] p-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle id="inventory-location-title" className="flex items-center gap-2">
              <Icon icon={Database} size={18} className="text-[color:var(--primary)]" aria-hidden="true" />
              재고 위치별 현황
            </CardTitle>
            <CardDescription className="mt-1">
              3D 장면에서 재고 규모와 위험 위치를 비교하고 시설을 선택해 상세 수치를 확인합니다.
            </CardDescription>
          </div>

          <div
            role="tablist"
            aria-label="재고 위치 유형"
            className="flex w-fit max-w-full flex-nowrap gap-1 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] p-1"
          >
            {Object.entries(locationGroups).map(([mode, group]) => (
              <ViewModeButton
                key={mode}
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
          <div className="p-3 sm:p-4">
            <MobileLocationList
              activeLocationId={activeLocation?.id}
              locations={locations}
              onActivate={handleLocationActivate}
              viewMode={viewMode}
            />

            <div className="relative hidden h-[clamp(340px,47vh,480px)] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-strong)] bg-[var(--surface-subtle)] sm:block">
              {webglAvailable ? (
                <Suspense
                  fallback={
                    <div className="absolute inset-0 grid place-items-center bg-[var(--surface-subtle)]">
                      <div className="text-center">
                        <span className="mx-auto block size-9 animate-pulse rounded-full bg-[var(--primary-soft)] motion-reduce:animate-none" />
                        <strong className="mt-3 block text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                          3D 재고 장면을 준비하고 있습니다.
                        </strong>
                      </div>
                    </div>
                  }
                >
                  <InventoryLocationScene
                    key={viewMode}
                    activeLocationId={activeLocation?.id}
                    locations={locations}
                    onActivate={handleLocationActivate}
                    onHoverChange={setHoveredLocationId}
                    viewMode={viewMode}
                  />
                </Suspense>
              ) : (
                <StateView
                  state="empty"
                  title="3D 장면을 표시할 수 없습니다."
                  description="그래픽 가속을 지원하는 브라우저에서 다시 확인해 주세요."
                  className="absolute inset-4"
                />
              )}

              <div className="pointer-events-none absolute left-3 top-3 z-[2000] flex max-w-[calc(100%_-_24px)] items-center rounded-full border border-white/80 bg-white/95 px-3 py-1.5 shadow-[var(--shadow-soft)] backdrop-blur-sm">
                <span className="text-[length:var(--font-size-tiny)] font-[var(--font-weight-bold)] tracking-[0.08em] text-[color:var(--primary-strong)]">
                  {meta.sceneLabel}
                </span>
                <span className="ml-2 text-[length:var(--font-size-meta)] text-[color:var(--text-body)]">
                  {locations.length}개 {meta.countUnit}
                </span>
              </div>

              {displayLocation ? (
                <SceneDock
                  location={displayLocation}
                  meta={meta}
                  totalAvailableStock={totalAvailableStock}
                  totalNearExpiryStock={totalNearExpiryStock}
                  viewMode={viewMode}
                />
              ) : null}

              <p className="sr-only">
                {meta.shortLabel} {locations.length}개의 판매 가능 재고와 위험도를 보여주는 3D 재고 관제 장면입니다.
                시설 이름을 선택하면 해당 위치로 카메라가 이동합니다.
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
