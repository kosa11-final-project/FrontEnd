import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { aiStrategyDetailQueryOptions, resolveStrategyOption } from '@/entities/strategy';
import { Button, StateView } from '@/shared/ui';
import { StrategySimulationView } from './ui/StrategySimulationView.jsx';

export default function AiStrategySimulationPage() {
  const { strategyCaseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const detailQuery = useQuery(aiStrategyDetailQueryOptions(strategyCaseId));
  const strategyCase = detailQuery.data;
  const activeOption = resolveStrategyOption(strategyCase?.options, searchParams.get('option'));
  const listPath = location.state?.from ?? '/ai-strategy';

  useEffect(() => {
    if (!activeOption || searchParams.get('option') === activeOption.optionKey) return;
    const next = new URLSearchParams(searchParams);
    next.set('option', activeOption.optionKey);
    setSearchParams(next, { replace: true });
  }, [activeOption, searchParams, setSearchParams]);

  if (detailQuery.isPending) {
    return (
      <main className="page-shell">
        <StateView state="loading" title="시뮬레이션 정보를 불러오고 있습니다." />
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
              ? '결과 보관 기간이 지나 대안과 시뮬레이션을 복원할 수 없습니다.'
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

  if (strategyCase.caseStatus !== 'GENERATED' || !activeOption) {
    return (
      <main className="page-shell grid gap-4">
        <StateView state="empty" title="표시할 전략 대안이 없습니다." description="새 AI 전략을 생성해 주세요." />
        <Button asChild variant="secondary" className="mx-auto">
          <Link to={listPath}>목록으로 돌아가기</Link>
        </Button>
      </main>
    );
  }

  function handleActiveOptionChange(optionKey) {
    const next = new URLSearchParams(searchParams);
    next.set('option', optionKey);
    setSearchParams(next, { replace: true });
  }

  return (
    <StrategySimulationView
      key={strategyCase.strategyCaseId}
      strategyCase={strategyCase}
      activeOption={activeOption}
      listPath={listPath}
      onActiveOptionChange={handleActiveOptionChange}
    />
  );
}
