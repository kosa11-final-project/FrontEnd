import { Danger, InfoCircle, TickCircle, Warning } from 'reicon-react';
import { Badge } from '@/shared/ui';
import { Icon } from '@/shared/ui/Icon.jsx';

export const inventoryStatusMeta = Object.freeze({
  good: { label: '양호', variant: 'good', icon: TickCircle, description: '재고 흐름이 기준 범위 안에 있습니다.' },
  normal: { label: '보통', variant: 'info', icon: InfoCircle, description: '추가 확인이 필요하지 않은 일반 상태입니다.' },
  caution: { label: '주의', variant: 'warning', icon: Warning, description: '재고 또는 소비기한 기준을 확인해야 합니다.' },
  risk: { label: '위험', variant: 'danger', icon: Danger, description: '우선 조치가 필요한 재고 상태입니다.' },
});

const statusLabelMap = Object.freeze({
  양호: 'good',
  보통: 'normal',
  주의: 'caution',
  위험: 'risk',
});

export function resolveInventoryStatus(status = 'normal') {
  return inventoryStatusMeta[status] ? status : statusLabelMap[status] ?? 'normal';
}

export function InventoryStatusBadge({ status = 'normal', className, showIcon = true, ...props }) {
  const key = resolveInventoryStatus(status);
  const meta = inventoryStatusMeta[key];

  return (
    <Badge
      variant={meta.variant}
      className={className}
      title={meta.description}
      {...props}
    >
      {showIcon && <Icon aria-hidden="true" icon={meta.icon} size={12} />}
      {meta.label}
    </Badge>
  );
}
