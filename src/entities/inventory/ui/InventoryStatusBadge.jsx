import { Danger, InfoCircle, TickCircle, Warning } from 'reicon-react';
import { Badge } from '@/shared/ui/Badge.jsx';
import { Icon } from '@/shared/ui/Icon.jsx';
import { cn } from '@/shared/lib/cn';

export const inventoryStatusMeta = Object.freeze({
  loading: {
    label: '확인 중',
    variant: 'neutral',
    dotColor: 'bg-gray-400',
    icon: InfoCircle,
    description: '판정 정보를 불러오는 중입니다.',
  },
  unassessed: {
    label: '미판정',
    variant: 'neutral',
    dotColor: 'bg-gray-400',
    icon: InfoCircle,
    description: '재고 동기화 후 판정됩니다.',
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
    description: '재고 흐름이 일반적인 기준 범위에 있습니다.',
  },
  NORMAL: {
    label: '보통',
    variant: 'info',
    dotColor: 'bg-[#00627F]',
    icon: InfoCircle,
    description: '재고 흐름이 일반적인 기준 범위에 있습니다.',
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
    description: '재고 동기화 후 판정됩니다.',
  },
});

const statusLabelMap = Object.freeze({
  양호: 'good',
  보통: 'normal',
  관찰: 'normal',
  주의: 'caution',
  위험: 'risk',
  warning: 'WARNING',
  critical: 'CRITICAL',
});

export function resolveInventoryStatus(status) {
  if (status == null || status === '') return 'loading';
  return Object.hasOwn(inventoryStatusMeta, status)
    ? status
    : Object.hasOwn(statusLabelMap, status)
      ? statusLabelMap[status]
      : 'loading';
}

export function InventoryStatusBadge({
  status,
  assessmentStatus,
  className,
  showDot = false,
  showIcon = false,
  ...props
}) {
  const key = assessmentStatus === 'UNASSESSED' ? 'UNASSESSED' : resolveInventoryStatus(status);
  const meta = inventoryStatusMeta[key] || inventoryStatusMeta.normal;
  const hasAddon = showDot || showIcon;

  return (
    <Badge
      variant={meta.variant}
      className={cn(
        hasAddon ? 'min-w-[62px]' : 'w-[52px] min-w-[52px]',
        'px-1.5 py-0.5 font-bold tracking-tight justify-center text-center shrink-0 transition-all duration-300 ease-out',
        className,
      )}
      title={meta.description}
      {...props}
    >
      {showDot && <span className={cn('size-1.5 shrink-0 rounded-full', meta.dotColor)} />}
      {showIcon && <Icon aria-hidden="true" icon={meta.icon} size={12} />}
      <span className="truncate">{meta.label}</span>
    </Badge>
  );
}
