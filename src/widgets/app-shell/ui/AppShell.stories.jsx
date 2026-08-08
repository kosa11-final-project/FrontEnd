import { MemoryRouter } from 'react-router-dom';
import { ArrowRight, ChartBar, Database, Refresh } from 'reicon-react';
import { Button, Icon } from '@/shared/ui';
import { AppHeader } from './AppHeader.jsx';
import AppSidebar from './AppSidebar.jsx';

const meta = {
  title: 'App Shell/Foundations',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '실제 AppSidebar·AppHeader와 src/styles.css의 app-shell, Mesh Forecast, page 레이아웃을 함께 확인합니다.',
      },
    },
  },
};

export default meta;

export const MeshForecastShell = {
  render: () => (
    <MemoryRouter initialEntries={['/inventory']}>
      <div className="app-shell min-h-[760px]">
        <AppSidebar />
        <main className="main-content">
          <AppHeader />
          <div className="content-wrap">
            <section className="page-shell">
              <div className="page-heading">
                <div>
                  <h1>통합 재고 조회</h1>
                  <p>판매처별 재고 흐름과 위험 품목을 한 화면에서 비교합니다.</p>
                </div>
                <Button variant="secondary">
                  <Icon icon={Refresh} size={16} />
                  데이터 동기화
                </Button>
              </div>

              <section className="mesh-hero" aria-label="요약 표면">
                <div>
                  <h2>현대그린푸드 재고 네트워크</h2>
                  <p>요약 정보와 다음 작업을 연결하는 표면으로 사용하고, 실제 데이터 영역은 불투명하게 유지합니다.</p>
                </div>
                <div className="mesh-hero-mark" aria-hidden="true">
                  <Icon icon={Database} size={32} />
                </div>
              </section>

              <div className="setup-grid">
                <article className="setup-card">
                  <div className="setup-card-icon">
                    <Icon icon={Database} size={18} />
                  </div>
                  <div>
                    <h2>현재고·가용수량 비교</h2>
                    <p>현재고와 판매 가능 수량을 분리해 위험 재고를 먼저 확인합니다.</p>
                  </div>
                  <span className="setup-card-meta">284개</span>
                  <Button className="ui-button" variant="ghost" size="sm">
                    재고 표 열기 <Icon icon={ArrowRight} size={14} />
                  </Button>
                </article>
                <article className="setup-card">
                  <div className="setup-card-icon">
                    <Icon icon={ChartBar} size={18} />
                  </div>
                  <div>
                    <h2>위험등급 흐름</h2>
                    <p>양호·보통·주의·위험 상태를 텍스트와 의미 색상으로 함께 표현합니다.</p>
                  </div>
                  <span className="setup-card-meta">12 SKU</span>
                  <Button className="ui-button" variant="ghost" size="sm">
                    분석 보기 <Icon icon={ArrowRight} size={14} />
                  </Button>
                </article>
              </div>
            </section>
          </div>
        </main>
      </div>
    </MemoryRouter>
  ),
  parameters: {
    docs: {
      source: {
        code: `<MemoryRouter initialEntries={['/inventory']}>
  <div className="app-shell">
    <AppSidebar />
    <main className="main-content">
      <AppHeader />
      <div className="content-wrap">
        <section className="mesh-hero">요약 표면</section>
        <div className="setup-grid">업무 카드</div>
      </div>
    </main>
  </div>
</MemoryRouter>`,
      },
    },
  },
};

export const AppHeaderOnly = {
  render: () => (
    <MemoryRouter initialEntries={['/inventory']}>
      <div className="app-shell min-h-[120px]">
        <main className="main-content" style={{ width: '100%', marginLeft: 0 }}>
          <AppHeader />
        </main>
      </div>
    </MemoryRouter>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '라우터 경로에 따라 breadcrumb만 갱신되는 앱 헤더 단독 상태입니다. 초기 세팅 안내 문구 없이 알림과 사용자 메뉴만 표시합니다.',
      },
      source: {
        code: `<MemoryRouter initialEntries={['/inventory']}>
  <AppHeader />
</MemoryRouter>`,
      },
    },
  },
};

export const AppSidebarOnly = {
  render: () => (
    <MemoryRouter initialEntries={['/inventory']}>
      <div className="app-shell min-h-[760px]">
        <AppSidebar />
        <main className="main-content" aria-hidden="true" />
      </div>
    </MemoryRouter>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: '현대그린푸드 업무 메뉴와 사용자 계정 영역을 포함한 사이드바 단독 상태입니다.',
      },
      source: {
        code: `<MemoryRouter initialEntries={['/inventory']}>
  <AppSidebar />
</MemoryRouter>`,
      },
    },
  },
};
