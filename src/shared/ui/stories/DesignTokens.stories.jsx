import { useState } from 'react';
import { Badge, Button, Input, MetricCard, Select, Table, TableElement } from '@/shared/ui';
import {
  formatCurrency,
  formatDateTime,
  formatDaysRemaining,
  formatNumber,
  formatPercent,
  formatQuantity,
} from '@/shared/lib/format';
import { Database, Warning } from 'reicon-react';

const palette = [
  { name: 'main', token: '--color-main', foreground: 'var(--color-white)' },
  { name: 'sub-mint', token: '--color-sub-mint', foreground: 'var(--color-white)' },
  { name: 'sub-cyan', token: '--color-sub-cyan', foreground: 'var(--color-white)' },
  { name: 'sub-orange', token: '--color-sub-orange', foreground: 'var(--color-gray-900)' },
  { name: 'sub-mint-soft', token: '--color-sub-mint-soft', foreground: 'var(--color-gray-900)' },
  { name: 'sub-cyan-soft', token: '--color-sub-cyan-soft', foreground: 'var(--color-gray-900)' },
  { name: 'sub-orange-soft', token: '--color-sub-orange-soft', foreground: 'var(--color-gray-900)' },
  { name: 'danger', token: '--color-danger', foreground: 'var(--color-white)' },
  { name: 'danger-soft', token: '--color-danger-soft', foreground: 'var(--color-danger)' },
  { name: 'gray-900', token: '--color-gray-900', foreground: 'var(--color-white)' },
  { name: 'gray-700', token: '--color-gray-700', foreground: 'var(--color-white)' },
  { name: 'gray-500', token: '--color-gray-500', foreground: 'var(--color-white)' },
  { name: 'gray-300', token: '--color-gray-300', foreground: 'var(--color-gray-900)' },
  { name: 'gray-200', token: '--color-gray-200', foreground: 'var(--color-gray-900)' },
  { name: 'gray-50', token: '--color-gray-50', foreground: 'var(--color-gray-900)' },
];

const typography = [
  {
    name: 'Headline1',
    token: '--font-size-headline1',
    weightToken: '--font-weight-headline1',
    line: '--line-height-headline1',
    sample: '통합 재고 조회',
  },
  {
    name: 'Headline2',
    token: '--font-size-headline2',
    weightToken: '--font-weight-headline2',
    line: '--line-height-headline2',
    sample: 'LOT별 재고 현황',
  },
  {
    name: 'Subtitle1',
    token: '--font-size-subtitle1',
    weightToken: '--font-weight-subtitle1',
    line: '--line-height-subtitle1',
    sample: '재고 범위와 판매처',
  },
  {
    name: 'Subtitle2',
    token: '--font-size-subtitle2',
    weightToken: '--font-weight-subtitle2',
    line: '--line-height-subtitle2',
    sample: '판매 가능 수량',
  },
  {
    name: 'Body1',
    token: '--font-size-body1',
    weightToken: '--font-weight-body1',
    line: '--line-height-body1',
    sample: '현재고와 가용수량을 비교합니다.',
  },
  {
    name: 'Body2',
    token: '--font-size-body2',
    weightToken: '--font-weight-body2',
    line: '--line-height-body2',
    sample: '전체 판매처 기준',
  },
  {
    name: 'Description',
    token: '--font-size-description',
    weightToken: '--font-weight-description',
    line: '--line-height-description',
    sample: '소비기한과 출고 순서를 확인합니다.',
  },
];

const fontWeights = [
  { name: 'Regular', token: '--font-weight-regular', usage: '기본 본문·설명' },
  { name: 'Medium', token: '--font-weight-medium', usage: '필터 값·보조 라벨' },
  { name: 'Semibold', token: '--font-weight-semibold', usage: '버튼·카드 제목·표 헤더' },
  { name: 'Bold', token: '--font-weight-bold', usage: '페이지 제목·핵심 수치' },
  { name: 'ExtraBold', token: '--font-weight-extrabold', usage: '제한적인 강조용' },
];

const spacingTokens = [
  { name: 'space/1', token: '--space-1', usage: '아이콘·세밀한 간격' },
  { name: 'space/2', token: '--space-2', usage: '필드·아이콘 간격' },
  { name: 'space/3', token: '--space-3', usage: '바·카드 내부 간격' },
  { name: 'space/4', token: '--space-4', usage: '요소 그룹 간격' },
  { name: 'space/5', token: '--space-5', usage: '카드·패널 padding' },
  { name: 'space/6', token: '--space-6', usage: '페이지·섹션 간격' },
  { name: 'space/8', token: '--space-8', usage: '큰 섹션 간격' },
  { name: 'space/10', token: '--space-10', usage: '페이지 큰 여백' },
  { name: 'space/12', token: '--space-12', usage: '큰 화면 분리' },
];

