import { Badge } from '@/shared/ui';

const statusMeta = Object.freeze({
  active: { label: '사용 중', variant: 'good' },
  paused: { label: '일시 중지', variant: 'warning' },
  inactive: { label: '사용 안 함', variant: 'neutral' },
});

/** API enum의 의미와 공통 Badge variant의 연결은 entity UI가 소유합니다. */
export function ExampleStatusBadge({ status }) {
  const meta = statusMeta[status] ?? statusMeta.inactive;
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
