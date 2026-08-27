import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'reicon-react';
import {
  EmptyPerformanceState,
  formatAchievementRateText,
  getCompletedActionCount,
  getStrategyExecution,
  isDisplayableStrategyNumber,
  StrategyActionCard,
  StrategyActionProgress,
  StrategyChannelPerformanceReport,
  StrategyDailySalesAreaChart,
  StrategyInventoryComparisonBarChart,
  StrategyInventoryTransferList,
  StrategyKpiGrid,
  StrategyProductImage,
  StrategyStatusBadge,
  StrategySyncStatus,
} from '@/entities/strategy';
import { Button, Card, Icon, StateView } from '@/shared/ui';

function Section({ title, description, children }) {
  return (
    <Card asChild padding="lg" className="shadow-[var(--shadow-soft)]">
      <section>
        <div className="mb-4">
          <h2 className="text-[length:var(--font-size-section-title)] font-bold text-[color:var(--text-heading)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">{description}</p>
          ) : null}
        </div>
        {children}
      </section>
    </Card>
  );
}

const valueOrMissing = (value, unit = '') =>
  value === null || value === undefined ? (
    <span className="text-[color:var(--text-muted)]">미수집</span>
  ) : (
    `${value.toLocaleString('ko-KR')}${unit}`
  );