const semanticSpacingTokens = [
  { name: 'page/x', token: '--spacing-page-x', usage: '페이지 좌우 여백' },
  { name: 'page/y', token: '--spacing-page-y', usage: '페이지 상하 여백' },
  { name: 'section/gap', token: '--spacing-section-gap', usage: '섹션 사이 간격' },
  { name: 'panel/gap', token: '--spacing-panel-gap', usage: '패널 사이 간격' },
  { name: 'card/padding', token: '--spacing-card-padding', usage: '카드 내부 여백' },
  { name: 'table/cell-x', token: '--spacing-table-cell-x', usage: '표 셀 좌우 여백' },
  { name: 'table/cell-y', token: '--spacing-table-cell-y', usage: '표 셀 상하 여백' },
];

const controlTokens = [
  { name: 'control/sm', token: '--control-height-sm', usage: '작은 버튼·보조 필터' },
  { name: 'control/default', token: '--control-height-default', usage: '기본 버튼·입력·Select' },
  { name: 'control/lg', token: '--control-height-lg', usage: '강조 버튼·큰 입력' },
];

const semanticTokens = [
  { name: 'background', token: '--background', usage: '앱 전체 배경' },
  { name: 'surface', token: '--surface', usage: '카드·작업 표면' },
  { name: 'surface-subtle', token: '--surface-subtle', usage: '필터·헤더·보조 표면' },
  { name: 'primary', token: '--primary', usage: '주요 액션·선택 상태' },
  { name: 'primary-soft', token: '--primary-soft', usage: 'hover·선택 보조 배경' },
  { name: 'text-heading', token: '--text-heading', usage: '제목·핵심 수치' },
  { name: 'text-body', token: '--text-body', usage: '본문·표 셀' },
  { name: 'text-muted', token: '--text-muted', usage: '설명·메타데이터' },
  { name: 'border', token: '--border', usage: '기본 구분선' },
  { name: 'ring', token: '--ring', usage: '키보드 포커스 링' },
  { name: 'overlay', token: '--overlay', usage: 'Drawer 배경 dimmer' },
  { name: 'good', token: '--good', usage: '양호·가용수량' },
  { name: 'info', token: '--info', usage: '보통·정보' },
  { name: 'warning', token: '--warning', usage: '주의' },
  { name: 'danger', token: '--danger', usage: '위험·오류' },
];

const shapeTokens = [
  { name: 'field gap', token: '--spacing-field-gap', usage: '필터 필드 사이 간격' },
  { name: 'bar gap', token: '--spacing-bar-gap', usage: '툴바·요약 바 간격' },
  { name: 'control radius', token: '--radius-control', usage: '버튼·입력·badge' },
  { name: 'bar radius', token: '--radius-bar', usage: '필터 바·그룹 표면' },
  { name: 'card radius', token: '--radius-card', usage: '카드 표면' },
  { name: 'panel radius', token: '--radius-panel', usage: '카드·작업 패널' },
  { name: 'panel shadow', token: '--shadow-panel', usage: 'Mesh 요약 표면' },
  { name: 'soft shadow', token: '--shadow-soft', usage: 'hover·보조 표면' },
];

function readToken(token) {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

function tokenPixels(token) {
  const value = readToken(token);
  if (!value.endsWith('rem')) return value;
  const rootSize =
    typeof window === 'undefined' ? 16 : Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return `${Math.round(Number.parseFloat(value) * rootSize)}px`;
}

function PaletteGrid() {
  return (
    <div className="grid w-full max-w-[840px] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {palette.map(({ name, token, foreground }) => (
        <div
          key={name}
          className="min-h-24 rounded-[var(--radius-control)] border border-[var(--border)] p-3"
          style={{ backgroundColor: `var(${token})`, color: foreground }}
        >
          <strong className="block text-[length:var(--font-size-body2)] font-bold">{name}</strong>
          <span className="mt-1 block text-[length:var(--font-size-description)] opacity-80">{readToken(token)}</span>
          <span className="mt-2 block text-[0.625rem] opacity-70">{token}</span>
        </div>
      ))}
    </div>
  );
}

