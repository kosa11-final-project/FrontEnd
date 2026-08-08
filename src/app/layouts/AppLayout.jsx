import { Outlet } from 'react-router-dom';
import { AppHeader, AppSidebar } from '@/widgets/app-shell';

// DESIGN / APP: 전역 widget 배치와 route Outlet만 담당합니다. 메뉴·헤더 UI를 직접 만들지 않습니다.
export default function AppLayout() {
  return (
    <div className="app-shell mesh-forecast">
      <AppSidebar />

      <main className="main-content">
        <AppHeader />

        <div className="content-wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
