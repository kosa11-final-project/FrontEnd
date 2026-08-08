import { useState } from 'react';
import { Badge, Button, Input, MetricCard, Select } from '@/shared/ui';
import { Database, Warning } from 'reicon-react';

const palette = [
  { name: 'main', token: '--color-main', foreground: 'var(--color-white)' },
  { name: 'sub-mint', token: '--color-sub-mint', foreground: 'var(--color-white)' },
  { name: 'sub-cyan', token: '--color-sub-cyan', foreground: 'var(--color-white)' },
  { name: 'sub-orange', token: '--color-sub-orange', foreground: 'var(--color-gray-900)' },
  { name: 'sub-mint-soft', token: '--color-sub-mint-soft', foreground: 'var(--color-gray-900)' },
  { name: 'sub-cyan-soft', token: '--color-sub-cyan-soft', foreground: 'var(--color-gray-900)' },
  { name: 'sub-orange-soft', token: '--color-sub-orange-soft', foreground: 'var(--color-gray-900)' },
  { name: 'gray-900', token: '--color-gray-900', foreground: 'var(--color-white)' },
  { name: 'gray-700', token: '--color-gray-700', foreground: 'var(--color-white)' },
  { name: 'gray-500', token: '--color-gray-500', foreground: 'var(--color-white)' },
  { name: 'gray-300', token: '--color-gray-300', foreground: 'var(--color-gray-900)' },
  { name: 'gray-200', token: '--color-gray-200', foreground: 'var(--color-gray-900)' },
  { name: 'gray-50', token: '--color-gray-50', foreground: 'var(--color-gray-900)' },
];

const typography = [
  { name: 'Headline1', token: '--font-size-headline1', weightToken: '--font-weight-bold', line: '--line-height-headline1', sample: '통합 재고 관제' },
  { name: 'Headline2', token: '--font-size-headline2', weightToken: '--font-weight-bold', line: '--line-height-headline2', sample: 'LOT별 재고 현황' },
  { name: 'Subtitle1', token: '--font-size-subtitle1', weightToken: '--font-weight-bold', line: '--line-height-subtitle1', sample: '재고 범위와 판매처' },
  { name: 'Subtitle2', token: '--font-size-subtitle2', weightToken: '--font-weight-semibold', line: '--line-height-subtitle2', sample: '판매 가능 수량' },
  { name: 'Body1', token: '--font-size-body1', weightToken: '--font-weight-regular', line: '--line-height-body', sample: '현재고와 가용수량을 비교합니다.' },
  { name: 'Body2', token: '--font-size-body2', weightToken: '--font-weight-medium', line: '--line-height-body', sample: '전체 판매처 기준' },
  { name: 'Description', token: '--font-size-description', weightToken: '--font-weight-regular', line: '--line-height-meta', sample: '소비기한과 출고 순서를 확인합니다.' },
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
  const rootSize = typeof window === 'undefined' ? 16 : Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
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
        <div key={name} className="grid grid-cols-[110px_1fr_86px] items-center gap-3 border-b border-[var(--border)] p-4 last:border-b-0 sm:grid-cols-[140px_1fr_100px]">
          <div>
            <strong className="block text-[length:var(--font-size-body2)] font-bold text-[color:var(--text-heading)]">{name}</strong>
            <span className="mt-1 block break-all text-[0.625rem] text-[color:var(--text-muted)]">{token}</span>
          </div>
          <p style={{ fontSize: `var(${token})`, lineHeight: `var(${line})`, fontWeight: `var(${weightToken})` }} className="min-w-0 break-words text-[color:var(--text-heading)]">{sample}</p>
          <span className="text-right text-[length:var(--font-size-body2)] tabular-nums text-[color:var(--text-muted)]">{readToken(token)} · {tokenPixels(token)}<br />{readToken(weightToken)}</span>
        </div>
      ))}
    </div>
  );
}

function SemanticTokenGrid() {
  return (
    <div className="grid w-full max-w-[900px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {semanticTokens.map(({ name, token, usage }) => (
        <div key={name} className="grid min-h-20 grid-cols-[44px_1fr] items-center gap-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] p-3">
          <span className="size-10 rounded-[var(--radius-control)] border border-[var(--border)]" style={{ backgroundColor: `var(${token})` }} aria-hidden="true" />
          <div className="min-w-0">
            <strong className="block text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">{name}</strong>
            <code className="block break-all text-[length:var(--font-size-meta)]">{token} · {readToken(token)}</code>
            <span className="mt-1 block text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">{usage}</span>
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
          <strong className="block text-[length:var(--font-size-body-sm)] text-[color:var(--text-heading)]">{name}</strong>
          <code className="mt-1 block break-all text-[length:var(--font-size-meta)]">{token} · {readToken(token)}</code>
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
        style={{ transition: 'transform var(--motion-standard) var(--easing-standard)', transform: active ? 'translateX(24px) rotate(4deg)' : 'translateX(0)' }}
        aria-label={active ? '이동된 상태' : '기본 상태'}
      >
        <Database size={22} weight="Outline" />
      </div>
      <div className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
        <code>--motion-standard · {readToken('--motion-standard')}</code><br />
        <code>--easing-standard · {readToken('--easing-standard')}</code>
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Design tokens',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Pretendard typography scale, Dashboard Filter Foundations color token, semantic 역할, 간격, 반경, 그림자, 모션의 현재 값을 확인합니다. 스토리는 styles.css의 CSS 변수를 브라우저에서 직접 읽습니다.',
      },
    },
  },
};
export default meta;