function TypographyScale() {
  return (
    <div className="w-full max-w-[840px] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)]">
      {typography.map(({ name, token, weightToken, line, sample }) => (
        <div
          key={name}
          className="grid grid-cols-[110px_1fr_86px] items-center gap-3 border-b border-[var(--border)] p-4 last:border-b-0 sm:grid-cols-[140px_1fr_100px]"
        >
          <div>
            <strong className="block text-[length:var(--font-size-body2)] font-bold text-[color:var(--text-heading)]">
              {name}
            </strong>
            <span className="mt-1 block break-all text-[0.625rem] text-[color:var(--text-muted)]">{token}</span>
          </div>
          <p
            style={{ fontSize: `var(${token})`, lineHeight: `var(${line})`, fontWeight: `var(${weightToken})` }}
            className="min-w-0 break-words text-[color:var(--text-heading)]"
          >
            {sample}
          </p>
          <span className="text-right text-[length:var(--font-size-body2)] tabular-nums text-[color:var(--text-muted)]">
            {readToken(token)} · {tokenPixels(token)}
            <br />
            {readToken(weightToken)}
          </span>
        </div>
      ))}
    </div>
  );
}

function FontWeightScale() {
  return (
    <div className="grid w-full max-w-[840px] gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fontWeights.map(({ name, token, usage }) => (
        <div key={name} className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] p-4">
          <p
            className="text-[length:var(--font-size-subtitle1)] text-[color:var(--text-heading)]"
            style={{ fontWeight: `var(${token})` }}
          >
            Pretendard {name}
          </p>
          <code className="mt-2 block text-[length:var(--font-size-meta)]">
            {token} · {readToken(token)}
          </code>
          <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">{usage}</span>
        </div>
      ))}
    </div>
  );
}

function SpacingScale({ tokens }) {
  return (
    <div className="w-full max-w-[920px] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)]">
      {tokens.map(({ name, token, usage }) => (
        <div
          key={token}
          className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3 border-b border-[var(--border)] p-3 last:border-b-0 sm:grid-cols-[140px_minmax(0,1fr)_180px]"
        >
          <strong className="text-[length:var(--font-size-body2)] text-[color:var(--text-heading)]">{name}</strong>
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="block h-3 max-w-full shrink-0 rounded-[var(--radius-control)] bg-[var(--primary)]"
              style={{ width: `var(${token})` }}
              aria-hidden="true"
            />
            <span className="truncate text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">{usage}</span>
          </div>
          <code className="hidden text-right text-[length:var(--font-size-meta)] tabular-nums sm:block">
            {token} · {readToken(token)} {tokenPixels(token)}
          </code>
        </div>
      ))}
    </div>
  );
}

function ControlTokenGrid() {
  return (
    <div className="grid w-full max-w-[920px] gap-3 sm:grid-cols-3">
      {controlTokens.map(({ name, token, usage }) => (
        <div
          key={token}
          className="flex flex-col justify-between rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] p-4"
        >
          <div>
            <strong className="block text-[length:var(--font-size-body2)] text-[color:var(--text-heading)]">
              {name}
            </strong>
            <code className="mt-1 block text-[length:var(--font-size-meta)]">
              {token} · {readToken(token)} {tokenPixels(token)}
            </code>
            <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
              {usage}
            </span>
          </div>
          <div
            className="mt-4 flex items-center rounded-[var(--radius-control)] bg-[var(--primary-soft)] px-3 text-[length:var(--font-size-body2)] font-[var(--font-weight-button)] text-[color:var(--primary)]"
            style={{ height: `var(${token})` }}
          >
            control height
          </div>
        </div>
      ))}
    </div>
  );
}

function SemanticTokenGrid() {
  return (
    <div className="grid w-full max-w-[900px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {semanticTokens.map(({ name, token, usage }) => (
        <div
          key={name}
          className="grid min-h-20 grid-cols-[44px_1fr] items-center gap-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] p-3"
        >
          <span
            className="size-10 rounded-[var(--radius-control)] border border-[var(--border)]"
            style={{ backgroundColor: `var(${token})` }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <strong className="block text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
              {name}
            </strong>
            <code className="block break-all text-[length:var(--font-size-meta)]">
              {token} · {readToken(token)}
            </code>
            <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
              {usage}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShapeTokenGrid() {
  return (
    <div className="grid w-full max-w-[900px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {shapeTokens.map(({ name, token, usage }) => (
        <div
          key={name}
          className="min-h-28 border border-[var(--border)] bg-[var(--card)] p-4"
          style={{
            borderRadius: token.includes('radius') ? `var(${token})` : 'var(--radius-control)',
            boxShadow: token.includes('shadow') ? `var(${token})` : 'none',
          }}
        >
          <strong className="block text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">
            {name}
          </strong>
          <code className="mt-1 block break-all text-[length:var(--font-size-meta)]">
            {token} · {readToken(token)}
          </code>
          <span className="mt-2 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">{usage}</span>
        </div>
      ))}
    </div>
  );
}

