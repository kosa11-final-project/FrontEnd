import { Danger, InfoCircle, TickCircle, Warning } from 'reicon-react';
import { Badge } from '@/shared/ui/Badge.jsx';
import { Icon } from '@/shared/ui/Icon.jsx';
import { cn } from '@/shared/lib/cn';

export const inventoryStatusMeta = Object.freeze({
  unassessed: {
    label: '판정 불가',
    variant: 'neutral',
    dotColor: 'bg-gray-400',
    icon: InfoCircle,
    description: '위험 평가 결과가 아직 제공되지 않았습니다.',
  },
  good: {
    label: '양호',
    variant: 'good',
    dotColor: 'bg-[var(--primary)]',
    icon: TickCircle,
    description: '재고 흐름이 기준 범위 안에 있습니다.',
  },
  SAFE: {
    label: '양호',
    variant: 'good',
    dotColor: 'bg-[var(--primary)]',
    icon: TickCircle,
    description: '재고 흐름이 기준 범위 안에 있습니다.',
  },
  GOOD: {
    label: '양호',
    variant: 'good',
    dotColor: 'bg-[var(--primary)]',
    icon: TickCircle,
    description: '재고 흐름이 기준 범위 안에 있습니다.',
  },
  normal: {
    label: '보통',
    variant: 'info',
    dotColor: 'bg-[#00627F]',
    icon: InfoCircle,
    description: '추가 확인이 필요하지 않은 일반 상태입니다.',
  },
  NORMAL: {
    label: '보통',
    variant: 'info',
    dotColor: 'bg-[#00627F]',
    icon: InfoCircle,
    description: '추가 확인이 필요하지 않은 일반 상태입니다.',
  },
  caution: {
    label: '주의',
    variant: 'warning',
    dotColor: 'bg-[#FDA643]',
    icon: Warning,
    description: '재고 또는 소비기한 기준을 확인해야 합니다.',
  },
  CAUTION: {
    label: '주의',
    variant: 'warning',
    dotColor: 'bg-[#FDA643]',
    icon: Warning,
    description: '재고 또는 소비기한 기준을 확인해야 합니다.',
  },
  WARNING: {
    label: '주의',
    variant: 'warning',
    dotColor: 'bg-[#FDA643]',
    icon: Warning,
    description: '재고 또는 소비기한 기준을 확인해야 합니다.',
  },
  risk: {
    label: '위험',
    variant: 'danger',
    dotColor: 'bg-[#D92D20]',
    icon: Danger,
    description: '우선 조치가 필요한 재고 상태입니다.',
  },
  DANGER: {
    label: '위험',
    variant: 'danger',
    dotColor: 'bg-[#D92D20]',
    icon: Danger,
    description: '우선 조치가 필요한 재고 상태입니다.',
  },
  CRITICAL: {
    label: '위험',
    variant: 'danger',
    dotColor: 'bg-[#D92D20]',
    icon: Danger,
    description: '우선 조치가 필요한 재고 상태입니다.',
  },
  UNASSESSED: {
    label: '미판정',
    variant: 'neutral',
    dotColor: 'bg-gray-400',
    icon: InfoCircle,
    description: '위험 평가 결과가 아직 제공되지 않았습니다.',
  },
});

const statusLabelMap = Object.freeze({
  양호: 'good',
  보통: 'normal',
  주의: 'caution',
  위험: 'risk',
  warning: 'WARNING',
  critical: 'CRITICAL',
});

export function resolveInventoryStatus(status) {
  if (status == null || status === '') return 'unassessed';
  return Object.hasOwn(inventoryStatusMeta, status)
    ? status
    : Object.hasOwn(statusLabelMap, status)
      ? statusLabelMap[status]
      : 'unassessed';
}

export function InventoryStatusBadge({ status, className, showDot = false, showIcon = false, ...props }) {
  const key = resolveInventoryStatus(status);
  const meta = inventoryStatusMeta[key] || inventoryStatusMeta.normal;

  return (
    <Badge
      variant={meta.variant}
      className={cn('px-2.5 py-0.5 font-bold tracking-tight justify-center', className)}
      title={meta.description}
      {...props}
    >
      {showDot && <span className={cn('size-1.5 shrink-0 rounded-full', meta.dotColor)} />}
      {showIcon && <Icon aria-hidden="true" icon={meta.icon} size={12} />}
      {meta.label}
    </Badge>
  );
}
