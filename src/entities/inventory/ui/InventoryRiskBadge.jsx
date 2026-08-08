import { InventoryStatusBadge } from './InventoryStatusBadge.jsx';

// DESIGN / ENTITY: 위험등급의 의미와 shared/ui Badge variant 매핑은 inventory 도메인이 소유합니다.
export function InventoryRiskBadge({ level = '양호', ...props }) {
  return <InventoryStatusBadge status={level} {...props} />;
}
