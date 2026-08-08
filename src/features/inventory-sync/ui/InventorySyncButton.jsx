// DESIGN / FEATURE: 동기화 버튼은 shared/ui Button을 조합해 기능 단위로 제공합니다.
export function InventorySyncButton() {
  return <span data-feature="inventory-sync">재고 동기화</span>;
}
