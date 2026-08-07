// 재고 필터라는 사용자 행동의 기본값과 URL 키를 관리하는 자리입니다.
// 실제 URL 동기화와 Zod 검증은 기능 구현 단계에서 추가합니다.
export const inventoryFilterDefaults = Object.freeze({
  keyword: '',
  channel: '전체 판매채널',
  location: '전체 재고 위치',
  risk: '전체 위험등급',
});

export const inventoryFilterQueryKeys = Object.freeze(['keyword', 'channel', 'location', 'risk']);
