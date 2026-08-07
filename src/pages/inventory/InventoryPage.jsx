import OperationsPlaceholderPage from '@/pages/operations/OperationsPlaceholderPage.jsx';

// 실제 화면에서는 inventory-summary, inventory-table widget을 조합할 페이지입니다.
export default function InventoryPage() {
  return <OperationsPlaceholderPage eyebrow="INTEGRATED INVENTORY CONTROL" title="통합 재고 관제" description="판매채널과 재고 위치별 운영재고를 확인하는 화면입니다." />;
}
