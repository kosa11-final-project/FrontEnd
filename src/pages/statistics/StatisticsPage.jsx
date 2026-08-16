import { useState } from 'react';
import { ChartBar } from 'reicon-react';
import { formatDateTime } from '@/shared/lib/format';
import { Badge, Card, Icon, StateView, Tabs, TabsList, TabsTrigger } from '@/shared/ui';
import { inventoryStatisticsFixture } from './model/statisticsFixtures.js';
import { getStatisticsInventoryUrl } from './model/statisticsLinks.js';
import {
  getScopeLocations,
  getSelectedStatisticsSummary,
  getStatisticsGranularity,
  getStatisticsPeriodRange,
  scaleStatisticsTrend,
  selectStatisticsTrend,
} from './model/statisticsModel.js';
import { InventoryStatisticsSummary } from './ui/InventoryStatisticsSummary.jsx';
import { LocationComparisonCard } from './ui/LocationComparisonCard.jsx';
import { RiskDistributionCard } from './ui/RiskDistributionCard.jsx';
import { RiskTrendCard } from './ui/RiskTrendCard.jsx';
import { StatisticsFilters } from './ui/StatisticsFilters.jsx';
import { StatisticsDataQualityNotice } from './ui/StatisticsDataQualityNotice.jsx';

export function StatisticsPageShell({ calculatedAt, children }) {
  return (
    <main className="page-shell" aria-labelledby="statistics-page-title">
      <Card asChild padding="lg" className="mb-6 shadow-[var(--shadow-soft)]">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-card)] bg-[var(--primary-soft)] text-[color:var(--primary-strong)]">
              <Icon icon={ChartBar} size={22} aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  id="statistics-page-title"
                  className="m-0 text-[length:var(--font-size-page-title)] font-[var(--font-weight-headline1)] leading-[var(--line-height-heading)] tracking-[-0.05em] text-[color:var(--text-heading)]"
                >
                  운영 통계
                </h1>
                <Badge variant="good">동기화 기준 집계</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-[length:var(--font-size-body)] text-[color:var(--text-muted)]">
                재고 위험 수준과 위치별 변화를 비교하고 조치가 필요한 영역을 확인합니다.
              </p>
            </div>
          </div>

          {calculatedAt ? (
            <div className="shrink-0 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
              마지막 정상 집계
              <strong className="ml-2 text-[color:var(--text-heading)]">{formatDateTime(calculatedAt)}</strong>
            </div>
          ) : null}
        </section>
      </Card>
      {children}
    </main>
  );
}

export function StatisticsPageContent({ statistics }) {
  const [activeTab, setActiveTab] = useState('inventory');
  const [period, setPeriod] = useState('30D');
  const [customRange, setCustomRange] = useState({ from: '2026-07-18', to: statistics.asOfDate });
  const [scopeType, setScopeType] = useState('NATIONAL');
  const [locationId, setLocationId] = useState('ALL');
  const [comparisonScope, setComparisonScope] = useState('WAREHOUSE');

  const range = getStatisticsPeriodRange(period, statistics.asOfDate, customRange);
  const granularity = getStatisticsGranularity(range);
  const locationOptions = getScopeLocations(statistics.locations, scopeType);
  const summary = getSelectedStatisticsSummary(statistics, scopeType, locationId);
  const selectedTrend = selectStatisticsTrend(statistics.dailyTrend, range);
  const trend = scaleStatisticsTrend(selectedTrend, summary, statistics.scopeSummaries.NATIONAL);
  const inventoryLinkContext = {
    scopeType,
    locationId,
    locations: statistics.locations,
  };
  const inventoryUrl = getStatisticsInventoryUrl(inventoryLinkContext);
  const riskInventoryUrl = getStatisticsInventoryUrl({ ...inventoryLinkContext, riskGrade: 'CRITICAL' });
  const unassessedInventoryUrl = getStatisticsInventoryUrl({
    ...inventoryLinkContext,
    assessmentStatus: 'UNASSESSED',
  });

  function changeScopeType(nextScopeType) {
    setScopeType(nextScopeType);
    setLocationId('ALL');
    if (nextScopeType !== 'NATIONAL') setComparisonScope(nextScopeType);
  }

  return (
    <StatisticsPageShell calculatedAt={statistics.calculatedAt}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        {({ value, setValue }) => (
          <>
            <Card padding="sm">
              <TabsList aria-label="통계 유형" size="lg">
                <TabsTrigger value="inventory" activeValue={value} onSelect={setValue} size="lg">
                  재고 통계
                </TabsTrigger>
                <TabsTrigger value="strategy" activeValue={value} onSelect={setValue} size="lg">
                  AI 전략 통계
                </TabsTrigger>
              </TabsList>
            </Card>

            {value === 'inventory' ? (
              <div className="space-y-4">
                <StatisticsFilters
                  period={period}
                  range={range}
                  granularity={granularity}
                  scopeType={scopeType}
                  locationId={locationId}
                  locationOptions={locationOptions}
                  onPeriodChange={setPeriod}
                  onCustomRangeChange={(nextRange) => {
                    setCustomRange(nextRange);
                    setPeriod('CUSTOM');
                  }}
                  onScopeTypeChange={changeScopeType}
                  onLocationChange={setLocationId}
                />

                <InventoryStatisticsSummary
                  summary={summary}
                  canViewFinancials={statistics.canViewFinancials}
                  inventoryUrl={inventoryUrl}
                  riskInventoryUrl={riskInventoryUrl}
                />

                <StatisticsDataQualityNotice summary={summary} unassessedInventoryUrl={unassessedInventoryUrl} />

                <section className="grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.6fr)]">
                  <RiskDistributionCard
                    distribution={summary.riskDistribution}
                    getInventoryUrl={(riskGrade) =>
                      riskGrade === 'UNASSESSED'
                        ? unassessedInventoryUrl
                        : getStatisticsInventoryUrl({ ...inventoryLinkContext, riskGrade })
                    }
                  />
                  <RiskTrendCard trend={trend} />
                </section>

                <LocationComparisonCard
                  locations={statistics.locations}
                  scopeType={comparisonScope}
                  onScopeTypeChange={setComparisonScope}
                  getInventoryUrl={(location) =>
                    getStatisticsInventoryUrl({
                      scopeType: location.scopeType,
                      locationId: location.id,
                      locations: statistics.locations,
                      riskGrade: 'CRITICAL',
                    })
                  }
                />
              </div>
            ) : (
              <StateView
                state="empty"
                title="AI 전략 통계는 지표를 설계하고 있습니다."
                description="재고 통계 UI와 API 기준을 확정한 뒤 전략 목표·실적 지표를 연결할 예정입니다."
              />
            )}
          </>
        )}
      </Tabs>
    </StatisticsPageShell>
  );
}

// 실제 통계 API가 확정되기 전까지 페이지 전용 결정적 fixture로 UI를 검증합니다.
export default function StatisticsPage() {
  return <StatisticsPageContent statistics={inventoryStatisticsFixture} />;
}
