import { Link, useLocation, useParams } from 'react-router-dom';
import { Button, StateView } from '@/shared/ui';
import { getStrategyDetailFixture } from './model/strategyDetailFixtures.js';
import { StrategyComparisonView } from './ui/StrategyComparisonView.jsx';

export default function AiStrategyDetailPage() {
  const { strategyCaseId } = useParams();
  const location = useLocation();
  const listPath = location.state?.from ?? '/ai-strategy';
  const strategyCase = getStrategyDetailFixture(strategyCaseId);

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
          description="생성 완료 후 3일이 지나 전략 대안과 시뮬레이션 결과를 복원할 수 없습니다. 새 전략을 생성해 주세요."
        />
        <Button asChild variant="secondary" className="mx-auto">
          <Link to={listPath}>목록으로 돌아가기</Link>
        </Button>
      </main>
    );
  }

  if (strategyCase.caseStatus !== 'GENERATED' || strategyCase.options.length === 0) {
    return (
      <StateView
        state="empty"
        title="표시할 전략 대안이 없습니다."
        description="전략 생성 상태를 확인하거나 새 AI 전략을 생성해 주세요."
      />
    );
  }

  return <StrategyComparisonView strategyCase={strategyCase} listPath={listPath} />;
}
