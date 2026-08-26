import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryStatisticsQueryOptions, strategyStatisticsQueryOptions } from '@/entities/statistics';
import { Badge, StateView, Tabs, TabsList, TabsTrigger } from '@/shared/ui';
import { strategyStatisticsFixture } from './model/strategyStatisticsFixtures.js';
import { buildStrategyStatisticsView } from './model/strategyStatisticsModel.js';
import {
  buildStatisticsQueryParams,
  getScopeLocations,
  getSelectedStatisticsSummary,
  getStatisticsPeriodRange,
  scaleStatisticsTrend,
  selectStatisticsTrend,
} from './model/statisticsModel.js';
import { InventoryStatisticsSummary } from './ui/InventoryStatisticsSummary.jsx';
import { InventoryRiskCompositionCard } from './ui/InventoryRiskCompositionCard.jsx';
import { RiskTrendCard } from './ui/RiskTrendCard.jsx';
import { StatisticsFilters } from './ui/StatisticsFilters.jsx';
import { StrategyStatisticsPanel } from './ui/StrategyStatisticsPanel.jsx';
import { StatisticsSkeleton } from './ui/StatisticsSkeleton.jsx';

export function StatisticsPageShell({ children }) {
  return (
    <main className="page-shell" aria-labelledby="statistics-page-title">
      <h1 id="statistics-page-title" className="sr-only">
        운영 성과 통계
      </h1>
      {children}
    </main>
  );
}

export function StatisticsPageContent({
  statistics,
  strategyStatistics,
  strategyState = 'success',
  isRefreshing = false,
  onQueryParamsChange,
  onRetryStrategy,
}) {
  const [activeTab, setActiveTab] = useState('strategy');
  const [period, setPeriod] = useState('30D');
  const [customRange, setCustomRange] = useState(() => getStatisticsPeriodRange('30D', statistics.asOfDate));
  const [scopeType, setScopeType] = useState('NATIONAL');
  const [locationId, setLocationId] = useState('ALL');

  const range = getStatisticsPeriodRange(period, statistics.asOfDate, customRange);
  const locationOptions = getScopeLocations(statistics.locations, scopeType);
  const summary = getSelectedStatisticsSummary(statistics, scopeType, locationId);
  const strategyView = strategyStatistics
    ? {
        range,
        current: strategyStatistics.summary,
        trend: strategyStatistics.dailyTrend,
        actionCombinationBreakdown: strategyStatistics.actionCombinationBreakdown,
      }
    : buildStrategyStatisticsView(strategyStatisticsFixture, range, scopeType);
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
  const selectedLocation = locationOptions.find((location) => location.id === locationId);
  const scopeName =
    selectedLocation?.name ??
    {
      NATIONAL: '전체',
      WAREHOUSE: '전체 물류센터',
      OFFLINE_STORE: '전체 오프라인 매장',
      ONLINE_STORE: '전체 온라인 판매처',
      UNASSIGNED: '공용 미할당 재고',
    }[scopeType];

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
    requestStatistics(period, customRange, nextScopeType, 'ALL');
  }

  function changeLocation(nextLocationId) {
    setLocationId(nextLocationId);
    requestStatistics(period, customRange, scopeType, nextLocationId);
  }

  return (
    <StatisticsPageShell>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        {({ value, setValue }) => (
          <>
            <div className="flex items-center justify-between border-b border-[var(--border)]">
              <TabsList aria-label="통계 유형" size="lg" className="h-12 gap-6">
                <TabsTrigger value="strategy" activeValue={value} onSelect={setValue} size="lg" className="h-12 px-1">
                  AI 전략 성과
                </TabsTrigger>
                <TabsTrigger value="inventory" activeValue={value} onSelect={setValue} size="lg" className="h-12 px-1">
                  위험재고 추이
                </TabsTrigger>
              </TabsList>
              {value === 'strategy' ? (
                <div className="flex items-center gap-2">
                  <Badge variant="good">종료 전략 기준</Badge>
                </div>
              ) : null}
            </div>

            <StatisticsFilters
              period={period}
              range={range}
              scopeType={scopeType}
              locationId={locationId}
              locationOptions={locationOptions}
              maxDate={statistics.asOfDate}
              onPeriodChange={changePeriod}
              onCustomRangeChange={changeCustomRange}
              onScopeTypeChange={changeScopeType}
              onLocationChange={changeLocation}
            />

            {value === 'inventory' ? (
              <div className="space-y-4" aria-busy={isRefreshing}>
                {isRefreshing ? (
                  <p className="sr-only" role="status">
                    통계 데이터를 갱신하고 있습니다.
                  </p>
                ) : null}
                {trend.length >= 2 ? (
                  <>
                    <InventoryStatisticsSummary trend={trend} scopeName={scopeName} />
                    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
                      <RiskTrendCard trend={trend} scopeName={scopeName} />
                      <InventoryRiskCompositionCard trend={trend} />
                    </div>
                  </>
                ) : (
                  <StateView
                    state="empty"
                    title="위험재고 변화를 비교할 집계가 부족합니다."
                    description="선택 기간에는 정상 스냅샷이 2개 이상 필요합니다. 기간이나 위치를 변경해 주세요."
                  />
                )}
              </div>
            ) : strategyState === 'success' ? (
              <StrategyStatisticsPanel view={strategyView} isPreview={!strategyStatistics} />
            ) : (
              <StateView
                state={strategyState}
                title={strategyState === 'empty' ? '조회 기간에 종료된 AI 전략이 없습니다.' : undefined}
                description={
                  strategyState === 'empty'
                    ? '기간이나 위치를 변경하거나 전략 실행 결과 확정 여부를 확인해 주세요.'
                    : undefined
                }
                actionLabel={strategyState === 'error' ? '다시 시도' : undefined}
                onAction={strategyState === 'error' ? onRetryStrategy : undefined}
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
  const strategyQuery = useQuery(strategyStatisticsQueryOptions(queryParams));

  if (statisticsQuery.isPending) {
    return (
      <StatisticsPageShell>
        <StatisticsSkeleton />
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
      <StatisticsPageShell>
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

  const strategyState = strategyQuery.isPending
    ? 'loading'
    : strategyQuery.isError
      ? strategyQuery.error?.status === 403
        ? 'forbidden'
        : 'error'
      : strategyQuery.data?.summary?.completedCount > 0
        ? 'success'
        : 'empty';

  return (
    <StatisticsPageContent
      statistics={statisticsQuery.data}
      strategyStatistics={strategyQuery.data}
      strategyState={strategyState}
      isRefreshing={statisticsQuery.isFetching || strategyQuery.isFetching}
      onQueryParamsChange={setQueryParams}
      onRetryStrategy={() => strategyQuery.refetch()}
    />
  );
}
