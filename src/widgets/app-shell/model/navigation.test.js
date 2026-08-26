import { describe, expect, it } from 'vitest';
import { getNavigationItem, navigationItems } from './navigation.js';

describe('app shell navigation', () => {
  it('확정된 업무 메뉴 순서와 라벨을 단일 출처로 제공한다', () => {
    expect(navigationItems.map(({ label }) => label)).toEqual([
      '대시보드',
      '통합 재고 조회',
      'AI 전략 및 시뮬레이션',
      'AI 전략 실행 관제',
      '통계',
    ]);
  });

  it('하위 경로에서도 상위 메뉴를 찾는다', () => {
    expect(getNavigationItem('/inventory/detail/42').label).toBe('통합 재고 조회');
  });
});