export function StrategyExecutionDetailContent({ strategy }) {
  const names = Object.fromEntries(strategy.actions.map((action) => [action.id, action.title]));
  const completed = getCompletedActionCount(strategy.actions);
  const hasKnownActionStatus = strategy.actions.some((action) => action.status);
  const performanceKpis = strategy.performance
    ? [
        { label: '실제 판매량', value: strategy.performance.actualSalesQuantity, unit: '개' },
        { label: '실제 매출', value: strategy.performance.actualRevenue, unit: '원' },
        { label: '실제 기여이익', value: strategy.performance.actualContributionMargin, unit: '원' },
        { label: '실제 잔여재고', value: strategy.performance.actualRemainingQuantity, unit: '개' },
      ]
    : [];
  return (
    <main className="page-shell space-y-4" aria-labelledby="strategy-detail-title">
      <Button asChild variant="ghost" size="sm">
        <Link to="/execution">
          <Icon icon={ArrowLeft} size={16} aria-hidden="true" />
          실행 관제 목록
        </Link>
      </Button>
      <Card asChild padding="lg" className="shadow-[var(--shadow-panel)]">
        <header>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <StrategyProductImage
                src={strategy.product.imageUrl}
                alt={`${strategy.product.name} 상품 이미지`}
                size="lg"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StrategyStatusBadge status={strategy.status} />
                  {isDisplayableStrategyNumber(strategy.number) ? (
                    <span className="text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
                      {strategy.number}
                    </span>
                  ) : null}
                </div>
                <h1
                  id="strategy-detail-title"
                  className="mt-2 text-[length:var(--font-size-page-title)] font-bold tracking-[-0.04em] text-[color:var(--text-heading)]"
                >
                  {strategy.product.name}
                </h1>
                <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
                  {strategy.product.sku}
                </p>
              </div>
            </div>
            <StrategySyncStatus lastSyncedAt={strategy.lastSyncedAt} />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <p className="text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
                전략 목표
              </p>
              <p className="mt-1 text-[color:var(--text-heading)]">{strategy.goal ?? '미수집'}</p>
              <p className="mt-3 text-[length:var(--font-size-meta)] font-semibold text-[color:var(--text-muted)]">
                전체 결과
              </p>
              <p className="mt-1">{formatAchievementRateText(strategy.resultSummary) ?? '미수집'}</p>
            </div>
            <div className="rounded-[var(--radius-card)] bg-[var(--surface-subtle)] p-4">
              <p className="mb-2 text-[length:var(--font-size-body-sm)]">
                완료 액션{' '}
                <strong>{hasKnownActionStatus ? `${completed} / ${strategy.actions.length}` : '미수집'}</strong>
              </p>
              <StrategyActionProgress value={strategy.progress} label="전략 전체 진행률" />
            </div>
          </div>
        </header>
      </Card>
      <Section title="다중 전략 실행 흐름" description="번호 순서와 선행·병렬·조건부 관계를 함께 표시합니다.">
        {strategy.actions.length ? (
          <ol aria-label="실행 전략 카드 목록" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {strategy.actions.map((action, index) => (
              <li key={action.id} className="min-w-0">
                <StrategyActionCard action={action} index={index} actionNames={names} />
              </li>
            ))}
          </ol>
        ) : (
          <EmptyPerformanceState
            title="실행 액션이 없습니다."
            description="최종 선택 전략에 지원 액션이 등록되면 표시됩니다."
          />
        )}
      </Section>
      <Section
        title="판매처별 SKU 일일 판매량"
        description="전략 실행 이후 판매처에서 발생한 순판매량을 전략 수립일 기준 최대 90일까지 표시합니다."
      >
        <StrategyDailySalesAreaChart
          establishedAt={strategy.establishedAt}
          records={strategy.salesDaily}
          salesPointComparison={strategy.salesPointComparison}
        />
      </Section>
      <Section title="전략 전체 성과" description="동기화된 전략 성과 집계값을 표시합니다.">
        {performanceKpis.length ? (
          <StrategyKpiGrid kpis={performanceKpis} />
        ) : (
          <EmptyPerformanceState title="전략 전체 성과가 아직 수집되지 않았습니다." />
        )}
      </Section>
      <Section
        title="재고 이동 경로"
        description="전략 실행의 출발·도착 센터와 이동 수량을 표시하며, 대상 판매처는 보조 정보로 제공합니다."
      >
        {strategy.inventoryTransfers?.length ? (
          <StrategyInventoryTransferList transfers={strategy.inventoryTransfers} />
        ) : (
          <EmptyPerformanceState
            title="재고 이동 경로가 없습니다."
            description="최종 선택 전략에 재고 이동 액션이 등록되면 표시됩니다."
          />
        )}
      </Section>
      <div className="grid gap-4 2xl:grid-cols-2">
        <Section
          title="위치별 재고 변화"
          description="전략 시작 시점과 최근 재고 동기화 시점의 위치별 재고를 비교합니다. 안전재고는 읽기 전용 가드레일입니다."
        >
          {strategy.inventoryResults.length ? (
            <>
              <StrategyInventoryComparisonBarChart results={strategy.inventoryResults} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[length:var(--font-size-body-sm)]">
                  <thead className="border-b border-[var(--border)] text-[color:var(--text-muted)]">
                    <tr>
                      <th className="p-3">재고 위치</th>
                      <th className="p-3">전략 시작</th>
                      <th className="p-3">재고 증감</th>
                      <th className="p-3">현재 재고</th>
                      <th className="p-3">가드레일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategy.inventoryResults.map((row) => (
                      <tr
                        key={`${row.locationType ?? 'LOCATION'}-${row.locationId ?? row.location}`}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <th className="p-3 font-semibold text-[color:var(--text-heading)]">{row.location}</th>
                        <td className="p-3">{valueOrMissing(row.before, '개')}</td>
                        <td className="p-3">{valueOrMissing(row.moved, '개')}</td>
                        <td className="p-3">{valueOrMissing(row.after, '개')}</td>
                        <td className="p-3 text-[color:var(--text-muted)]">{row.guardrail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyPerformanceState title="비교할 위치별 재고가 아직 수집되지 않았습니다." />
          )}
        </Section>
        <Section title="채널별 판매 성과 리포트" description="채널 수와 수집된 성과에 맞는 분석 화면을 제공합니다.">
          {strategy.channelResults.length ? (
            <StrategyChannelPerformanceReport results={strategy.channelResults} actions={strategy.actions} />
          ) : (
            <EmptyPerformanceState
              title="채널 판매 성과가 없습니다."
              description="채널 액션 실행 및 성과 동기화 후 표시됩니다."
            />
          )}
        </Section>
      </div>
    </main>
  );
}

export default function ExecutionDetailPage() {
  const { strategyId } = useParams();
  const query = useQuery({
    queryKey: ['strategy-execution', strategyId],
    queryFn: ({ signal }) => getStrategyExecution(strategyId, signal),
  });
  if (query.isPending)
    return (
      <main className="page-shell">
        <StateView state="loading" title="전략 상세를 불러오고 있습니다." />
      </main>
    );
  if (query.isError)
    return (
      <main className="page-shell">
        <StateView
          state="error"
          title={
            query.error?.status === 404 ? '전략 실행 정보를 찾을 수 없습니다.' : '전략 상세를 불러오지 못했습니다.'
          }
          description={
            query.error?.status === 404
              ? '삭제되었거나 최종 선택되지 않은 전략일 수 있습니다.'
              : '서버 연결과 로그인 상태를 확인한 뒤 다시 시도해 주세요.'
          }
          actionLabel="다시 시도"
          onAction={() => query.refetch()}
        />
      </main>
    );
  return <StrategyExecutionDetailContent strategy={query.data} />;
}
