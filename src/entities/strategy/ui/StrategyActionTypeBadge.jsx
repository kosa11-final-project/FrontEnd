import { Badge } from '@/shared/ui';
import { actionTypeMeta } from '../model/strategy.js';

const actionTypeVariants = {
  RT_TRANSFER: 'info',
  PRICE_DISCOUNT: 'warning',
  CHANNEL_EXPANSION: 'good',
};

export function StrategyActionTypeBadge({ type, compact = false, className }) {
  const meta = actionTypeMeta[type] ?? { label: '전략 액션', shortLabel: '액션' };
  return (
    <Badge variant={actionTypeVariants[type] ?? 'outline'} className={className}>
      {compact ? meta.shortLabel : meta.label}
    </Badge>
  );
}
