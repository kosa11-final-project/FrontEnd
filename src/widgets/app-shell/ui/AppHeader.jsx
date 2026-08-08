import { useLocation } from 'react-router-dom';
import { BellAlert, ChevronDown, Menu } from 'reicon-react';
import { getNavigationItem } from '../model/navigation.js';
import { Avatar, Icon, IconButton } from '@/shared/ui';

// DESIGN / WIDGET: 전역 헤더 조합입니다. 경로 변경 때 breadcrumb만 갱신합니다.
export function AppHeader() {
  const { pathname } = useLocation();
  const currentPage = getNavigationItem(pathname);

  return (
    <header className="topbar">
      <IconButton className="mobile-menu" label="메뉴 열기">
        <Icon icon={Menu} size={18} />
      </IconButton>
      <div className="breadcrumb" aria-label="현재 위치">
        <span>운영 관제</span>
        <span className="breadcrumb-separator">/</span>
        <strong>{currentPage.label}</strong>
      </div>
      <div className="topbar-actions">
        <IconButton label="알림">
          <Icon icon={BellAlert} size={18} />
        </IconButton>
        <button className="user-chip" type="button">
          <Avatar size="sm">김</Avatar>
          <span className="user-chip-name">김명만</span>
          <Icon icon={ChevronDown} size={14} />
        </button>
      </div>
    </header>
  );
}
