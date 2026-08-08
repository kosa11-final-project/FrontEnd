import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'reicon-react';
import {
  Avatar,
  Icon,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  StatusDot,
} from '@/shared/ui';
import { navigationItems } from '../model/navigation.js';

// DESIGN / WIDGET: 앱 셸의 메뉴 조합만 담당합니다. 시각 primitive는 shared/ui/sidebar에서 재사용합니다.
function AppSidebar() {
  return (
    <Sidebar aria-label="주요 메뉴">
      <SidebarHeader className="brand-lockup">
        <div className="brand-mark">H</div>
        <div>
          <strong>현대그린푸드</strong>
          <span>재고 운영 플랫폼</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="workspace-label">WORKSPACE</div>
        <SidebarMenu aria-label="업무 메뉴">
          {navigationItems.map(({ path, label, icon: NavIcon }) => (
            <SidebarMenuItem key={path}>
              <SidebarMenuButton asChild>
                <NavLink end to={path}>
                  <Icon icon={NavIcon} size={18} />
                  <span>{label}</span>
                  {path === '/inventory' && <span className="nav-live">CORE</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <div className="sidebar-spacer" />

      <SidebarFooter>
        <div className="sidebar-footnote">
          <StatusDot className="mt-[3px]" />
          <div>
            <strong>초기 세팅 모드</strong>
            <span className="sidebar-footnote-detail">공통 기반을 준비하고 있습니다.</span>
          </div>
        </div>
        <button className="sidebar-account" type="button">
          <Avatar>김</Avatar>
          <span className="account-copy">
            <strong>김명만 수석 MD</strong>
            <small>현대그린푸드 재고운영</small>
          </span>
          <Icon icon={ChevronDown} size={15} />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

export default memo(AppSidebar);
