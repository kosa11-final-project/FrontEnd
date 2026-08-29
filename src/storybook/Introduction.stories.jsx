const catalogSections = [
  {
    name: 'Foundations',
    description: '색상, 타이포그래피, 간격처럼 모든 화면이 공유하는 기준입니다.',
    items: [{ name: 'Design Tokens', id: 'foundations-design-tokens', description: '색상·타이포·간격·모션 토큰' }],
  },
  {
    name: 'Shared UI',
    description: '버튼, 입력, 테이블, 피드백 등 재사용 가능한 공통 UI입니다.',
    items: [
      { name: 'Accordion', id: 'shared-ui-accordion', description: '정보 섹션 접기·펼치기' },
      { name: 'Button', id: 'shared-ui-button', description: '업무 행동 버튼과 상태' },
      { name: 'Card', id: 'shared-ui-card', description: '콘텐츠 그룹 표면' },
      { name: 'DataTable', id: 'shared-ui-datatable', description: 'TanStack 기반 데이터 표' },
      { name: 'DetailLayout', id: 'shared-ui-detaillayout', description: '상세 화면 공통 레이아웃' },
      { name: 'Feedback', id: 'shared-ui-feedback', description: '상태·빈 화면·오류 피드백' },
      { name: 'Form Controls', id: 'shared-ui-form-controls', description: '검색·입력·필터 컨트롤' },
      { name: 'IconButton', id: 'shared-ui-iconbutton', description: '아이콘 기반 보조 행동' },
      { name: 'MetricCard', id: 'shared-ui-metriccard', description: '운영 지표 카드' },
      { name: 'Overlay', id: 'shared-ui-overlay', description: '드로어·툴팁 오버레이' },
      { name: 'Select', id: 'shared-ui-select', description: '선택 입력 상태' },
      { name: 'Sidebar', id: 'shared-ui-sidebar', description: '업무 내비게이션' },
      { name: 'Table', id: 'shared-ui-table', description: '기본 표 구조' },
      { name: 'Tabs', id: 'shared-ui-tabs', description: '콘텐츠 전환 탭' },
      { name: 'Toast', id: 'shared-ui-toast', description: '전역 결과 알림' },
    ],
  },
  {
    name: 'Entities',
    description: '재고, 수요예측, 위험도, 전략처럼 도메인 단위로 묶은 UI입니다.',
    items: [
      {
        name: 'Demand Forecast Chart',
        id: 'entities-forecast-demand-forecast-chart',
        description: '수요예측 재고 차트',
      },
      {
        name: 'Demand Forecast State',
        id: 'entities-forecast-demand-forecast-state',
        description: '수요예측 예외 상태',
      },
      {
        name: 'Demand Forecast Table',
        id: 'entities-forecast-demand-forecast-table',
        description: '수요예측 시점별 표',
      },
      { name: 'Inventory Cards', id: 'entities-inventory-cards', description: '재고 범위·위험·LOT 카드' },
      { name: 'Risk Assessment', id: 'entities-risk-assessment', description: '서버 위험 판정 근거' },
      { name: 'Strategy Execution', id: 'entities-strategy-execution', description: '전략 실행 단계와 결과' },
      { name: 'Strategy Generation', id: 'entities-strategy-generation', description: 'AI 전략 생성 상태' },
      {
        name: 'Strategy Action Progress',
        id: 'entities-strategy-action-progress-list',
        description: '전략 액션 진행 목록',
      },
    ],
  },
  {
    name: 'Features',
    description: '필터, 동기화처럼 사용자 작업을 완성하는 기능 단위입니다.',
    items: [
      { name: 'Inventory Filter Modal', id: 'features-inventory-filter-modal', description: '통합재고 상세 필터' },
      { name: 'Inventory Sync Control', id: 'features-inventory-sync-control', description: '재고 동기화 상태와 행동' },
    ],
  },
  {
    name: 'Widgets',
    description: '여러 컴포넌트를 조합한 업무 화면 블록입니다.',
    items: [
      {
        name: 'Dashboard Operations Panel',
        id: 'widgets-dashboard-operations-panel',
        description: '긴급 SKU·위험 판매처 패널',
      },
      {
        name: 'Inventory Detail Drawer',
        id: 'widgets-inventory-detail-drawer',
        description: 'SKU 재고·LOT·예측 상세',
      },
      {
        name: 'Inventory Overview Skeleton',
        id: 'widgets-inventory-detail-drawer-overview-skeleton',
        description: '상세 개요 로딩 상태',
      },
      {
        name: 'Lazy Thumbnail Image',
        id: 'widgets-inventory-lazy-thumbnail-image',
        description: '상품 이미지 지연 로딩',
      },
      {
        name: 'Inventory Location Overview',
        id: 'widgets-inventory-location-overview',
        description: '재고 위치별 현황',
      },
      { name: 'Inventory Summary Bar', id: 'widgets-inventory-summary-bar', description: '통합재고 핵심 지표' },
      { name: 'Inventory Table', id: 'widgets-inventory-table', description: '통합재고 업무 표' },
      {
        name: 'Strategy Execution Card',
        id: 'widgets-strategy-execution-card',
        description: '전략 실행 관제 카드',
      },
      {
        name: 'Strategy Request Modal',
        id: 'widgets-strategy-request-modal',
        description: 'AI 전략 생성 요청',
      },
    ],
  },
  {
    name: 'App Shell',
    description: '사이드바와 헤더를 포함한 전역 애플리케이션 프레임입니다.',
    items: [{ name: 'Navigation', id: 'app-shell-navigation', description: '사이드바·헤더·업무 페이지 프레임' }],
  },
  {
    name: 'Pages',
    description: '실제 라우트와 업무 흐름을 기준으로 확인하는 전체 화면입니다.',
    items: [
      { name: 'AI Strategy', id: 'pages-ai-strategy', description: '전략 생성·상세·시뮬레이션' },
      { name: 'Dashboard', id: 'pages-dashboard', description: '재고 운영 대시보드' },
      { name: 'Execution', id: 'pages-execution', description: 'AI 전략 실행 관제' },
      { name: 'Integrated Inventory', id: 'pages-integrated-inventory', description: '통합재고 조회와 상세' },
      {
        name: 'Integrated Inventory Loading',
        id: 'pages-loading-states-integrated-inventory',
        description: '통합재고 라우트 로딩',
      },
      { name: 'Statistics', id: 'pages-statistics', description: '운영·AI 전략 성과 통계' },
    ],
  },
];

