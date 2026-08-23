import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Icon,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
