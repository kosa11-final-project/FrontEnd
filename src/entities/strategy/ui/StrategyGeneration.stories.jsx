import { StrategyGenerationProgress } from './StrategyGenerationProgress.jsx';
import { StrategyGenerationStatus } from './StrategyGenerationStatus.jsx';

export default {
  title: 'Entities/Strategy/Generation',
  tags: ['autodocs'],
};

export function AllStates() {
  return (
    <div className="grid max-w-xl gap-6 bg-[var(--card)] p-6">
      <div className="grid gap-2">
        <StrategyGenerationStatus status="GENERATING" />
        <StrategyGenerationProgress status="GENERATING" currentStage="AI_STRATEGY_GENERATING" />
      </div>
      <div className="grid gap-2">
        <StrategyGenerationStatus status="GENERATED" />
        <StrategyGenerationProgress status="GENERATED" currentStage="COMPARISON_READY" />
      </div>
      <div className="grid gap-2">
        <StrategyGenerationStatus status="GENERATION_FAILED" />
        <StrategyGenerationProgress status="GENERATION_FAILED" currentStage="FORECASTING" />
      </div>
    </div>
  );
}