const docsCount = catalogSections.reduce((count, section) => count + section.items.length, 0);

const meta = {
  title: 'Introduction',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'StockFit Storybook의 전체 Docs를 분류별 인덱스에서 한눈에 찾고 바로 이동할 수 있습니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  render: () => (
    <main className="min-h-screen bg-[var(--background)] px-6 py-12 text-[color:var(--text-body)] sm:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="max-w-4xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--primary)]">StockFit Storybook</p>
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--text-heading)] sm:text-4xl">
            전체 Docs 한눈에 보기
          </h1>
          <p className="text-base leading-7 text-[color:var(--text-muted)]">
            현재 관리 중인 {docsCount}개 Docs를 레이어별로 모았습니다. 항목을 선택하면 해당 컴포넌트의 사용법, 상태,
            Controls와 예제를 바로 확인할 수 있습니다.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {catalogSections.map((section) => (
            <article
              key={section.name}
              className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[color:var(--text-heading)]">{section.name}</h2>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">{section.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--primary-strong)]">
                  {section.items.length}
                </span>
              </div>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <a
                      aria-label={`${item.name} Docs 열기`}
                      className="group flex min-h-20 flex-col justify-between rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-3 transition hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] focus-visible:border-[var(--primary)]"
                      href={`./?path=/docs/${item.id}--docs`}
                      target="_top"
                    >
                      <span className="flex items-center justify-between gap-3 text-sm font-semibold text-[color:var(--text-heading)]">
                        {item.name}
                        <span
                          aria-hidden="true"
                          className="text-[color:var(--primary)] transition-transform group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </span>
                      <span className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{item.description}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <aside className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-subtle)] p-5 text-sm leading-6">
          <strong className="text-[color:var(--text-heading)]">찾는 방법</strong>
          <p className="mt-1 text-[color:var(--text-muted)]">
            이 인덱스에서 원하는 Docs를 바로 열거나, 왼쪽 사이드바 검색에서 컴포넌트명과 업무 키워드를 입력하세요.
            Prototypes는 검증 중인 Canvas 스토리이므로 Docs 인덱스와 분리되어 있습니다.
          </p>
        </aside>
      </div>
    </main>
  ),
};
