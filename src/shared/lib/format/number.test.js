import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber, formatPercent, formatQuantity } from './number.js';

describe('number formatters', () => {
  it('업무 수치를 한국어 숫자 형식으로 표시한다', () => {
    expect(formatNumber(2058)).toBe('2,058');
    expect(formatNumber('145.5', { maximumFractionDigits: 1 })).toBe('145.5');
  });

  it('금액, 퍼센트, 수량의 표기를 일관되게 만든다', () => {
    expect(formatCurrency(8900)).toBe('₩8,900');
    expect(formatPercent(14.25)).toBe('14.3%');
    expect(formatQuantity(205)).toBe('205개');
    expect(formatQuantity(155, { unit: '세트' })).toBe('155세트');
    expect(formatQuantity(0, { fallback: '0' })).toBe('0개');
  });

  it('표시할 수 없는 값은 공통 fallback으로 처리한다', () => {
    expect(formatNumber(null)).toBe('-');
    expect(formatCurrency('')).toBe('-');
    expect(formatPercent(Number.NaN, { fallback: '데이터 없음' })).toBe('데이터 없음');
  });
});
