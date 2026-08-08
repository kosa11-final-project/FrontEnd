import { ChartBar, Database, Grid, Package, Refresh } from 'reicon-react';

// DESIGN / APP SHELL MODEL: 메뉴 순서·라벨·경로의 단일 출처입니다.
export const navigationItems = [
  { path: '/dashboard', label: '대시보드', icon: Grid, description: '재고 운영 전체 현황을 확인합니다.' },
  {
    path: '/inventory',
    label: '통합 재고 조회',
    icon: Database,
    description: '판매채널과 재고 위치별 운영재고를 조회합니다.',
  },
  {
    path: '/ai-strategy',
    label: 'AI 전략 및 시뮬레이션',
    icon: Package,
    description: '위험 재고를 기준으로 전략을 시뮬레이션합니다.',
  },
  {
    path: '/execution',
    label: 'AI 전략 기록 & 성과',
    icon: Refresh,
    description: 'AI 전략 기록과 실행 성과를 확인합니다.',
  },
  { path: '/statistics', label: '통계', icon: ChartBar, description: '재고 운영 통계를 확인합니다.' },
];

export function getNavigationItem(pathname) {
  return (
    navigationItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)) ?? navigationItems[0]
  );
}