function MotionPreview() {
  const [active, setActive] = useState(false);
  return (
    <div className="flex w-full max-w-[900px] flex-wrap items-center gap-4 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-5">
      <button
        type="button"
        className="rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-[length:var(--font-size-body-sm)] font-[var(--font-weight-semibold)] text-[color:var(--text-heading)] transition-[transform,box-shadow,border-color] duration-[var(--motion-standard)] ease-[var(--easing-standard)] hover:-translate-y-px hover:border-[var(--primary)] hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        onClick={() => setActive((current) => !current)}
      >
        모션 토큰 미리보기
      </button>
      <div
        className="flex size-16 items-center justify-center rounded-[var(--radius-panel)] bg-[var(--primary-soft)] text-[color:var(--primary)]"
        style={{
          transition: 'transform var(--motion-standard) var(--easing-standard)',
          transform: active ? 'translateX(24px) rotate(4deg)' : 'translateX(0)',
        }}
        aria-label={active ? '이동된 상태' : '기본 상태'}
      >
        <Database size={22} weight="Outline" />
      </div>
      <div className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
        <code>--motion-standard · {readToken('--motion-standard')}</code>
        <br />
        <code>--easing-standard · {readToken('--easing-standard')}</code>
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Design Tokens',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Pretendard typography scale, Dashboard Filter Foundations color token, semantic 역할, 간격, 반경, 그림자, 모션의 현재 값을 확인합니다. 스토리는 styles.css의 CSS 변수를 브라우저에서 직접 읽습니다.',
      },
    },
  },
};
export default meta;

export const Colors = {
  render: () => (
    <section className="w-full max-w-[900px]">
      <div className="mb-4">
        <h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">
          Dashboard Filter Foundations
        </h2>
        <p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">
          색상값은 src/styles.css의 원시 토큰을 직접 읽습니다.
        </p>
      </div>
      <PaletteGrid />
    </section>
  ),
  parameters: {
    docs: {
      source: {
        code: `<div style={{ backgroundColor: 'var(--color-main)' }}>main</div>
<div style={{ backgroundColor: 'var(--color-sub-cyan)' }}>sub-cyan</div>
<div style={{ backgroundColor: 'var(--color-sub-orange)' }}>sub-orange</div>`,
      },
    },
  },
};

export const Typography = {
  render: () => (
    <section className="w-full max-w-[900px]">
      <div className="mb-4">
        <h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">
          Pretendard
        </h2>
        <p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">
          Bold · Semibold · Regular · rem token
        </p>
      </div>
      <TypographyScale />
      <h3 className="mb-3 mt-6 text-[length:var(--font-size-subtitle1)] font-[var(--font-weight-subtitle1)] text-[color:var(--text-heading)]">
        Font weight tokens
      </h3>
      <FontWeightScale />
    </section>
  ),
  parameters: {
    docs: {
      source: {
        code: `<p className="text-[length:var(--font-size-headline1)] font-[var(--font-weight-headline1)] leading-[var(--line-height-headline1)]">Headline1</p>
<p className="text-[length:var(--font-size-headline2)]">Headline2</p>
<p className="text-[length:var(--font-size-subtitle1)]">Subtitle1</p>
<p className="text-[length:var(--font-size-body1)]">Body1</p>
<p className="text-[length:var(--font-size-description)] font-[var(--font-weight-description)] leading-[var(--line-height-description)]">Description</p>

<span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Semibold</span>`,
      },
    },
  },
};

