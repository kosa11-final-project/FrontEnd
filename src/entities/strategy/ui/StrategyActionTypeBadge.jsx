import { Badge } from '@/shared/ui';
import { actionTypeMeta } from '../model/strategy.js';

export function StrategyActionTypeBadge({ type, compact = false }) {
  const meta = actionTypeMeta[type] ?? { label: type, shortLabel: type };
  return <Badge variant="outline">{compact ? meta.shortLabel : meta.label}</Badge>;
}
