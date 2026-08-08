import { ChartBar, Database, Grid, Package, Refresh } from 'reicon-react';

// DESIGN / APP SHELL MODEL: 메뉴 순서·라벨·경로의 단일 출처입니다.
export const navigationItems = [
  { path: '/dashboard', label: '대시보드', icon: Grid, description: '재고 운영 전체 현황을 확인합니다.' },
  { path: '/inventory', label: '통합 재고 관제', icon: Database, description: '판매채널과 재고 위치별 운영재고를 확인합니다.' },
  { path: '/ai-strategy', label: 'AI 전략 수립', icon: Package, description: '위험 재고에 대한 AI 전략을 준비합니다.' },
  { path: '/execution', label: 'AI 실행 전략 & 성과 관제', icon: Refresh, description: '실행 전략과 성과를 추적합니다.' },
  { path: '/statistics', label: '통계', icon: ChartBar, description: '재고 운영 통계를 확인합니다.' },
];

export function getNavigationItem(pathname) {
  return navigationItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)) ?? navigationItems[0];
}
