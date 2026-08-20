import { Check, CloseCircle } from 'reicon-react';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui';
import { getStrategyGenerationProgress, strategyGenerationStageMeta } from '../model/strategy.js';

const dotStateClasses = Object.freeze({
  complete: 'border-[var(--good)] bg-[var(--good)] text-[color:var(--color-white)]',
  current: 'border-[var(--warning)] bg-[var(--warning-soft)] text-[color:var(--warning)]',
  error: 'border-[var(--danger)] bg-[var(--danger-soft)] text-[color:var(--danger)]',
  upcoming: 'border-[var(--border-strong)] bg-[var(--card)] text-transparent',
});

export function StrategyGenerationProgress({ status, currentStage, compact = false, className }) {
  const progress = getStrategyGenerationProgress(status, currentStage);

  return (
    <ol
      className={cn('grid min-w-[220px] grid-cols-3', className)}
      aria-label={`전략 생성 진행: ${strategyGenerationStageMeta[currentStage]?.label ?? '수요예측'}`}
    >
      {progress.map(({ stage, state }, index) => {
        const isConnected = index < progress.length - 1;
        const isLineComplete = state === 'complete';
        const label = strategyGenerationStageMeta[stage].label;

        return (
          <li key={stage} className="relative min-w-0">
            <div className="relative flex items-center">
              <span
                className={cn(
                  'relative z-[1] grid size-4 shrink-0 place-items-center rounded-full border text-[8px]',
                  dotStateClasses[state],
                )}
                aria-hidden="true"
              >
                {state === 'complete' ? <Icon icon={Check} size={9} /> : null}
                {state === 'error' ? <Icon icon={CloseCircle} size={9} /> : null}
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
                state === 'error' && 'font-bold text-[color:var(--danger)]',
                state === 'complete' && 'text-[color:var(--good)]',
                compact && 'sr-only',
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
