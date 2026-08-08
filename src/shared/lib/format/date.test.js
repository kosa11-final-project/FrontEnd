import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatDaysRemaining } from './date.js';

describe('date formatters', () => {
  it('날짜와 동기화 시각을 프로젝트 표기로 변환한다', () => {
    expect(formatDate('2026-08-08')).toBe('2026.08.08');
    expect(formatDateTime('2026-08-08T09:05:00+09:00')).toBe('2026.08.08 09:05');
  });

  it('소비기한 잔여일을 D-day 표기로 변환한다', () => {
    expect(formatDaysRemaining(43)).toBe('D-43');
    expect(formatDaysRemaining(0)).toBe('D-Day');
    expect(formatDaysRemaining(-2)).toBe('D+2');
  });

  it('유효하지 않은 날짜와 잔여일은 fallback으로 처리한다', () => {
    expect(formatDate('not-a-date')).toBe('-');
    expect(formatDateTime(null)).toBe('-');
    expect(formatDaysRemaining(undefined, { fallback: '미정' })).toBe('미정');
  });
});
