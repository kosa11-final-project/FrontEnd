import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartBar } from 'reicon-react';
import { inventoryStatisticsQueryOptions } from '@/entities/statistics';
import { formatDateTime } from '@/shared/lib/format';
import { Badge, Card, Icon, StateView, Tabs, TabsList, TabsTrigger } from '@/shared/ui';
import { getStatisticsInventoryUrl } from './model/statisticsLinks.js';
import {
  buildStatisticsQueryParams,
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

export function StatisticsPageContent({ statistics, isRefreshing = false, onQueryParamsChange }) {
  const [activeTab, setActiveTab] = useState('inventory');
  const [period, setPeriod] = useState('30D');
  const [customRange, setCustomRange] = useState(() => getStatisticsPeriodRange('30D', statistics.asOfDate));
  const [scopeType, setScopeType] = useState('NATIONAL');
  const [locationId, setLocationId] = useState('ALL');
  const [comparisonScope, setComparisonScope] = useState('WAREHOUSE');

  const range = getStatisticsPeriodRange(period, statistics.asOfDate, customRange);
  const granularity = getStatisticsGranularity(range);
  const locationOptions = getScopeLocations(statistics.locations, scopeType);
  const summary = getSelectedStatisticsSummary(statistics, scopeType, locationId);
  const selectedTrend = selectStatisticsTrend(statistics.dailyTrend, range);
  const selectedScopeCode = scopeType === 'UNASSIGNED' ? 'UNASSIGNED' : locationId;
  const usesServerTrend = Boolean(statistics.trendScopeType);
  const serverTrendMatchesSelection =
    statistics.trendScopeType === scopeType && statistics.trendScopeCode === selectedScopeCode;
  const trend = usesServerTrend
    ? serverTrendMatchesSelection
      ? selectedTrend
      : []
    : scaleStatisticsTrend(selectedTrend, summary, statistics.scopeSummaries.NATIONAL);
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

  function requestStatistics(nextPeriod, nextCustomRange, nextScopeType, nextLocationId) {
    const nextRange = getStatisticsPeriodRange(nextPeriod, statistics.asOfDate, nextCustomRange);
    onQueryParamsChange?.(
      buildStatisticsQueryParams({
        range: nextRange,
        scopeType: nextScopeType,
        locationId: nextLocationId,
      }),
    );
  }

  function changePeriod(nextPeriod) {
    setPeriod(nextPeriod);
    requestStatistics(nextPeriod, customRange, scopeType, locationId);
  }

  function changeCustomRange(nextRange) {
    setCustomRange(nextRange);
    setPeriod('CUSTOM');
    requestStatistics('CUSTOM', nextRange, scopeType, locationId);
  }

  function changeScopeType(nextScopeType) {
    setScopeType(nextScopeType);
    setLocationId('ALL');
    if (nextScopeType !== 'NATIONAL') setComparisonScope(nextScopeType);
    requestStatistics(period, customRange, nextScopeType, 'ALL');
  }

  function changeLocation(nextLocationId) {
    setLocationId(nextLocationId);
    requestStatistics(period, customRange, scopeType, nextLocationId);
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
              <div className="space-y-4" aria-busy={isRefreshing}>
                {isRefreshing ? (
                  <p className="sr-only" role="status">
                    통계 데이터를 갱신하고 있습니다.
                  </p>
                ) : null}
                <StatisticsFilters
                  period={period}
                  range={range}
                  granularity={granularity}
                  scopeType={scopeType}
                  locationId={locationId}
                  locationOptions={locationOptions}
                  onPeriodChange={changePeriod}
                  onCustomRangeChange={changeCustomRange}
                  onScopeTypeChange={changeScopeType}
                  onLocationChange={changeLocation}
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

export default function StatisticsPage() {
  const [queryParams, setQueryParams] = useState({});
  const statisticsQuery = useQuery(inventoryStatisticsQueryOptions(queryParams));

  if (statisticsQuery.isPending) {
    return (
      <StatisticsPageShell>
        <StateView
          state="loading"
          title="재고 통계를 불러오고 있습니다."
          description="최근 정상 집계와 위험재고 추이를 확인하는 중입니다."
        />
      </StatisticsPageShell>
    );
  }

  if (statisticsQuery.isError) {
    const snapshotNotReady = statisticsQuery.error?.code === 'STATISTICS-001';
    const forbidden = statisticsQuery.error?.status === 403;

    return (
      <StatisticsPageShell>
        <StateView
          state={forbidden ? 'forbidden' : snapshotNotReady ? 'empty' : 'error'}
          title={snapshotNotReady ? '아직 생성된 재고 통계가 없습니다.' : undefined}
          description={snapshotNotReady ? '재고 동기화와 위험등급 산정이 완료된 후 다시 확인해 주세요.' : undefined}
          actionLabel={forbidden ? undefined : '다시 시도'}
          onAction={forbidden ? undefined : () => statisticsQuery.refetch()}
        />
      </StatisticsPageShell>
    );
  }

  if (!statisticsQuery.data?.scopeSummaries?.NATIONAL) {
    return (
      <StatisticsPageShell calculatedAt={statisticsQuery.data?.calculatedAt}>
        <StateView
          state="empty"
          title="표시할 재고 통계가 없습니다."
          description="전국 범위의 정상 집계 결과가 생성되었는지 확인해 주세요."
          actionLabel="다시 시도"
          onAction={() => statisticsQuery.refetch()}
        />
      </StatisticsPageShell>
    );
  }

  return (
    <StatisticsPageContent
      statistics={statisticsQuery.data}
      isRefreshing={statisticsQuery.isFetching}
      onQueryParamsChange={setQueryParams}
    />
  );
}
