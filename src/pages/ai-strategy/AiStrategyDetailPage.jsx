import { useQuery } from '@tanstack/react-query';
import { useLayoutEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { aiStrategyDetailQueryOptions } from '@/entities/strategy';
import { Button, StateView } from '@/shared/ui';
import { StrategyComparisonView } from './ui/StrategyComparisonView.jsx';
import { StrategyNoRecommendationView } from './ui/StrategyNoRecommendationView.jsx';

export default function AiStrategyDetailPage() {
  const { strategyCaseId } = useParams();
  const location = useLocation();
  const listPath = location.state?.from ?? '/ai-strategy';
  const detailQuery = useQuery(aiStrategyDetailQueryOptions(strategyCaseId));

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [strategyCaseId]);

  if (detailQuery.isPending) {
    return (
      <main className="page-shell">
        <StateView state="loading" title="AI 전략 상세를 불러오고 있습니다." />
      </main>
    );
  }

  if (detailQuery.isError) {
    const expired = detailQuery.error?.status === 410;
    const notFound = detailQuery.error?.status === 404;
    const forbidden = detailQuery.error?.status === 403;
    return (
      <main className="page-shell grid gap-4">
        <StateView
          state={forbidden ? 'forbidden' : expired ? 'empty' : 'error'}
          title={expired ? 'AI 전략 결과가 만료되었습니다.' : notFound ? 'AI 전략 결과를 찾을 수 없습니다.' : undefined}
          description={
            expired
              ? '결과 보관 기간이 지나 전략 대안과 시뮬레이션 결과를 복원할 수 없습니다.'
              : notFound
                ? '전략 번호를 확인하거나 목록에서 다시 선택해 주세요.'
                : undefined
          }
          actionLabel={!expired && !notFound && !forbidden ? '다시 시도' : undefined}
          onAction={!expired && !notFound && !forbidden ? () => detailQuery.refetch() : undefined}
        />
        <Button asChild variant="secondary" className="mx-auto">
          <Link to={listPath}>목록으로 돌아가기</Link>
        </Button>
      </main>
    );
  }

  const strategyCase = detailQuery.data;

  if (strategyCase.noRecommendation) {
    return <StrategyNoRecommendationView strategyCase={strategyCase} listPath={listPath} />;
  }

  if (!['GENERATED', 'READY_TO_EXECUTE'].includes(strategyCase.caseStatus) || !strategyCase.options?.length) {
    return (
      <main className="page-shell grid gap-4">
        <StateView
          state="empty"
          title="표시할 전략 대안이 없습니다."
          description="전략 생성 상태를 확인하거나 새 AI 전략을 생성해 주세요."
        />
        <Button asChild variant="secondary" className="mx-auto">
          <Link to={listPath}>목록으로 돌아가기</Link>
        </Button>
      </main>
    );
  }

  return <StrategyComparisonView strategyCase={strategyCase} listPath={listPath} />;
}
