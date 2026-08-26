import { Danger, Refresh, TickCircle } from 'reicon-react';
import { Badge, Icon } from '@/shared/ui';
import { resolveStrategyGenerationStatus, strategyGenerationStatusMeta } from '../model/strategy.js';

const statusIcons = Object.freeze({
  GENERATING: Refresh,
  GENERATED: TickCircle,
  GENERATION_FAILED: Danger,
});

export function StrategyGenerationStatus({ status, className }) {
  const resolvedStatus = resolveStrategyGenerationStatus(status);
  const meta = strategyGenerationStatusMeta[resolvedStatus];
  const StatusIcon = statusIcons[resolvedStatus];

  return (
    <Badge variant={meta.variant} className={className}>
      {StatusIcon ? (
        <Icon
          aria-hidden="true"
          icon={StatusIcon}
          size={12}
          className={resolvedStatus === 'GENERATING' ? 'motion-safe:animate-spin' : undefined}
        />
      ) : null}
      {meta.label}
    </Badge>
  );
}
