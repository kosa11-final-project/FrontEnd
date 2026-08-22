import { Badge } from '@/shared/ui';
import { actionStatusMeta, strategyStatusMeta } from '../model/strategy.js';

export function StrategyStatusBadge({ status, scope = 'strategy', size = 'md' }) {
  const meta = (scope === 'action' ? actionStatusMeta : strategyStatusMeta)[status] ?? {
    label: status || '상태 미수집',
    variant: 'neutral',
  };
  return (
    <Badge variant={meta.variant} size={size}>
      {meta.label}
    </Badge>
  );
}