export const InteractiveTheme = {
  args: {
    mainColor: readToken('--color-main') || '#27B06E',
    infoColor: readToken('--color-sub-cyan') || '#00B0D7',
    warningColor: readToken('--color-sub-orange') || '#FDA643',
    dangerColor: readToken('--color-danger') || '#D92D20',
    dangerSoftColor: readToken('--color-danger-soft') || '#FEE4E2',
  },
  argTypes: {
    mainColor: { control: 'color', description: 'main과 primary/good 역할에 적용합니다.' },
    infoColor: { control: 'color', description: 'info와 보통 상태에 적용합니다.' },
    warningColor: { control: 'color', description: 'warning과 주의 상태에 적용합니다.' },
    dangerColor: { control: 'color', description: 'danger와 위험 상태에 적용합니다.' },
    dangerSoftColor: { control: 'color', description: 'danger의 soft 배경에 적용합니다.' },
  },
  render: ({ mainColor, infoColor, warningColor, dangerColor, dangerSoftColor }) => (
    <section
      className="grid w-full max-w-[900px] gap-5 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--background)] p-6"
      style={{
        '--color-main': mainColor,
        '--color-sub-cyan': infoColor,
        '--color-sub-orange': warningColor,
        '--color-danger': dangerColor,
        '--color-danger-soft': dangerSoftColor,
        '--primary': 'var(--color-main)',
        '--good': 'var(--color-main)',
        '--info': 'var(--color-sub-cyan)',
        '--warning': 'var(--color-sub-orange)',
        '--danger': 'var(--color-danger)',
        '--danger-soft': 'var(--color-danger-soft)',
        '--ring': 'var(--color-main)',
        '--text-label': 'var(--color-main)',
      }}
    >
      <div>
        <h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">
          Token preview
        </h2>
        <p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">
          Controls에서 main·info·warning 색상을 변경하면 아래 컴포넌트가 함께 변합니다.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary action</Button>
        <Badge variant="good">양호</Badge>
        <Badge variant="info">보통</Badge>
        <Badge variant="warning">주의</Badge>
        <Badge variant="danger">위험</Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MetricCard label="현재고" value="284개" icon={Database} tone="good" />
        <MetricCard label="SKU 위험도" value="주의" icon={Warning} tone="warning" />
      </div>
    </section>
  ),
  parameters: {
    docs: {
      source: {
        code: `<section style={{ '--color-main': mainColor }}>
  <Button>Primary action</Button>
  <Badge variant="good">양호</Badge>
  <MetricCard tone="warning" value="주의" />
</section>`,
      },
    },
  },
};

export const SemanticColors = {
  render: () => (
    <section className="w-full max-w-[920px]">
      <div className="mb-4">
        <h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">
          Semantic color roles
        </h2>
        <p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">
          컴포넌트는 원시 색상 대신 아래 역할 토큰을 사용합니다.
        </p>
      </div>
      <SemanticTokenGrid />
    </section>
  ),
  parameters: {
    docs: {
      source: {
        code: `<div className="bg-[var(--surface)] text-[color:var(--text-heading)]">
  <Button>주요 액션</Button>
  <Badge variant="good">양호</Badge>
  <span className="text-[color:var(--text-muted)]">보조 설명</span>
</div>`,
      },
    },
  },
};

export const SpacingAndShape = {
  render: () => (
    <section className="w-full max-w-[920px]">
      <div className="mb-4">
        <h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">
          Spacing, shape & elevation
        </h2>
        <p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">
          필터 간격, 패널 반경, 표면 그림자는 전역 토큰으로만 조정합니다.
        </p>
      </div>
      <ShapeTokenGrid />
      <h3 className="mb-3 mt-6 text-[length:var(--font-size-subtitle1)] font-[var(--font-weight-subtitle1)] text-[color:var(--text-heading)]">
        Primitive spacing scale
      </h3>
      <SpacingScale tokens={spacingTokens} />
      <h3 className="mb-3 mt-6 text-[length:var(--font-size-subtitle1)] font-[var(--font-weight-subtitle1)] text-[color:var(--text-heading)]">
        Semantic spacing
      </h3>
      <SpacingScale tokens={semanticSpacingTokens} />
      <h3 className="mb-3 mt-6 text-[length:var(--font-size-subtitle1)] font-[var(--font-weight-subtitle1)] text-[color:var(--text-heading)]">
        Control heights
      </h3>
      <ControlTokenGrid />
      <div className="mt-4 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="mb-3 text-[length:var(--font-size-body-sm)] font-semibold text-[color:var(--text-heading)]">
          실제 간격 적용 예시
        </p>
        <div className="flex flex-wrap items-center" style={{ gap: 'var(--spacing-field-gap)' }}>
          <Input className="w-52" placeholder="상품명·SKU 검색" aria-label="상품명·SKU 검색" />
          <Select containerClassName="w-36" aria-label="판매채널">
            <option>전체 채널</option>
          </Select>
          <Button>조회</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center" style={{ gap: 'var(--spacing-bar-gap)' }}>
          <Badge variant="neutral">spacing/field/gap</Badge>
          <Badge variant="info">spacing/bar/gap</Badge>
          <span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            두 토큰은 서로 다른 업무 밀도를 표현합니다.
          </span>
        </div>
      </div>
    </section>
  ),
  parameters: {
    docs: {
      source: {
        code: `<div className="flex items-center" style={{ gap: 'var(--spacing-field-gap)' }}>
  <Input placeholder="상품명·SKU 검색" />
  <Select><option>전체 채널</option></Select>
  <Button>조회</Button>
</div>`,
      },
    },
  },
};

