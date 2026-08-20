import { useEffect } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { resolveStrategyOption } from '@/entities/strategy';
import { Button, StateView } from '@/shared/ui';
import { getStrategyDetailFixture } from './model/strategyDetailFixtures.js';
import { StrategySimulationView } from './ui/StrategySimulationView.jsx';

export default function AiStrategySimulationPage() {
  const { strategyCaseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const strategyCase = getStrategyDetailFixture(strategyCaseId);
  const activeOption = resolveStrategyOption(strategyCase?.options, searchParams.get('option'));
  const listPath = location.state?.from ?? '/ai-strategy';

  useEffect(() => {
    if (!activeOption || searchParams.get('option') === activeOption.optionKey) return;
    const next = new URLSearchParams(searchParams);
    next.set('option', activeOption.optionKey);
    setSearchParams(next, { replace: true });
  }, [activeOption, searchParams, setSearchParams]);

  if (!strategyCase) {
    return (
      <main className="page-shell grid gap-4">
        <StateView
          state="error"
          title="AI 전략 결과를 찾을 수 없습니다."
          description="전략 번호를 확인하거나 목록에서 다시 선택해 주세요."
        />
        <Button asChild variant="secondary" className="mx-auto">
          <Link to={listPath}>목록으로 돌아가기</Link>
        </Button>
      </main>
    );
  }

  if (strategyCase.caseStatus === 'EXPIRED') {
    return (
      <main className="page-shell grid gap-4">
        <StateView
          state="empty"
          title="AI 전략 결과가 만료되었습니다."
          description="생성 결과 보관 기간 3일이 지나 대안과 시뮬레이션을 복원할 수 없습니다."
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
