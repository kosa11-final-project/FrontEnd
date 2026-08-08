import { describe, expect, it } from 'vitest';
import { defaultExampleFilters, readExampleFilters, writeExampleFilters } from './exampleFilterState.js';

describe('example URL filter template', () => {
  it('search params가 없으면 기본 필터를 사용한다', () => {
    expect(readExampleFilters(new URLSearchParams())).toEqual(defaultExampleFilters);
  });

  it('공유해야 하는 필터를 URL로 왕복 변환한다', () => {
    const filters = { query: '냉동', status: 'active', page: 2, size: 50 };
    expect(readExampleFilters(writeExampleFilters(filters))).toEqual(filters);
  });

  it('잘못된 페이지 값은 안전한 기본값으로 복구한다', () => {
    expect(readExampleFilters(new URLSearchParams('page=-1&size=0'))).toMatchObject({ page: 0, size: 20 });
  });
});
