export const FORECAST_STATUS = {
  AVAILABLE: 'AVAILABLE',
  NO_DATA: 'NO_DATA',
  STALE: 'STALE',
  ERROR: 'ERROR',
};

export const FORECAST_STATUS_LABELS = {
  AVAILABLE: '수요예측 정상 제공',
  NO_DATA: '데이터 없음',
  STALE: '수요예측 만료',
  ERROR: '수요예측 조회 실패',
};

export const FORECAST_STATUS_VARIANTS = {
  AVAILABLE: 'success',
  NO_DATA: 'neutral',
  STALE: 'warning',
  ERROR: 'danger',
};
