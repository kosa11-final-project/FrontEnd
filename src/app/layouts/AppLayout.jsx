import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BellAlert, ChevronDown, Menu } from 'reicon-react';
import { Icon, IconButton } from '@/shared/ui';
import { getNavigationItem, navigationItems } from '../navigation.js';

export default function AppLayout() {
  const { pathname } = useLocation();
  const currentPage = getNavigationItem(pathname);

  return (
    <div className="app-shell mesh-forecast">
      <aside className="sidebar" aria-label="주요 메뉴">
        <div className="brand-lockup">
          <div className="brand-mark">H</div>
          <div>
            <strong>현대그린푸드</strong>
            <span>재고 운영 플랫폼</span>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav">
          {navigationItems.map(({ path, label, icon: NavIcon }) => (
            <NavLink
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end
              key={path}
              to={path}
            >
              <Icon icon={NavIcon} size={18} />
              <span>{label}</span>
              {path === '/inventory' && <span className="nav-live">CORE</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-footnote">
          <span className="status-dot" />
          <div>
            <strong>초기 세팅 모드</strong>
            <span>공통 기반을 준비하고 있습니다.</span>
          </div>
        </div>
        <button className="sidebar-account" type="button">
          <span className="avatar">김</span>
          <span className="account-copy"><strong>김명만 수석 MD</strong><small>현대그린푸드 재고운영</small></span>
          <Icon icon={ChevronDown} size={15} />
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <IconButton className="mobile-menu" label="메뉴 열기"><Icon icon={Menu} size={18} /></IconButton>
          <div className="breadcrumb"><span>운영 관제</span><span className="breadcrumb-separator">/</span><strong>{currentPage.label}</strong></div>
          <div className="topbar-actions">
            <span className="sync-status"><span className="status-dot" /> 초기 세팅 단계</span>
            <IconButton label="알림"><Icon icon={BellAlert} size={18} /></IconButton>
            <button className="user-chip" type="button"><span className="avatar small">김</span><span>김명만</span><Icon icon={ChevronDown} size={14} /></button>
          </div>
        </header>

        <div className="content-wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
