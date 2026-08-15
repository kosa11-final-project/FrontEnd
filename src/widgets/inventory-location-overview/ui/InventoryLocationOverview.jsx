import { useState } from 'react';
import { Building, Database, Warning } from 'reicon-react';
import { distributionCenters } from '@/entities/inventory';
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

function resolveCenterTone(center) {
  if (center.riskSkuCount >= 5 || center.nearExpiryStock >= 50) return 'danger';
  if (center.riskSkuCount >= 3 || center.nearExpiryStock >= 30) return 'warning';
  return 'good';
}

function getMarkerSize(availableStock, maxAvailableStock) {
  return Math.round(58 + (availableStock / maxAvailableStock) * 36);
}

function CenterDetail({ center }) {
  const detailItems = [
    { label: '현재고', value: formatQuantity(center.currentStock), tone: 'neutral' },
    { label: '판매 가능 재고', value: formatQuantity(center.availableStock), tone: 'good' },
    { label: '소비기한 임박', value: formatQuantity(center.nearExpiryStock), tone: 'warning' },
    { label: '출고 예정', value: formatQuantity(center.outboundStock), tone: 'neutral' },
    { label: '위험 SKU', value: formatQuantity(center.riskSkuCount), tone: 'danger' },
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
          <p className="text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)] text-[color:var(--text-label)]">
            선택 물류센터
          </p>
          <h3 className="mt-1 text-[length:var(--font-size-section-title)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
            {center.name}
          </h3>
          <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
            {center.region} · {center.description}
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] bg-[var(--primary-soft)] text-[color:var(--primary-strong)]">
          <Icon icon={Building} size={18} aria-hidden="true" />
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

export function InventoryLocationOverview({ centers = distributionCenters }) {
  const [activeCenterId, setActiveCenterId] = useState(
    centers.find((center) => center.id === 'SEONGNAM')?.id ?? centers[0]?.id,
  );
  const activeCenter = centers.find((center) => center.id === activeCenterId) ?? centers[0];
  const maxAvailableStock = Math.max(...centers.map((center) => center.availableStock), 1);
  const totalAvailableStock = centers.reduce((sum, center) => sum + center.availableStock, 0);
  const totalNearExpiryStock = centers.reduce((sum, center) => sum + center.nearExpiryStock, 0);

  if (!activeCenter) return null;

  return (
    <Card asChild padding="none" className="overflow-hidden shadow-[var(--shadow-soft)]">
      <section aria-labelledby="inventory-location-title">
        <CardHeader className="flex-row items-start justify-between gap-4 border-b border-[var(--border)] p-5">
          <div>
            <CardTitle id="inventory-location-title" className="flex items-center gap-2">
              <Icon icon={Database} size={18} className="text-[color:var(--primary)]" aria-hidden="true" />
              물류센터 재고 현황
            </CardTitle>
            <CardDescription className="mt-1">
              전국 8개 물류센터에 마우스를 올리거나 선택해 재고 상태를 확인합니다.
            </CardDescription>
          </div>
          <Badge variant="neutral" className="shrink-0">
            8개 센터
          </Badge>
        </CardHeader>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="p-4 sm:p-5">
            <div
              className="relative min-h-[480px] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-subtle)] sm:min-h-[540px]"
              style={{
                backgroundImage:
                  'linear-gradient(color-mix(in srgb, var(--border) 65%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--border) 65%, transparent) 1px, transparent 1px), radial-gradient(circle at 45% 35%, var(--primary-soft), transparent 42%)',
                backgroundSize: '48px 48px, 48px 48px, 100% 100%',
              }}
            >
              <div className="absolute left-4 top-4 z-10 max-w-[90%] rounded-[var(--radius-card)] border border-[var(--border)] bg-[color:var(--surface)] px-3 py-2 text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--text-body)] shadow-[var(--shadow-soft)]">
                원 크기는 판매 가능 재고, 주황 배지는 소비기한 임박 수량입니다.
              </div>

              <span className="absolute left-[10%] top-[17%] text-[length:var(--font-size-overline)] font-[var(--font-weight-bold)] tracking-[0.16em] text-[color:var(--text-muted)]">
                수도권
              </span>
              <span className="absolute bottom-[14%] right-[11%] text-[length:var(--font-size-overline)] font-[var(--font-weight-bold)] tracking-[0.16em] text-[color:var(--text-muted)]">
                영남권
              </span>
              <span className="absolute bottom-[9%] left-[22%] text-[length:var(--font-size-overline)] font-[var(--font-weight-bold)] tracking-[0.16em] text-[color:var(--text-muted)]">
                호남권
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

              {centers.map((center) => {
                const selected = center.id === activeCenter.id;
                const markerSize = getMarkerSize(center.availableStock, maxAvailableStock);
                const tone = resolveCenterTone(center);

                return (
                  <button
                    key={center.id}
                    type="button"
                    aria-label={`${center.name}, 판매 가능 재고 ${formatQuantity(center.availableStock)}, 소비기한 임박 ${formatQuantity(center.nearExpiryStock)}`}
                    aria-pressed={selected}
                    className={cn(
                      'group absolute z-[2] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-[transform,box-shadow] duration-[var(--motion-fast)] hover:z-10 hover:-translate-x-1/2 hover:-translate-y-1/2 hover:scale-105 focus-visible:z-10',
                      centerToneClasses[tone],
                      selected && 'ring-4 ring-[var(--surface)] outline outline-2 outline-[var(--primary-strong)]',
                    )}
                    style={{ left: `${center.x}%`, top: `${center.y}%`, width: markerSize, height: markerSize }}
                    onMouseEnter={() => setActiveCenterId(center.id)}
                    onFocus={() => setActiveCenterId(center.id)}
                    onClick={() => setActiveCenterId(center.id)}
                  >
                    <span className="flex h-full flex-col items-center justify-center leading-none">
                      <strong className="text-[length:var(--font-size-body-sm)]">{center.shortName}</strong>
                      <span className="mt-1 text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)]">
                        {center.availableStock.toLocaleString('ko-KR')}
                      </span>
                    </span>
                    <span className="absolute -right-2 -top-2 inline-flex items-center gap-0.5 rounded-full border-2 border-[var(--surface)] bg-[var(--warning)] px-1.5 py-1 text-[length:var(--font-size-tiny)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)] shadow-[var(--shadow-soft)]">
                      <Icon icon={Warning} size={9} aria-hidden="true" />
                      {center.nearExpiryStock}
                    </span>
                  </button>
                );
              })}

              <div className="absolute bottom-4 left-4 right-4 z-[1] flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-card)] border border-[var(--border)] bg-[color:var(--surface)] px-3 py-2.5 shadow-[var(--shadow-soft)]">
                <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                  전국 물류센터 합계
                </span>
                <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                  판매 가능 {formatQuantity(totalAvailableStock)} · 임박 {formatQuantity(totalNearExpiryStock)}
                </strong>
              </div>
            </div>
          </div>

          <CenterDetail center={activeCenter} />
        </div>
      </section>
    </Card>
  );
}
