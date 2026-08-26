import { Badge } from '@/shared/ui';
import { actionTypeMeta } from '../model/strategy.js';

export function StrategyActionTypeBadge({ type, compact = false, className }) {
  const meta = actionTypeMeta[type] ?? { label: type, shortLabel: type };
  return (
    <Badge variant="outline" className={className}>
      {compact ? meta.shortLabel : meta.label}
    </Badge>
  );
}
