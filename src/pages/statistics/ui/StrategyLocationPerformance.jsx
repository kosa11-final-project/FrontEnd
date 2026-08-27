import { formatCurrency, formatPercent, formatQuantity } from '@/shared/lib/format';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';

const SCOPE_VIEW_META = Object.freeze({
  NATIONAL: {
    title: '운영 유형별 AI 전략 성과',
    ariaLabel: '운영 유형별 위험재고 감소율 비교 가로 막대 차트',
    description: '물류센터·오프라인 매장·온라인 판매처의 통합 성과를 비교합니다.',
    countLabel: '개 유형',
  },
  WAREHOUSE: {
    title: '물류센터별 AI 전략 성과',
    ariaLabel: '모든 물류센터 위험재고 감소율 비교 가로 막대 차트',
    description: '선택한 세부 위치와 관계없이 모든 물류센터의 성과를 비교합니다.',
    groupLabel: '물류센터',
    countLabel: '개 센터',
  },
  OFFLINE_STORE: {
    title: '오프라인 매장별 AI 전략 성과',
    ariaLabel: '모든 오프라인 매장 위험재고 감소율 비교 가로 막대 차트',
    description: '선택한 세부 위치와 관계없이 모든 오프라인 매장의 성과를 비교합니다.',
    groupLabel: '오프라인 매장',
    countLabel: '개 매장',
  },
  ONLINE_STORE: {
    title: '온라인 판매처별 AI 전략 성과',
    ariaLabel: '모든 온라인 판매처 위험재고 감소율 비교 가로 막대 차트',
    description: '선택한 세부 위치와 관계없이 모든 온라인 판매처의 성과를 비교합니다.',
    groupLabel: '온라인 판매처',
    countLabel: '개 판매처',
  },
});

export function StrategyLocationPerformance({
  locations = [],
  scopePerformance = [],
  scopeType = 'NATIONAL',
  selectedLocationId = 'ALL',
}) {
  const meta = SCOPE_VIEW_META[scopeType] ?? SCOPE_VIEW_META.NATIONAL;
  const selectedLocation = locations.find((location) => location.id === selectedLocationId);
  const description = selectedLocation
    ? `선택 위치는 ${selectedLocation.name}입니다. 같은 유형의 모든 ${meta.groupLabel} 성과를 함께 비교합니다.`
    : meta.description;
  const comparisonItems =
    scopeType === 'NATIONAL' ? scopePerformance : locations.filter((location) => location.scopeType === scopeType);
  const domainMax = Math.max(
    40,
    Math.ceil(Math.max(...comparisonItems.map((location) => location.riskStockReductionRate), 0) / 10) * 10,
  );

  return (
    <Card asChild padding="none" className="min-w-0 shadow-[var(--shadow-soft)]">
      <section aria-labelledby="strategy-location-performance-title">
        <CardHeader className="border-b border-[var(--border)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle id="strategy-location-performance-title">{meta.title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            <Badge variant="neutral">
              총 {comparisonItems.length}
              {meta.countLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-2" role="img" aria-label={meta.ariaLabel}>
            {comparisonItems.map((location) => {
              const isSelected = location.id === selectedLocationId;
              const barWidth = Math.max(4, (location.riskStockReductionRate / domainMax) * 100);

              return (
                <article
                  key={location.id}
                  className={`grid gap-3 rounded-[var(--radius-control)] border p-3 sm:grid-cols-[minmax(150px,0.8fr)_minmax(240px,2fr)_minmax(150px,0.75fr)] sm:items-center ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                      : 'border-[var(--border)] bg-[var(--card)]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <strong className="truncate text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                        {location.name}
                      </strong>
                      {isSelected ? (
                        <Badge variant="good" size="sm">
                          선택
                        </Badge>
                      ) : null}
                    </div>
                    <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                      완료 {formatQuantity(location.completedCount, { unit: '건' })} · 목표 달성률{' '}
                      {formatPercent(location.goalAchievementRate)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-1.5 flex items-center justify-between text-[length:var(--font-size-meta)]">
                      <span className="text-[color:var(--text-muted)]">위험재고 감소율</span>
                      <strong className="text-[color:var(--primary)]">
                        {formatPercent(location.riskStockReductionRate)}
                      </strong>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)]"
                        style={{ width: `${barWidth}%` }}
                        role="progressbar"
                        aria-label={`${location.name} 위험재고 감소율`}
                        aria-valuemin={0}
                        aria-valuemax={domainMax}
                        aria-valuenow={location.riskStockReductionRate}
                      />
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <strong className="block text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
                      {formatQuantity(location.riskStockReductionQty)} 감소
                    </strong>
                    <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
                      {formatCurrency(location.estimatedLossSavingsAmount)} 절감
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </CardContent>
      </section>
    </Card>
  );
}
