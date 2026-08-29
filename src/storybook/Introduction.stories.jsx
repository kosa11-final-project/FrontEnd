const catalogSections = [
  {
    name: 'Foundations',
    description: '색상, 타이포그래피, 간격처럼 모든 화면이 공유하는 기준입니다.',
  },
  {
    name: 'Shared UI',
    description: '버튼, 입력, 테이블, 피드백 등 재사용 가능한 공통 UI입니다.',
  },
  {
    name: 'Entities',
    description: '재고, 수요예측, 위험도, 전략처럼 도메인 단위로 묶은 UI입니다.',
  },
  {
    name: 'Features',
    description: '필터, 동기화처럼 사용자 작업을 완성하는 기능 단위입니다.',
  },
  {
    name: 'Widgets',
    description: '여러 컴포넌트를 조합한 업무 화면 블록입니다.',
  },
  {
    name: 'Pages',
    description: '실제 라우트와 업무 흐름을 기준으로 확인하는 전체 화면입니다.',
  },
  {
    name: 'Prototypes',
    description: '검증 중인 실험적 UI입니다. 운영 컴포넌트와 구분해 관리합니다.',
  },
];

const meta = {
  title: 'Introduction',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'StockFit Storybook은 공통 UI부터 실제 업무 화면까지 계층별로 탐색할 수 있는 컴포넌트 카탈로그입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  render: () => (
    <main className="min-h-screen bg-[var(--background)] px-6 py-12 text-[color:var(--text-body)] sm:px-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--primary)]">StockFit Storybook</p>
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--text-heading)] sm:text-4xl">
            컴포넌트와 업무 화면 카탈로그
          </h1>
          <p className="text-base leading-7 text-[color:var(--text-muted)]">
            왼쪽 사이드바에서 화면의 범위에 맞는 카테고리를 선택하세요. 공통 UI는 Shared UI에서, 실제 업무 흐름은
            Pages에서 확인할 수 있습니다.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalogSections.map((section) => (
            <article
              key={section.name}
              className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
            >
              <h2 className="text-base font-bold text-[color:var(--text-heading)]">{section.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">{section.description}</p>
            </article>
          ))}
        </div>

        <aside className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-subtle)] p-5 text-sm leading-6">
          <strong className="text-[color:var(--text-heading)]">찾는 방법</strong>
          <p className="mt-1 text-[color:var(--text-muted)]">
            사이드바 검색에서 컴포넌트명이나 업무 키워드를 입력하면 제목과 스토리 이름을 함께 검색할 수 있습니다. 각
            컴포넌트의 Docs 페이지에는 사용 가능한 상태와 예제가 모여 있습니다.
          </p>
        </aside>
      </div>
    </main>
  ),
};
