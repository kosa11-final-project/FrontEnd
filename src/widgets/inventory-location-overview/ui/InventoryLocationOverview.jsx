import { useState } from 'react';
import { Building, Database, Store, Warning } from 'reicon-react';
import { distributionCenters, offlineStoreInventories } from '@/entities/inventory';
import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/format';
import { Badge, Card, CardDescription, CardHeader, CardTitle, Icon } from '@/shared/ui';

const centerToneClasses = Object.freeze({
  danger:
    'border-[color:var(--danger)] bg-[var(--danger)] text-[color:var(--text-inverse)] shadow-[0_0_0_8px_color-mix(in_srgb,var(--danger)_14%,transparent)]',
  warning:
    'border-[color:var(--warning)] bg-[var(--warning)] text-[color:var(--text-heading)] shadow-[0_0_0_8px_color-mix(in_srgb,var(--warning)_18%,transparent)]',
  good: 'border-[color:var(--primary)] bg-[var(--primary)] text-[color:var(--text-inverse)] shadow-[0_0_0_8px_color-mix(in_srgb,var(--primary)_14%,transparent)]',
});

const storeShortNames = Object.freeze({
  DEPT_THEHYUNDAI_SEOUL: '더현대서울',
  DEPT_APGUJEONG: '압구정',
  DEPT_TRADE_CENTER: '무역',
  DEPT_CHEONHO: '천호',
  DEPT_SINCHON: '신촌',
  DEPT_MIA: '미아',
  DEPT_MOKDONG: '목동',
  DEPT_JUNGDONG: '중동',
  DEPT_KINTEX: '킨텍스',
  DEPT_PANGYO: '판교',
  DEPT_BUSAN: '부산',
  DEPT_DAEGU: '대구',
  DEPT_ULSAN: '울산',
  DEPT_CHUNGCHEONG: '충청',
  HMART_ASAN_HOSPITAL: 'Hmart',
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

function getMarkerSize(availableStock, maxAvailableStock, viewMode) {
  const minimumSize = viewMode === 'centers' ? 58 : 44;
  const sizeRange = viewMode === 'centers' ? 36 : 22;
  return Math.round(minimumSize + (availableStock / maxAvailableStock) * sizeRange);
}

function LocationDetail({ location, viewMode }) {
  const isCenterView = viewMode === 'centers';
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
      className="border-t border-[var(--border)] bg-[var(--surface)] p-5 xl:border-l xl:border-t-0"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)] text-[color:var(--primary-strong)]">
            선택 {isCenterView ? '물류센터' : '오프라인 매장'}
          </p>
          <h3 className="mt-1 text-[length:var(--font-size-section-title)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
            {location.name}
          </h3>
          <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
            {location.region} · {isCenterView ? location.description : '활성 오프라인 판매처'}
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--primary-soft)] text-[color:var(--primary-strong)]">
          <Icon icon={isCenterView ? Building : Store} size={18} aria-hidden="true" />
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-1">
        {detailItems.map((item) => (
          <div
            key={item.label}
            className="flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface-subtle)] px-3 py-2.5"
          >
            <dt className="text-[length:var(--font-size-body-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-muted)]">
              {item.label}
            </dt>
            <dd
              className={cn(
                'tabular-nums text-[length:var(--font-size-subtitle1)] font-[var(--font-weight-bold)]',
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

function ViewModeButton({ active, count, icon, label, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        'inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-control)] px-3 text-[length:var(--font-size-body-sm)] font-[var(--font-weight-bold)] transition-colors',
        active
          ? 'bg-[var(--primary-strong)] text-[color:var(--text-inverse)]'
          : 'text-[color:var(--text-body)] hover:bg-[var(--surface)]',
      )}
      onClick={onClick}
    >
      <Icon icon={icon} size={15} aria-hidden="true" />
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

function MobileStoreList({ activeStoreId, onActivate, stores }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] sm:hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3">
        <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
          활성 오프라인 매장 {stores.length}곳
        </strong>
        <p className="mt-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
          매장을 선택하면 아래 상세 정보가 변경됩니다.
        </p>
      </div>

      <ul className="max-h-[480px] divide-y divide-[var(--border)] overflow-y-auto">
        {stores.map((store) => {
          const selected = store.id === activeStoreId;
          const tone = resolveLocationTone(store);
          const statusLabel = tone === 'danger' ? '위험' : tone === 'warning' ? '주의' : '정상';

          return (
            <li key={store.id}>
              <button
                type="button"
                aria-pressed={selected}
                className={cn(
                  'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition-colors',
                  selected ? 'bg-[var(--primary-faint)]' : 'hover:bg-[var(--surface-subtle)]',
                )}
                onClick={() => onActivate(store.id)}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="truncate text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                      {store.name}
                    </strong>
                    <Badge variant={tone}>{statusLabel}</Badge>
                  </span>
                  <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                    {store.region} · 위험 SKU {formatQuantity(store.riskSkuCount)} · 임박{' '}
                    <strong className="text-[color:var(--warning)]">{formatQuantity(store.nearExpiryStock)}</strong>
                  </span>
                </span>

                <span className="text-right">
                  <span className="block text-[length:var(--font-size-tiny)] text-[color:var(--text-muted)]">
                    판매 가능
                  </span>
                  <strong className="mt-1 block tabular-nums text-[length:var(--font-size-body)] text-[color:var(--good)]">
                    {formatQuantity(store.availableStock)}
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

export function InventoryLocationOverview({ centers = distributionCenters, stores = offlineStoreInventories }) {
  const [viewMode, setViewMode] = useState('centers');
  const [activeLocationIds, setActiveLocationIds] = useState({
    centers: centers.find((center) => center.id === 'SEONGNAM')?.id ?? centers[0]?.id,
    stores: stores[0]?.id,
  });
  const locations = viewMode === 'centers' ? centers : stores;
  const activeLocation = locations.find((location) => location.id === activeLocationIds[viewMode]) ?? locations[0];
  const maxAvailableStock = Math.max(...locations.map((location) => location.availableStock), 1);
  const totalAvailableStock = locations.reduce((sum, location) => sum + location.availableStock, 0);
  const totalNearExpiryStock = locations.reduce((sum, location) => sum + location.nearExpiryStock, 0);
  const isCenterView = viewMode === 'centers';

  if (!activeLocation) return null;

  const handleLocationActivate = (locationId) => {
    setActiveLocationIds((current) => ({ ...current, [viewMode]: locationId }));
  };

  return (
    <Card asChild padding="none" className="overflow-hidden shadow-[var(--shadow-soft)]">
      <section aria-labelledby="inventory-location-title">
        <CardHeader className="flex-col gap-4 border-b border-[var(--border)] p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle id="inventory-location-title" className="flex items-center gap-2">
              <Icon icon={Database} size={18} className="text-[color:var(--primary)]" aria-hidden="true" />
              재고 위치별 현황
            </CardTitle>
            <CardDescription className="mt-1">
              물류센터와 활성 오프라인 매장을 전환해 판매 가능 재고와 소비기한 임박 수량을 확인합니다.
            </CardDescription>
          </div>

          <div
            role="tablist"
            aria-label="재고 위치 유형"
            className="flex w-fit max-w-full flex-wrap gap-1 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] p-1"
          >
            <ViewModeButton
              active={isCenterView}
              count={`${centers.length}개 센터`}
              icon={Database}
              label="물류센터 재고"
              onClick={() => setViewMode('centers')}
            />
            <ViewModeButton
              active={!isCenterView}
              count={`${stores.length}개 매장`}
              icon={Store}
              label="오프라인 매장 재고"
              onClick={() => setViewMode('stores')}
            />
          </div>
        </CardHeader>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="p-4 sm:p-5">
            {!isCenterView ? (
              <MobileStoreList activeStoreId={activeLocation.id} onActivate={handleLocationActivate} stores={stores} />
            ) : null}

            <div
              className={cn(
                'relative min-h-[520px] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-subtle)] sm:min-h-[580px]',
                !isCenterView && 'hidden sm:block',
              )}
              style={{
                backgroundImage:
                  'linear-gradient(color-mix(in srgb, var(--border) 65%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--border) 65%, transparent) 1px, transparent 1px), radial-gradient(circle at 45% 35%, var(--primary-soft), transparent 42%)',
                backgroundSize: '48px 48px, 48px 48px, 100% 100%',
              }}
            >
              <div className="absolute left-4 top-4 z-10 max-w-[90%] rounded-[var(--radius-card)] border border-[var(--border)] bg-[color:var(--surface)] px-3 py-2 text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--text-body)] shadow-[var(--shadow-soft)]">
                {isCenterView ? '전국 8개 물류센터' : '활성 오프라인 매장 15곳'}의 재고를 비교합니다.
              </div>

              <span className="absolute left-[10%] top-[17%] text-[length:var(--font-size-overline)] font-[var(--font-weight-bold)] tracking-[0.16em] text-[color:var(--text-muted)]">
                {isCenterView ? '수도권' : '서울·경기'}
              </span>
              <span className="absolute bottom-[14%] right-[11%] text-[length:var(--font-size-overline)] font-[var(--font-weight-bold)] tracking-[0.16em] text-[color:var(--text-muted)]">
                영남권
              </span>
              <span className="absolute bottom-[9%] left-[22%] text-[length:var(--font-size-overline)] font-[var(--font-weight-bold)] tracking-[0.16em] text-[color:var(--text-muted)]">
                {isCenterView ? '호남권' : '충청권'}
              </span>

              <svg
                aria-hidden="true"
                className="absolute inset-0 size-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M18 43 L24 24 L38 37 L49 20 L52 50 L70 37 L76 72 M52 50 L39 78"
                  fill="none"
                  stroke="var(--border-strong)"
                  strokeWidth="0.55"
                  strokeDasharray="2.5 2.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {locations.map((location) => {
                const selected = location.id === activeLocation.id;
                const markerSize = getMarkerSize(location.availableStock, maxAvailableStock, viewMode);
                const tone = resolveLocationTone(location);
                const shortName = isCenterView ? location.shortName : storeShortNames[location.id];

                return (
                  <button
                    key={location.id}
                    type="button"
                    aria-label={`${location.name}, 판매 가능 재고 ${formatQuantity(location.availableStock)}, 소비기한 임박 ${formatQuantity(location.nearExpiryStock)}`}
                    aria-pressed={selected}
                    className={cn(
                      'group absolute z-[2] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-[transform,box-shadow] duration-[var(--motion-fast)] hover:z-10 hover:-translate-x-1/2 hover:-translate-y-1/2 hover:scale-105 focus-visible:z-10',
                      centerToneClasses[tone],
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
                        className={cn(
                          isCenterView
                            ? 'text-[length:var(--font-size-body-sm)]'
                            : 'text-[length:var(--font-size-meta)]',
                        )}
                      >
                        {shortName}
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
                  {isCenterView ? '전국 물류센터 합계' : '활성 오프라인 매장 합계'}
                </span>
                <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                  판매 가능 {formatQuantity(totalAvailableStock)} · 임박 {formatQuantity(totalNearExpiryStock)}
                </strong>
              </div>
            </div>
          </div>

          <LocationDetail location={activeLocation} viewMode={viewMode} />
        </div>
      </section>
    </Card>
  );
}
