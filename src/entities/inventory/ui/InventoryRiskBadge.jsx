import { Badge } from '@/shared/ui';

// shared/ui/Badge는 시각 표현만 알고, 재고 위험등급의 의미는 이 도메인 컴포넌트가 소유합니다.
export function InventoryRiskBadge({ level = '양호' }) {
  const variant = level === '위험' ? 'danger' : level === '주의' ? 'warning' : 'good';
  return <Badge variant={variant}>{level}</Badge>;
}
