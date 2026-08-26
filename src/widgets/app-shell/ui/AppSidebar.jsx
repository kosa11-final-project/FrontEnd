import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { Sidebar2 } from 'reicon-react';
import {
  Icon,
  IconButton,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui';
import { navigationItems } from '../model/navigation.js';

// DESIGN / WIDGET: 앱 셸의 메뉴 조합만 담당합니다. 시각 primitive는 shared/ui/sidebar에서 재사용합니다.
function AppSidebar({ isOpen = true, onToggle }) {
  return (
    <Sidebar id="app-sidebar" aria-label="주요 메뉴">
      <SidebarHeader className="brand-lockup">
        <img className="brand-logo" src="/assets/brand/stockfit-sidebar-logo.png" alt="StockFit 로고" />
        {isOpen ? (
          <div className="brand-copy">
            <strong>StockFit</strong>
          </div>
        ) : null}
        {onToggle ? (
          <IconButton
            className="sidebar-toggle"
            label={isOpen ? '사이드바 닫기' : '사이드바 열기'}
            aria-controls="app-sidebar"
            aria-expanded={isOpen}
            variant="ghost"
            onClick={onToggle}
          >
            <Icon icon={Sidebar2} size={18} />
          </IconButton>
        ) : null}
      </SidebarHeader>

      <SidebarContent className="sidebar-content" aria-hidden={!isOpen} inert={!isOpen}>
        <SidebarMenu aria-label="업무 메뉴">
          {navigationItems.map(({ path, label, icon: NavIcon }) => (
            <SidebarMenuItem key={path}>
              <SidebarMenuButton asChild>
                <NavLink to={path}>
                  <Icon icon={NavIcon} size={18} />
                  <span>{label}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

export default memo(AppSidebar);
