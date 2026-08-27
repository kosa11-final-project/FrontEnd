import { Activity, AlertCircle, Layers, Target } from 'reicon-react';
import { formatNumber } from '@/shared/lib/format';
import { MetricCard } from '@/shared/ui';

function formatSummaryCount(value) {
  return Number.isInteger(value) && value >= 0 ? `${formatNumber(value)}건` : '미수집';
}

export function StrategyExecutionSummary({ summary }) {
  return (
    <section aria-label="전략 실행 요약" className="grid grid-cols-2 gap-2 xl:grid-cols-4">
      <MetricCard
        label="실행 전략 수"
        value={formatSummaryCount(summary?.executionStrategyCount)}
        helper="대기 제외"
        icon={Target}
        tone="neutral"
        compact
      />
      <MetricCard
        label="진행 중 전략 수"
        value={formatSummaryCount(summary?.inProgressStrategyCount)}
        helper="실행 중"
        icon={Activity}
        tone="info"
        compact
      />
      <MetricCard
        label="확인 필요 전략 수"
        value={formatSummaryCount(summary?.attentionStrategyCount)}
        helper="부분 실행 결과"
        icon={AlertCircle}
        tone="warning"
        compact
      />
      <MetricCard
        label="전체 전략 수"
        value={formatSummaryCount(summary?.totalStrategyCount)}
        helper="검색 조건 기준"
        icon={Layers}
        tone="neutral"
        compact
      />
    </section>
  );
}
