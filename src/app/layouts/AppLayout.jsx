import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AiStrategyEventsSubscriber } from '../providers/AiStrategyEventsSubscriber.jsx';
import { AppHeader, AppSidebar } from '@/widgets/app-shell';

// DESIGN / APP: 전역 widget 배치와 route Outlet만 담당합니다. 메뉴·헤더 UI를 직접 만들지 않습니다.
export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { pathname } = useLocation();
  const isDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  return (
    <div className={`app-shell mesh-forecast${isSidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <AiStrategyEventsSubscriber />
      <AppSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)} />

      <main className="main-content">
        <AppHeader />

        <div className={`content-wrap${isDashboardRoute ? ' dashboard-content-wrap' : ''}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
