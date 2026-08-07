// 재고 도메인의 공통 용어와 표시 기준을 두는 자리입니다.
// 실제 API 응답 타입과 위험등급 계산은 백엔드 계약이 확정된 뒤 추가합니다.
export const inventoryRiskLevels = Object.freeze(['위험', '주의', '양호']);

export const inventoryMetricLabels = Object.freeze({
  current: '현재고',
  available: '가용수량',
  expiryDays: '소비기한 잔여일',
  stockDays: '재고일수',
});
