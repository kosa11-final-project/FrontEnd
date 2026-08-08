import { ChartBar, Database, Grid } from 'reicon-react';
import {
  Icon,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui';

const meta = {
  title: 'Shared UI/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;

export const ActiveMenu = {
  render: () => (
    <div className="min-h-[520px]">
      <Sidebar className="min-h-screen">
        <SidebarHeader className="brand-lockup">
          <div className="brand-mark">H</div>
          <div>
            <strong>현대그린푸드</strong>
            <span>재고 운영 플랫폼</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu aria-label="스토리 메뉴">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button type="button">
                  <Icon icon={Grid} size={18} />
                  <span>대시보드</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button type="button" aria-current="page">
                  <Icon icon={Database} size={18} />
                  <span>통합 재고 조회</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button type="button">
                  <Icon icon={ChartBar} size={18} />
                  <span>통계</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <button className="sidebar-account" type="button">
            <span className="brand-mark">김</span>
            <span className="account-copy">
              <strong>김명만 수석 MD</strong>
              <small>현대그린푸드 재고운영</small>
            </span>
          </button>
        </SidebarFooter>
      </Sidebar>
    </div>
  ),
};
