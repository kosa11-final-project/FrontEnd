/**
 * 동기화 API가 사용하는 상태 코드는 서버 계약으로 유지하고,
 * 화면에 노출할 때만 이 표를 통해 한글로 변환합니다.
 */
export const SYNC_STATUS_LABELS = Object.freeze({
  PENDING: '대기',
  QUEUED: '실행 대기',
  RUNNING: '실행 중',
  SUCCEEDED: '동기화 완료',
  SUCCESS: '처리 완료',
  FAILED: '실패',
  SOURCE_CHANGED: '원천 변경 감지로 중단',
  INTERRUPTED: '중단·복구 대기',
  LAUNCH_FAILED: '실행 시작 실패',
});

export const SYNC_PHASE_LABELS = Object.freeze({
  READING: '원천 읽기',
  NORMALIZING: '공통 형식 변환',
  VALIDATING: '데이터 검증',
  PUBLISHING: '통합재고 반영',
  ASSESSING_RISK: '위험 판정',
  // 초기 API/더미 응답에서 사용하던 표현도 같은 화면 언어로 매핑합니다.
  CANONICAL: '통합재고 반영',
  RISK_ASSESSMENT: '위험 판정',
  DONE: '완료',
});

export const SYNC_SOURCE_TYPE_LABELS = Object.freeze({
  OFFLINE: '오프라인',
  ECOMMERCE: '이커머스',
  GREETING: '그리팅',
  WAREHOUSE: '물류센터',
});

export const SYNC_TRIGGER_TYPE_LABELS = Object.freeze({
  MANUAL: '수동 실행',
  SCHEDULED: '예약 실행',
});

export const SYNC_MAPPING_STATUS_LABELS = Object.freeze({
  MAPPED: '매핑 완료',
  INVALID: '매핑 오류',
  REVIEW_REQUIRED: '확인 필요',
});

function getLabel(labels, value, fallback) {
  if (typeof value !== 'string' || value.trim() === '') return fallback;
  return labels[value.trim().toUpperCase()] || fallback;
}

export function getSyncStatusLabel(value) {
  return getLabel(SYNC_STATUS_LABELS, value, '상태 확인 필요');
}

export function getSyncPhaseLabel(value) {
  return getLabel(SYNC_PHASE_LABELS, value, '단계 확인 필요');
}

export function getSyncSourceTypeLabel(value) {
  return getLabel(SYNC_SOURCE_TYPE_LABELS, value, '원천 확인 필요');
}

export function getSyncTriggerTypeLabel(value) {
  return getLabel(SYNC_TRIGGER_TYPE_LABELS, value, '실행 방식 확인 필요');
}

export function getSyncMappingStatusLabel(value) {
  return getLabel(SYNC_MAPPING_STATUS_LABELS, value, '매핑 상태 확인 필요');
}
