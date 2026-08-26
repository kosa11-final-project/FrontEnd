import { Link } from 'react-router-dom';
import { formatPercent, formatQuantity } from '@/shared/lib/format';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';
import { LOCATION_COMPARISON_SCOPES, STATISTICS_SCOPES, sortLocationsByRisk } from '../model/statisticsModel.js';

export function LocationComparisonCard({ locations, scopeType, onScopeTypeChange, getInventoryUrl }) {
  const rankedLocations = sortLocationsByRisk(locations, scopeType);
  const maxRatio = Math.max(...rankedLocations.map(({ criticalStockRatio }) => criticalStockRatio), 1);
  const scopeLabel = STATISTICS_SCOPES.find(({ value }) => value === scopeType)?.label ?? '위치';

  return (
    <Card asChild padding="none" className="min-w-0">
      <section aria-labelledby="location-comparison-title">
        <CardHeader className="border-b border-[var(--border)] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle id="location-comparison-title">위치별 위험재고 비교</CardTitle>
              <CardDescription className="mt-1">
                위험재고 비율이 높은 {scopeLabel}부터 확인합니다. 판매처 미할당 재고는 물류센터로 분류합니다.
              </CardDescription>
            </div>
            <div
              className="flex max-w-full gap-1 overflow-x-auto rounded-[var(--radius-control)] bg-[var(--surface-subtle)] p-1"
              aria-label="비교 위치 유형"
            >
              {LOCATION_COMPARISON_SCOPES.map((scope) => (
                <Button
                  key={scope.value}
                  type="button"
                  size="sm"
                  variant={scopeType === scope.value ? 'primary' : 'ghost'}
                  aria-pressed={scopeType === scope.value}
                  onClick={() => onScopeTypeChange(scope.value)}
                >
                  {scope.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="hidden grid-cols-[minmax(180px,1.1fr)_minmax(200px,1.6fr)_110px_130px_80px] gap-4 border-b border-[var(--border)] pb-2 text-[length:var(--font-size-meta)] font-[var(--font-weight-semibold)] text-[color:var(--text-muted)] md:grid">
            <span>위치</span>
            <span>위험재고 비율</span>
            <span className="text-right">위험 SKU</span>
            <span className="text-right">위험재고</span>
            <span className="text-right">비율</span>
          </div>

          <ol className="divide-y divide-[var(--border)]">
            {rankedLocations.map((location, index) => {
              const inventoryUrl = getInventoryUrl?.(location) ?? null;
              const Row = inventoryUrl ? Link : 'div';

              return (
                <li key={location.id}>
                  <Row
                    {...(inventoryUrl
                      ? {
                          to: inventoryUrl,
                          'aria-label': `${location.name} 위험재고 통합 재고에서 보기`,
                        }
                      : {})}
                    className={`grid gap-3 rounded-[var(--radius-control)] px-2 py-4 md:grid-cols-[minmax(180px,1.1fr)_minmax(200px,1.6fr)_110px_130px_80px] md:items-center md:gap-4 ${
                      inventoryUrl
                        ? 'transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]'
                        : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--danger-soft)] text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)] text-[color:var(--danger)]">
                          {index + 1}
                        </span>
                        <strong className="truncate text-[length:var(--font-size-body)] text-[color:var(--text-heading)]">
                          {location.name}
                        </strong>
                      </div>
                      <div className="mt-1 flex items-center gap-2 pl-8">
                        <Badge variant="outline" size="sm">
                          {location.region}
                        </Badge>
                        <span className="truncate text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                          전체 {formatQuantity(location.totalStockQty)}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                        <div
                          className="h-full rounded-full bg-[var(--danger)]"
                          style={{ width: `${Math.max(3, (location.criticalStockRatio / maxRatio) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <dl className="grid grid-cols-3 gap-3 md:contents">
                      <div className="md:text-right">
                        <dt className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)] md:sr-only">
                          위험 SKU
                        </dt>
                        <dd className="m-0 mt-1 font-[var(--font-weight-semibold)] text-[color:var(--danger)] md:mt-0">
                          {formatQuantity(location.criticalSkuCount)}
                        </dd>
                      </div>
                      <div className="md:text-right">
                        <dt className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)] md:sr-only">
                          위험재고
                        </dt>
                        <dd className="m-0 mt-1 font-[var(--font-weight-semibold)] text-[color:var(--text-heading)] md:mt-0">
                          {formatQuantity(location.criticalStockQty)}
                        </dd>
                      </div>
                      <div className="md:text-right">
                        <dt className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)] md:sr-only">
                          비율
                        </dt>
                        <dd className="m-0 mt-1 font-[var(--font-weight-bold)] text-[color:var(--danger)] md:mt-0">
                          {formatPercent(location.criticalStockRatio)}
                          {inventoryUrl ? (
                            <span className="ml-1 text-[color:var(--primary)]" aria-hidden="true">
                              →
                            </span>
                          ) : null}
                        </dd>
                      </div>
                    </dl>
                  </Row>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </section>
    </Card>
  );
}
