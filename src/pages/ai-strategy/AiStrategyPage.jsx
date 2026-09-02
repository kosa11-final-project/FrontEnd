import { StrategyGenerationList } from '@/widgets/strategy-generation-list';
import { getLocalStrategyListMocks } from './model/localStrategyDetailMocks.js';

export default function AiStrategyPage() {
  return (
    <main className="page-shell" aria-labelledby="page-title">
      <section className="page-heading">
        <div>
          <h1 id="page-title">AI 전략 및 시뮬레이션</h1>
          <p>AI 전략 생성 상태를 확인하고, 완료된 전략을 비교·시뮬레이션합니다.</p>
        </div>
      </section>
      <StrategyGenerationList localStrategies={getLocalStrategyListMocks()} />
    </main>
  );
}
