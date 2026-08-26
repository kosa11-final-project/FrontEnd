import { describe, expect, it } from 'vitest';
import {
  getSyncMappingStatusLabel,
  getSyncPhaseLabel,
  getSyncSourceTypeLabel,
  getSyncStatusLabel,
  getSyncTriggerTypeLabel,
} from './inventorySyncStatus.js';

describe('통합재고 동기화 상태 라벨', () => {
  it('서버 상태와 단계를 한글로 변환합니다', () => {
    expect(getSyncStatusLabel('RUNNING')).toBe('실행 중');
    expect(getSyncPhaseLabel('ASSESSING_RISK')).toBe('위험 판정');
    expect(getSyncPhaseLabel('RISK_ASSESSMENT')).toBe('위험 판정');
  });

  it('원천, 실행 방식, 매핑 상태를 한글로 변환합니다', () => {
    expect(getSyncSourceTypeLabel('WAREHOUSE')).toBe('물류센터');
    expect(getSyncTriggerTypeLabel('SCHEDULED')).toBe('예약 실행');
    expect(getSyncMappingStatusLabel('REVIEW_REQUIRED')).toBe('확인 필요');
  });

  it('알 수 없는 값은 원본 코드를 화면에 노출하지 않고 확인 필요로 표시합니다', () => {
    expect(getSyncStatusLabel('NOT_A_STATUS')).toBe('상태 확인 필요');
    expect(getSyncPhaseLabel(null)).toBe('단계 확인 필요');
  });
});
