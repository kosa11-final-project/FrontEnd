import { Check } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui';
import { getStrategyGenerationProgress, strategyGenerationStageMeta } from '../model/strategy.js';

const dotStateClasses = Object.freeze({
  complete: 'border-[var(--good)] bg-[var(--good)] text-[color:var(--color-white)]',
  current: 'border-[var(--warning)] bg-[var(--warning-soft)] text-[color:var(--warning)]',
  notice: 'border-[var(--warning)] bg-[var(--warning-soft)] text-[color:var(--warning)]',
  error: 'border-[#EF4444] bg-[#EF4444] text-white',
  upcoming: 'border-[var(--border-strong)] bg-[var(--card)] text-transparent',
});

const stageStateLabels = Object.freeze({
  complete: '완료',
  current: '진행 중',
  notice: '실행 대안 없음',
  error: '오류',
  upcoming: '예정',
});

export function StrategyGenerationProgress({ status, currentStage, finalStageNotice, compact = false, className }) {
  const progress = getStrategyGenerationProgress(status, currentStage).map((item, index, items) =>
    finalStageNotice && status === 'GENERATED' && index === items.length - 1 ? { ...item, state: 'notice' } : item,
  );

  return (
    <ol
      className={cn('grid min-w-[220px] grid-cols-3', className)}
      aria-label={`전략 생성 진행: ${finalStageNotice ?? strategyGenerationStageMeta[currentStage]?.label ?? '수요예측'}`}
    >
      {progress.map(({ stage, state }, index) => {
        const isConnected = index < progress.length - 1;
        const isLineComplete = state === 'complete';
        const label = state === 'notice' ? finalStageNotice : strategyGenerationStageMeta[stage].label;

        return (
          <li key={stage} className="relative min-w-0" aria-current={state === 'current' ? 'step' : undefined}>
            <div className="relative flex items-center">
              <span
                className={cn(
                  'relative z-[1] grid size-4 shrink-0 place-items-center rounded-full border text-[8px]',
                  dotStateClasses[state],
                )}
                aria-hidden="true"
              >
                {state === 'complete' ? <Icon icon={Check} size={9} /> : null}
                {state === 'notice' ? <span className="font-bold leading-none">!</span> : null}
                {state === 'error' ? (
                  <span className="relative block size-2 before:absolute before:left-1/2 before:top-1/2 before:h-px before:w-[7px] before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-45 before:rounded-full before:bg-current after:absolute after:left-1/2 after:top-1/2 after:h-px after:w-[7px] after:-translate-x-1/2 after:-translate-y-1/2 after:-rotate-45 after:rounded-full after:bg-current" />
                ) : null}
              </span>
              {isConnected ? (
                <span
                  className={cn(
                    'h-px min-w-0 flex-1',
                    isLineComplete ? 'bg-[var(--good)]' : 'bg-[var(--border-strong)]',
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </div>
            <span
              className={cn(
                'mt-1.5 block truncate pr-2 text-[length:var(--font-size-overline)] text-[color:var(--text-muted)]',
                state === 'current' && 'font-bold text-[color:var(--warning)]',
                state === 'notice' && 'font-bold text-[color:var(--warning)]',
                state === 'error' && 'font-bold text-[color:var(--danger)]',
                state === 'complete' && 'text-[color:var(--good)]',
                compact && 'sr-only',
              )}
            >
              {label}
              <span className="sr-only"> ({stageStateLabels[state]})</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
