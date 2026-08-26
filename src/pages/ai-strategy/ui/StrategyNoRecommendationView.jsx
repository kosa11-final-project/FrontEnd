import { InfoCircle } from 'reicon-react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Card, Icon } from '@/shared/ui';
import { StrategyCaseSummary, StrategyDetailHeader } from './StrategyDetailShared.jsx';

export function StrategyNoRecommendationView({ strategyCase, listPath }) {
  return (
    <main className="page-shell" aria-labelledby="page-title">
      <StrategyDetailHeader strategyCase={strategyCase} backTo={listPath} />

      <div className="grid gap-4">
        <StrategyCaseSummary strategyCase={strategyCase} />
        <Card padding="lg" className="overflow-hidden border-[var(--good)] bg-[var(--good-soft)]">
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--card)] text-[color:var(--good)] shadow-sm">
              <Icon icon={InfoCircle} size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <Badge variant="good">현상 유지 권장</Badge>
              <h2 className="mt-3 text-xl font-bold text-[color:var(--text-heading)]">
                현재 운영 상태를 유지하는 것이 유리합니다.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-body)]">
                {strategyCase.noRecommendation?.message ??
                  '현재 조건에서는 실행 전략을 적용하지 않는 편이 더 유리한 것으로 분석되었습니다.'}
              </p>
              <Alert variant="info" title="실행할 전략 대안이 생성되지 않았습니다." className="mt-5">
                재고나 판매 조건이 달라진 뒤 필요하면 새로운 AI 전략을 생성해 주세요.
              </Alert>
              <Button asChild variant="secondary" className="mt-5">
                <Link to={listPath}>목록으로 돌아가기</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
