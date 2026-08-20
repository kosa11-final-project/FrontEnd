import { Activity, AlertCircle, Layers, Target } from 'reicon-react';
import { getExecutionSummary } from '@/entities/strategy';
import { MetricCard } from '@/shared/ui';

export function StrategyExecutionSummary({ strategies }) {
  const summary = getExecutionSummary(strategies);
  return (
    <section aria-label="전략 실행 요약" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MetricCard
        label="실행 전략 수"
        value={`${summary.strategyCount}건`}
        helper="대기 제외"
        icon={Target}
        tone="neutral"
      />
      <MetricCard
        label="진행 중 액션 수"
        value={`${summary.inProgressActionCount}건`}
        helper="요청·진행 중"
        icon={Activity}
        tone="info"
      />
      <MetricCard
        label="확인 필요 액션 수"
        value={`${summary.attentionActionCount}건`}
        helper="부분·실패·차단"
        icon={AlertCircle}
        tone="warning"
      />
      <MetricCard
        label="전체 액션 수"
        value={`${summary.actionCount}건`}
        helper="지원 액션 4종"
        icon={Layers}
        tone="neutral"
      />
    </section>
  );
}
