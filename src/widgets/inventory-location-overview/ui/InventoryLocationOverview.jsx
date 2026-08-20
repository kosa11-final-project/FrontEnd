import { useState } from 'react';
import { Building, Database, Store, Warning } from 'reicon-react';
import { getHeatmapMarkerSize } from '@/entities/inventory';
import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/format';
import { Badge, Card, CardDescription, CardHeader, CardTitle, Icon, StateView } from '@/shared/ui';

const locationToneClasses = Object.freeze({
  danger:
    'border-[color:var(--danger)] bg-[var(--danger)] text-[color:var(--text-inverse)] shadow-[0_0_0_9px_color-mix(in_srgb,var(--danger)_16%,transparent),var(--shadow-card)]',
  warning:
    'border-[color:var(--warning)] bg-[var(--warning)] text-[color:var(--text-heading)] shadow-[0_0_0_9px_color-mix(in_srgb,var(--warning)_20%,transparent),var(--shadow-card)]',
  good: 'border-[color:var(--primary)] bg-[var(--primary)] text-[color:var(--text-inverse)] shadow-[0_0_0_9px_color-mix(in_srgb,var(--primary)_16%,transparent),var(--shadow-card)]',
});

const viewMeta = Object.freeze({
  centers: {
    label: '물류센터 미할당',
    shortLabel: '물류센터',
    countUnit: '센터',
    icon: Database,
    description: '판매처가 정해지지 않은 물류센터 재고',
    totalLabel: '판매처 미할당 재고 합계',
    regionLabels: ['수도권', '영남권', '호남권'],
  },
  online: {
    label: '온라인 판매처',
    shortLabel: '온라인 판매처',
    countUnit: '판매처',
    icon: Store,
    description: '물류센터에 보관 중인 온라인 판매처 할당 재고',
    totalLabel: '온라인 판매처 재고 합계',
    regionLabels: ['온라인 채널', '물류센터 보관', '판매처 할당'],
  },
  stores: {
    label: '오프라인 매장',
    shortLabel: '오프라인 매장',
    countUnit: '매장',
    icon: Building,
    description: '각 매장에 실제 보관 중인 오프라인 재고',
    totalLabel: '활성 오프라인 매장 합계',
    regionLabels: ['서울·경기', '영남권', '충청권'],
  },
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

function LocationDetail({ location, viewMode }) {
  const meta = viewMeta[viewMode];
  const isCenterView = viewMode === 'centers';
  const locationDescription =
    viewMode === 'online'
      ? `${formatQuantity(location.storageWarehouseCount)} 물류센터 보관`
      : location.address || location.description || '주소 정보 없음';
  const detailItems = [
    { label: '현재고', value: formatQuantity(location.currentStock), tone: 'neutral' },
    { label: '판매 가능 재고', value: formatQuantity(location.availableStock), tone: 'good' },
    { label: '소비기한 임박', value: formatQuantity(location.nearExpiryStock), tone: 'warning' },
    isCenterView
      ? { label: '출고 예정', value: formatQuantity(location.outboundStock), tone: 'neutral' }
      : { label: '예상 폐기수량', value: formatQuantity(location.expectedDisposal), tone: 'danger' },
    { label: '위험 SKU', value: formatQuantity(location.riskSkuCount), tone: 'danger' },
  ];
  const toneClasses = {
    neutral: 'text-[color:var(--text-heading)]',
    good: 'text-[color:var(--good)]',
    warning: 'text-[color:var(--warning)]',
    danger: 'text-[color:var(--danger)]',
  };

  return (
    <aside
      className="border-t border-[var(--border)] bg-[var(--surface)] p-4 xl:border-l xl:border-t-0"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)] text-[color:var(--primary-strong)]">
            선택 {meta.shortLabel}
          </p>
          <h3 className="mt-1 truncate text-[length:var(--font-size-section-title)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
            {location.name}
          </h3>
          <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            {location.region} · {locationDescription}
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--primary-soft)] text-[color:var(--primary-strong)]">
          <Icon icon={meta.icon} size={18} aria-hidden="true" />
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-1">
        {detailItems.map((item) => (
          <div
            key={item.label}
            className="flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface-subtle)] px-3 py-2"
          >
            <dt className="text-[length:var(--font-size-meta)] font-[var(--font-weight-medium)] text-[color:var(--text-muted)]">
              {item.label}
            </dt>
            <dd
              className={cn(
                'tabular-nums text-[length:var(--font-size-body)] font-[var(--font-weight-bold)]',
                toneClasses[item.tone],
              )}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
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
          위치를 선택하면 아래 상세 정보가 변경됩니다.
        </p>
      </div>

      <ul className="max-h-[420px] divide-y divide-[var(--border)] overflow-y-auto">
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function getInitialViewMode(centers, onlineSalesPoints) {
  if (centers.length > 0) return 'centers';
  if (onlineSalesPoints.length > 0) return 'online';
  return 'stores';
}

export function InventoryLocationOverview({ centers, onlineSalesPoints, stores }) {
  const [viewMode, setViewMode] = useState(() => getInitialViewMode(centers, onlineSalesPoints));
  const [activeLocationIds, setActiveLocationIds] = useState({
    centers: centers.find((center) => center.id === 'SMART_FOOD' || center.id === 'SEONGNAM')?.id ?? centers[0]?.id,
    online: onlineSalesPoints[0]?.id,
    stores: stores[0]?.id,
  });
  const locationGroups = { centers, online: onlineSalesPoints, stores };
  const locations = locationGroups[viewMode];
  const meta = viewMeta[viewMode];
  const activeLocation = locations.find((location) => location.id === activeLocationIds[viewMode]) ?? locations[0];
  const stockValues = locations.map((location) => location.availableStock);
  const minimumAvailableStock = stockValues.length > 0 ? Math.min(...stockValues) : 0;
  const maximumAvailableStock = stockValues.length > 0 ? Math.max(...stockValues) : 0;
  const totalAvailableStock = locations.reduce((sum, location) => sum + location.availableStock, 0);
  const totalNearExpiryStock = locations.reduce((sum, location) => sum + location.nearExpiryStock, 0);

  const handleLocationActivate = (locationId) => {
    setActiveLocationIds((current) => ({ ...current, [viewMode]: locationId }));
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
              미할당·온라인·오프라인 재고를 분리해 위험 위치를 빠르게 비교합니다.
            </CardDescription>
          </div>

          <div
            role="tablist"
            aria-label="재고 위치 유형"
            className="flex w-fit max-w-full flex-wrap gap-1 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] p-1"
          >
            {Object.entries(locationGroups).map(([mode, group]) => (
              <ViewModeButton
                key={mode}
                active={viewMode === mode}
                count={`${group.length}개`}
                disabled={group.length === 0}
                icon={viewMeta[mode].icon}
                label={viewMeta[mode].label}
                onClick={() => setViewMode(mode)}
              />
            ))}
          </div>
        </CardHeader>

        {activeLocation ? (
          <div className="grid xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="p-3 sm:p-4">
              {viewMode !== 'centers' ? (
                <MobileLocationList
                  activeLocationId={activeLocation.id}
                  locations={locations}
                  onActivate={handleLocationActivate}
                  viewMode={viewMode}
                />
              ) : null}

              <div
                className={cn(
                  'relative min-h-[430px] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-strong)] bg-[var(--surface-subtle)] sm:min-h-[500px]',
                  viewMode !== 'centers' && 'hidden sm:block',
                )}
                style={{
                  backgroundImage:
                    'linear-gradient(color-mix(in srgb, var(--border) 72%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--border) 72%, transparent) 1px, transparent 1px), radial-gradient(circle at 46% 42%, color-mix(in srgb,var(--primary-soft) 90%,white), transparent 48%)',
                  backgroundSize: '42px 42px, 42px 42px, 100% 100%',
                }}
              >
                <div className="absolute left-4 top-4 z-10 max-w-[90%] rounded-full border border-[var(--border)] bg-[color:var(--surface)] px-3 py-2 text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--text-body)] shadow-[var(--shadow-soft)]">
                  {meta.description} · {locations.length}개
                </div>

                <span className="absolute left-[10%] top-[18%] text-[length:var(--font-size-overline)] font-[var(--font-weight-bold)] tracking-[0.16em] text-[color:var(--text-muted)]">
                  {meta.regionLabels[0]}
                </span>
                <span className="absolute bottom-[15%] right-[10%] text-[length:var(--font-size-overline)] font-[var(--font-weight-bold)] tracking-[0.16em] text-[color:var(--text-muted)]">
                  {meta.regionLabels[1]}
                </span>
                <span className="absolute bottom-[10%] left-[21%] text-[length:var(--font-size-overline)] font-[var(--font-weight-bold)] tracking-[0.16em] text-[color:var(--text-muted)]">
                  {meta.regionLabels[2]}
                </span>

                <svg
                  aria-hidden="true"
                  className="absolute inset-0 size-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d={
                      viewMode === 'online'
                        ? 'M34 44 C45 32 55 68 66 56'
                        : 'M18 43 L24 24 L38 37 L49 20 L52 50 L70 37 L76 72 M52 50 L39 78'
                    }
                    fill="none"
                    stroke="var(--border-strong)"
                    strokeWidth="0.7"
                    strokeDasharray="3 3"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {locations.map((location) => {
                  const selected = location.id === activeLocation.id;
                  const markerSize = getHeatmapMarkerSize(
                    location.availableStock,
                    minimumAvailableStock,
                    maximumAvailableStock,
                    viewMode,
                  );
                  const tone = resolveLocationTone(location);

                  return (
                    <button
                      key={location.id}
                      type="button"
                      aria-label={`${location.name}, 판매 가능 재고 ${formatQuantity(location.availableStock)}, 소비기한 임박 ${formatQuantity(location.nearExpiryStock)}`}
                      aria-pressed={selected}
                      className={cn(
                        'group absolute z-[2] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-[transform,box-shadow] duration-[var(--motion-fast)] hover:z-10 hover:-translate-x-1/2 hover:-translate-y-1/2 hover:scale-110 focus-visible:z-10',
                        locationToneClasses[tone],
                        selected && 'ring-4 ring-[var(--surface)] outline outline-2 outline-[var(--primary-strong)]',
                      )}
                      style={{
                        left: `${location.x}%`,
                        top: `${location.y}%`,
                        width: markerSize,
                        height: markerSize,
                      }}
                      onMouseEnter={() => handleLocationActivate(location.id)}
                      onFocus={() => handleLocationActivate(location.id)}
                      onClick={() => handleLocationActivate(location.id)}
                    >
                      <span className="flex h-full flex-col items-center justify-center leading-none">
                        <strong
                          className={
                            viewMode === 'centers'
                              ? 'text-[length:var(--font-size-body-sm)]'
                              : 'text-[length:var(--font-size-meta)]'
                          }
                        >
                          {location.shortName}
                        </strong>
                        <span className="mt-1 text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)]">
                          {location.availableStock.toLocaleString('ko-KR')}
                        </span>
                      </span>
                      <span className="absolute -right-2 -top-2 inline-flex items-center gap-0.5 rounded-full border-2 border-[var(--surface)] bg-[var(--warning)] px-1.5 py-1 text-[length:var(--font-size-tiny)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)] shadow-[var(--shadow-soft)]">
                        <Icon icon={Warning} size={9} aria-hidden="true" />
                        {location.nearExpiryStock}
                      </span>
                    </button>
                  );
                })}

                <div className="absolute bottom-4 left-4 right-4 z-[1] flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-card)] border border-[var(--border)] bg-[color:var(--surface)] px-3 py-2.5 shadow-[var(--shadow-soft)]">
                  <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                    {meta.totalLabel}
                  </span>
                  <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                    판매 가능 {formatQuantity(totalAvailableStock)} · 임박 {formatQuantity(totalNearExpiryStock)}
                  </strong>
                </div>
              </div>
            </div>

            <LocationDetail location={activeLocation} viewMode={viewMode} />
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
