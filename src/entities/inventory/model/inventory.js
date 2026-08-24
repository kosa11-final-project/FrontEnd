/**
 * 통합 재고 도메인 상태 및 메트릭 표준 상수
 */

/** 위험 판정 등급 */
export const INVENTORY_RISK_GRADES = Object.freeze({
  SAFE: 'SAFE',
  NORMAL: 'NORMAL',
  CAUTION: 'CAUTION',
  DANGER: 'DANGER',
});

/** 위험 판정 상태 */
export const RISK_ASSESSMENT_STATUS = Object.freeze({
  ASSESSED: 'ASSESSED',
  UNASSESSED: 'UNASSESSED',
  STALE: 'STALE',
  FAILED: 'FAILED',
  REASSESSING: 'REASSESSING',
});

/** 재고 물리/논리 사실 상태 (서버 집계 결과) */
export const INVENTORY_FACT_STATE = Object.freeze({
  EXPIRED_INCLUDED: 'EXPIRED_INCLUDED',
  SALE_STOPPED_INCLUDED: 'SALE_STOPPED_INCLUDED',
  DEPLETED_ONLY: 'DEPLETED_ONLY',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  AVAILABLE: 'AVAILABLE',
});

/** 상품 기준 상태 */
export const PRODUCT_STATUS_LABELS = Object.freeze({
  DRAFT: '작성 중',
  ACTIVE: '활성',
  INACTIVE: '비활성',
});

/** 판매처 귀속 상태 */
export const SALES_POINT_STATE_LABELS = Object.freeze({
  OWNED: '판매처 보유',
  ALLOCATED_ONLY: '판매처 할당만 됨',
  CENTER_ONLY: '센터 보관',
  LOCATION_UNKNOWN: '위치 미확인',
});

/** 판매 가격 상태 */
export const PRICE_STATUS_LABELS = Object.freeze({
  AVAILABLE: '가격 정상',
  NOT_LOADED: '가격 미적재',
  STALE: '가격 만료',
});

/** 조회 결과 상태 */
export const RESULT_STATE = Object.freeze({
  HAS_DATA: 'HAS_DATA',
  NO_DATA: 'NO_DATA',
  FILTER_EMPTY: 'FILTER_EMPTY',
});

/** 위험 등급별 UI 표시 설정 */
export const RISK_GRADE_META = Object.freeze({
  SAFE: {
    label: '양호',
    tone: 'success',
    badgeVariant: 'success',
    colorHex: '#27B06E',
  },
  NORMAL: {
    label: '보통',
    tone: 'info',
    badgeVariant: 'info',
    colorHex: '#00B0D7',
  },
  CAUTION: {
    label: '주의',
    tone: 'warning',
    badgeVariant: 'warning',
    colorHex: '#FDA643',
  },
  DANGER: {
    label: '위험',
    tone: 'danger',
    badgeVariant: 'danger',
    colorHex: '#D92D20',
  },
});

/** 재고 사실 상태별 UI 레이블 */
export const FACT_STATE_LABELS = Object.freeze({
  EXPIRED_INCLUDED: '만료 재고 포함',
  SALE_STOPPED_INCLUDED: '판매중지 포함',
  DEPLETED_ONLY: '전량 소진',
  OUT_OF_STOCK: '품절',
  AVAILABLE: '정상 가용',
});

export function getInventoryFactStateLabel(state) {
  return FACT_STATE_LABELS[state] || '재고 상태 확인 필요';
}

export function getSalesPointStateLabel(state) {
  return SALES_POINT_STATE_LABELS[state] || '귀속 상태 확인 필요';
}

export function getPriceStatusLabel(status) {
  return PRICE_STATUS_LABELS[status] || '가격 상태 확인 필요';
}

/** 채널 코드별 이름 */
export const CHANNEL_NAMES = Object.freeze({
  GREETING: '그리팅',
  ECOMMERCE: '모두의맛집',
  HYUNDAI_DEPT: '현대백화점',
  HMART: '직영점',
});

/** 보관유형 코드별 이름 */
export const STORAGE_NAMES = Object.freeze({
  FROZEN: '냉동',
  COLD: '냉장',
  ROOM_TEMP: '상온',
  AMBIENT: '상온',
});

/** 권역 코드별 한국어 이름 */
export const REGION_NAMES = Object.freeze({
  SEOUL: '서울권',
  GYEONGGI: '경기권',
  BUSAN: '부산/경남권',
  DAEGU: '대구/경북권',
  CHUNGCHEONG: '충청/대전권',
  ULSAN: '울산권',
  ONLINE: '온라인/전국',
});
