import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'reicon-react';
import { getUrgentSkuInventoryUrl, InventoryRiskBadge } from '@/entities/inventory';
import { formatDaysRemaining, formatQuantity } from '@/shared/lib/format';
import { Card, CardDescription, CardHeader, CardTitle, Icon, StateView } from '@/shared/ui';

function CompactUrgentSkuList({ skus }) {
  return (
    <Card asChild padding="none" className="h-full min-w-0 overflow-hidden shadow-[var(--shadow-soft)]">
      <section className="flex h-full min-h-0 flex-col" aria-labelledby="urgent-skus-title">
        <CardHeader className="shrink-0 border-b border-[var(--border)] p-4">
          <CardTitle id="urgent-skus-title" className="flex items-center gap-2 text-[17px]">
            <Icon icon={AlertTriangle} size={18} className="text-[color:var(--danger)]" aria-hidden="true" />
            긴급 처리 SKU TOP 5
          </CardTitle>
          <CardDescription className="text-[13px] text-[color:var(--text-body)]">
            위험등급·예상 폐기수량 기준 우선 조치
          </CardDescription>
        </CardHeader>

        {skus.length === 0 ? (
          <StateView state="empty" compact title="긴급 처리 대상 SKU가 없습니다." className="m-4" />
        ) : (
          <>
            <ol className="dashboard-scrollbar min-h-0 flex-1 divide-y divide-[var(--border)] overflow-y-auto px-4 pr-2">
              {skus.map((sku) => (
                <li key={sku.id}>
                  <Link
                    to={getUrgentSkuInventoryUrl(sku)}
                    aria-label={`${sku.name} 재고 상세`}
                    className="-mx-2 grid grid-cols-[30px_minmax(0,1fr)_34px] items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-2.5 transition-colors hover:bg-[var(--surface-subtle)]"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-[var(--danger-soft)] text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)] text-[color:var(--danger)]">
                      {sku.rank}
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
                        {sku.name}
                      </strong>
                      <span className="mt-1 block truncate text-[length:var(--font-size-meta)] text-[color:var(--text-body)]">
                        {sku.stockLocation} · 소비기한{' '}
                        <strong className="text-[color:var(--warning)]">{formatDaysRemaining(sku.expiryDays)}</strong> ·
                        폐기{' '}
                        <strong className="text-[color:var(--danger)]">{formatQuantity(sku.expectedDisposal)}</strong>
                      </span>
                    </span>
                    <span className="grid size-8 place-items-center rounded-full text-[color:var(--primary-strong)]">
                      <Icon icon={ArrowRight} size={16} aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <p className="shrink-0 border-t border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-center text-[length:var(--font-size-meta)] text-[color:var(--text-body)]">
              목록 안에서 스크롤해 전체 {skus.length}개 SKU를 확인할 수 있습니다.
            </p>
          </>
        )}
      </section>
    </Card>
  );
}

export function UrgentSkuList({ compact = false, skus }) {
  if (compact) return <CompactUrgentSkuList skus={skus} />;

  return (
    <Card asChild padding="none" className="min-w-0 overflow-hidden shadow-[var(--shadow-soft)]">
      <section aria-labelledby="urgent-skus-title">
        <CardHeader className="border-b border-[var(--border)] p-5">
          <CardTitle id="urgent-skus-title" className="flex items-center gap-2">
            <Icon icon={AlertTriangle} size={18} className="text-[color:var(--danger)]" aria-hidden="true" />
            긴급 처리 SKU TOP 5
          </CardTitle>
          <CardDescription>예상 폐기수량과 소비기한을 함께 고려해 우선 조치 대상을 표시합니다.</CardDescription>
        </CardHeader>

        {skus.length === 0 ? (
          <StateView
            state="empty"
            compact
            title="긴급 처리 대상 SKU가 없습니다."
            description="현재 즉시 조치가 필요한 위험 SKU가 없습니다."
            className="m-5"
          />
        ) : (
          <ol className="divide-y divide-[var(--border)] px-5">
            {skus.map((sku) => (
              <li key={sku.id} className="py-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--danger-soft)] text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)] text-[color:var(--danger)]">
                    {sku.rank}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                            {sku.name}
                          </strong>
                          <InventoryRiskBadge level="위험" />
                        </div>
                        <p className="mt-1 font-mono text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                          {sku.code}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                          예상 폐기
                        </span>
                        <strong className="text-[length:var(--font-size-subtitle1)] text-[color:var(--danger)]">
                          {formatQuantity(sku.expectedDisposal)}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                      <span>
                        소비기한{' '}
                        <strong className="text-[color:var(--warning)]">{formatDaysRemaining(sku.expiryDays)}</strong>
                      </span>
                      <span>
                        재고 위치 <strong className="text-[color:var(--text-body)]">{sku.stockLocation}</strong>
                      </span>
                      {sku.saleStopDays !== null && sku.saleStopDays !== undefined ? (
                        <span>
                          판매중지{' '}
                          <strong className="text-[color:var(--danger)]">
                            {formatDaysRemaining(sku.saleStopDays)}
                          </strong>
                        </span>
                      ) : null}
                      <span>
                        유형 <strong className="text-[color:var(--text-body)]">{sku.issue}</strong>
                      </span>
                    </div>

                    <div className="mt-2 flex justify-end">
                      <Link
                        to={getUrgentSkuInventoryUrl(sku)}
                        className="inline-flex items-center gap-1 text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)] text-[color:var(--primary-strong)] hover:underline"
                      >
                        재고 상세
                        <Icon icon={ArrowRight} size={13} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </Card>
  );
}
