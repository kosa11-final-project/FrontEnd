import { describe, expect, it } from 'vitest';
import { cn } from './cn.js';

describe('cn', () => {
  it('조건부 class와 Tailwind 충돌을 정리한다', () => {
    expect(cn('px-2 text-sm', { hidden: false }, 'px-4')).toBe('text-sm px-4');
  });
});