export const Colors = {
  render: () => (
    <section className="w-full max-w-[900px]">
      <div className="mb-4"><h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">Dashboard Filter Foundations</h2><p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">색상값은 src/styles.css의 원시 토큰을 직접 읽습니다.</p></div>
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
      <div className="mb-4"><h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">Pretendard</h2><p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">Bold · Semibold · Regular · rem token</p></div>
      <TypographyScale />
    </section>
  ),
  parameters: {
    docs: {
      source: {
        code: `<p className="text-[length:var(--font-size-headline1)]">Headline1</p>
<p className="text-[length:var(--font-size-headline2)]">Headline2</p>
<p className="text-[length:var(--font-size-subtitle1)]">Subtitle1</p>
<p className="text-[length:var(--font-size-body1)]">Body1</p>
<p className="text-[length:var(--font-size-description)]">Description</p>`,
      },
    },
  },
};

export const InteractiveTheme = {
  args: {
    mainColor: readToken('--color-main') || '#27B06E',
    infoColor: readToken('--color-sub-cyan') || '#00B0D7',
    warningColor: readToken('--color-sub-orange') || '#FDA643',
  },
  argTypes: {
    mainColor: { control: 'color', description: 'main과 primary/good 역할에 적용합니다.' },
    infoColor: { control: 'color', description: 'info와 보통 상태에 적용합니다.' },
    warningColor: { control: 'color', description: 'warning/danger 계열에 적용합니다.' },
  },
  render: ({ mainColor, infoColor, warningColor }) => (
    <section
      className="grid w-full max-w-[900px] gap-5 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--background)] p-6"
      style={{
        '--color-main': mainColor,
        '--color-sub-cyan': infoColor,
        '--color-sub-orange': warningColor,
        '--primary': 'var(--color-main)',
        '--good': 'var(--color-main)',
        '--info': 'var(--color-sub-cyan)',
        '--warning': 'var(--color-sub-orange)',
        '--danger': 'var(--color-sub-orange)',
        '--ring': 'var(--color-main)',
        '--text-label': 'var(--color-main)',
      }}
    >
      <div><h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">Token preview</h2><p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">Controls에서 main·info·warning 색상을 변경하면 아래 컴포넌트가 함께 변합니다.</p></div>
      <div className="flex flex-wrap items-center gap-2"><Button>Primary action</Button><Button variant="secondary">Secondary action</Button><Badge variant="good">양호</Badge><Badge variant="info">보통</Badge><Badge variant="warning">주의</Badge><Badge variant="danger">위험</Badge></div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><MetricCard label="현재고" value="284개" icon={Database} tone="good" /><MetricCard label="SKU 위험도" value="주의" icon={Warning} tone="warning" /></div>
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
      <div className="mb-4"><h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">Semantic color roles</h2><p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">컴포넌트는 원시 색상 대신 아래 역할 토큰을 사용합니다.</p></div>
      <SemanticTokenGrid />
    </section>
  ),
  parameters: { docs: { source: { code: `<div className="bg-[var(--surface)] text-[color:var(--text-heading)]">
  <Button>주요 액션</Button>
  <Badge variant="good">양호</Badge>
  <span className="text-[color:var(--text-muted)]">보조 설명</span>
</div>` } } },
};

export const SpacingAndShape = {
  render: () => (
    <section className="w-full max-w-[920px]">
      <div className="mb-4"><h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">Spacing, shape & elevation</h2><p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">필터 간격, 패널 반경, 표면 그림자는 전역 토큰으로만 조정합니다.</p></div>
      <ShapeTokenGrid />
      <div className="mt-4 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="mb-3 text-[length:var(--font-size-body-sm)] font-semibold text-[color:var(--text-heading)]">실제 간격 적용 예시</p>
        <div className="flex flex-wrap items-center" style={{ gap: 'var(--spacing-field-gap)' }}>
          <Input className="w-52" placeholder="상품명·SKU 검색" aria-label="상품명·SKU 검색" />
          <Select containerClassName="w-36" aria-label="판매채널"><option>전체 채널</option></Select>
          <Button>조회</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center" style={{ gap: 'var(--spacing-bar-gap)' }}>
          <Badge variant="neutral">spacing/field/gap</Badge><Badge variant="info">spacing/bar/gap</Badge><span className="text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">두 토큰은 서로 다른 업무 밀도를 표현합니다.</span>
        </div>
      </div>
    </section>
  ),
  parameters: { docs: { source: { code: `<div className="flex items-center" style={{ gap: 'var(--spacing-field-gap)' }}>
  <Input placeholder="상품명·SKU 검색" />
  <Select><option>전체 채널</option></Select>
  <Button>조회</Button>
</div>` } } },
};

export const MotionAndFocus = {
  render: () => (
    <section className="w-full max-w-[920px]">
      <div className="mb-4"><h2 className="text-[length:var(--font-size-headline2)] font-bold text-[color:var(--text-heading)]">Motion & focus</h2><p className="mt-1 text-[length:var(--font-size-description)] text-[color:var(--text-muted)]">공통 전환 속도·easing과 키보드 포커스 링을 확인합니다.</p></div>
      <MotionPreview />
      <div className="mt-4 grid gap-3 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-5 md:grid-cols-3">
        <Button>기본 포커스 대상</Button>
        <Input placeholder="포커스 링 확인" aria-label="포커스 링 확인" />
        <Select aria-label="상태 선택"><option>양호</option><option>주의</option></Select>
      </div>
    </section>
  ),
  parameters: { docs: { source: { code: `<Button className="transition-[transform,box-shadow] duration-[var(--motion-standard)]">기본 포커스 대상</Button>
<Input placeholder="포커스 링 확인" />
<Select><option>양호</option></Select>` } } },
};