export const MotionAndFocus = {
  render: () => (
    <section className="w-full max-w-[920px]">
      <div className="mb-4">
        <h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">
          Motion & focus
        </h2>
        <p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">
          공통 전환 속도·easing과 키보드 포커스 링을 확인합니다.
        </p>
      </div>
      <MotionPreview />
      <div className="mt-4 grid gap-3 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-5 md:grid-cols-3">
        <Button>기본 포커스 대상</Button>
        <Input placeholder="포커스 링 확인" aria-label="포커스 링 확인" />
        <Select aria-label="상태 선택">
          <option>양호</option>
          <option>주의</option>
        </Select>
      </div>
    </section>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Button className="transition-[transform,box-shadow] duration-[var(--motion-standard)]">기본 포커스 대상</Button>
<Input placeholder="포커스 링 확인" />
<Select><option>양호</option></Select>`,
      },
    },
  },
};

export const DataFormatting = {
  render: () => {
    const examples = [
      { label: '기본 숫자', input: '2058', output: formatNumber(2058), fn: 'formatNumber' },
      { label: '금액', input: '8900', output: formatCurrency(8900), fn: 'formatCurrency' },
      { label: '퍼센트', input: '14.25', output: formatPercent(14.25), fn: 'formatPercent' },
      { label: '수량', input: '205', output: formatQuantity(205), fn: 'formatQuantity' },
      {
        label: '동기화 시각',
        input: '2026-08-08T09:05:00+09:00',
        output: formatDateTime('2026-08-08T09:05:00+09:00'),
        fn: 'formatDateTime',
      },
      { label: '소비기한 잔여일', input: '43', output: formatDaysRemaining(43), fn: 'formatDaysRemaining' },
      { label: '값 없음', input: 'null', output: formatNumber(null), fn: '공통 fallback' },
    ];

    return (
      <section className="w-full max-w-[920px]">
        <div className="mb-4">
          <h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">
            Data formatting
          </h2>
          <p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">
            업무 수치와 날짜는 shared/lib/format의 실제 formatter 결과를 사용합니다.
          </p>
        </div>
        <Table surface="bordered">
          <TableElement>
            <thead className="bg-[var(--surface-subtle)] text-left text-[color:var(--text-heading)]">
              <tr>
                <th className="px-4 py-3">구분</th>
                <th className="px-4 py-3">입력</th>
                <th className="px-4 py-3">출력</th>
                <th className="px-4 py-3">함수</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((example) => (
                <tr key={example.label} className="border-t border-[var(--border)]">
                  <th scope="row" className="px-4 py-3 text-left text-[color:var(--text-body)]">
                    {example.label}
                  </th>
                  <td className="px-4 py-3 tabular-nums text-[color:var(--text-muted)]">{example.input}</td>
                  <td className="px-4 py-3 font-[var(--font-weight-semibold)] tabular-nums text-[color:var(--text-heading)]">
                    {example.output}
                  </td>
                  <td className="px-4 py-3">
                    <code>{example.fn}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableElement>
        </Table>
      </section>
    );
  },
  parameters: {
    docs: {
      source: {
        code: `import { formatCurrency, formatDateTime, formatDaysRemaining, formatNumber, formatPercent, formatQuantity } from '@/shared/lib/format';

formatNumber(2058); // 2,058
formatCurrency(8900); // ₩8,900
formatPercent(14.25); // 14.3%
formatQuantity(205); // 205개
formatDateTime('2026-08-08T09:05:00+09:00'); // 2026.08.08 09:05
formatDaysRemaining(43); // D-43`,
      },
    },
  },
};
