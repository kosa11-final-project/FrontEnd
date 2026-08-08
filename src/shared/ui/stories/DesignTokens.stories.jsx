import { Badge, Button, MetricCard } from '@/shared/ui';
import { Database, Warning } from 'reicon-react';

const palette = [
  { name: 'main', token: '--color-main', value: '#27B06E', foreground: 'var(--color-white)' },
  { name: 'sub-mint', token: '--color-sub-mint', value: '#11C6AB', foreground: 'var(--color-white)' },
  { name: 'sub-cyan', token: '--color-sub-cyan', value: '#00B0D7', foreground: 'var(--color-white)' },
  { name: 'sub-orange', token: '--color-sub-orange', value: '#FDA643', foreground: 'var(--color-gray-900)' },
  { name: 'sub-mint-soft', token: '--color-sub-mint-soft', value: '#DAF7E9', foreground: 'var(--color-gray-900)' },
  { name: 'sub-cyan-soft', token: '--color-sub-cyan-soft', value: '#CFF4FC', foreground: 'var(--color-gray-900)' },
  { name: 'sub-orange-soft', token: '--color-sub-orange-soft', value: '#FFEC2C', foreground: 'var(--color-gray-900)' },
  { name: 'gray-900', token: '--color-gray-900', value: '#282828', foreground: 'var(--color-white)' },
  { name: 'gray-700', token: '--color-gray-700', value: '#747474', foreground: 'var(--color-white)' },
  { name: 'gray-500', token: '--color-gray-500', value: '#8E8E8E', foreground: 'var(--color-white)' },
  { name: 'gray-300', token: '--color-gray-300', value: '#C1C1C1', foreground: 'var(--color-gray-900)' },
  { name: 'gray-200', token: '--color-gray-200', value: '#DADADA', foreground: 'var(--color-gray-900)' },
  { name: 'gray-50', token: '--color-gray-50', value: '#F4F4F4', foreground: 'var(--color-gray-900)' },
];

const typography = [
  { name: 'Headline1', token: '--font-size-headline1', pixels: '22px', weight: 700, line: '--line-height-headline1', sample: '통합 재고 관제' },
  { name: 'Headline2', token: '--font-size-headline2', pixels: '20px', weight: 700, line: '--line-height-headline2', sample: 'LOT별 재고 현황' },
  { name: 'Subtitle1', token: '--font-size-subtitle1', pixels: '16px', weight: 700, line: '--line-height-subtitle1', sample: '재고 범위와 판매처' },
  { name: 'Subtitle2', token: '--font-size-subtitle2', pixels: '14px', weight: 600, line: '--line-height-subtitle2', sample: '판매 가능 수량' },
  { name: 'Body1', token: '--font-size-body1', pixels: '14px', weight: 400, line: '--line-height-body', sample: '현재고와 가용수량을 비교합니다.' },
  { name: 'Body2', token: '--font-size-body2', pixels: '12px', weight: 500, line: '--line-height-body', sample: '전체 판매처 기준' },
  { name: 'Description', token: '--font-size-description', pixels: '12px', weight: 400, line: '--line-height-meta', sample: '소비기한과 출고 순서를 확인합니다.' },
];

function PaletteGrid() {
  return (
    <div className="grid w-full max-w-[840px] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {palette.map(({ name, token, value, foreground }) => (
        <div
          key={name}
          className="min-h-24 rounded-[var(--radius-control)] border border-[var(--border)] p-3"
          style={{ backgroundColor: `var(${token})`, color: foreground }}
        >
          <strong className="block text-[var(--font-size-body2)] font-bold">{name}</strong>
          <span className="mt-1 block text-[var(--font-size-description)] opacity-80">{value}</span>
          <span className="mt-2 block text-[0.625rem] opacity-70">{token}</span>
        </div>
      ))}
    </div>
  );
}

function TypographyScale() {
  return (
    <div className="w-full max-w-[840px] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)]">
      {typography.map(({ name, token, pixels, weight, line, sample }) => (
        <div key={name} className="grid grid-cols-[110px_1fr_66px] items-center gap-3 border-b border-[var(--border)] p-4 last:border-b-0 sm:grid-cols-[140px_1fr_80px]">
          <div>
            <strong className="block text-[var(--font-size-body2)] font-bold text-[var(--text-heading)]">{name}</strong>
            <span className="mt-1 block text-[0.625rem] text-[var(--text-muted)]">{token}</span>
          </div>
          <p style={{ fontSize: `var(${token})`, lineHeight: `var(${line})`, fontWeight: weight }} className="min-w-0 break-words text-[var(--text-heading)]">{sample}</p>
          <span className="text-right text-[var(--font-size-body2)] tabular-nums text-[var(--text-muted)]">{pixels}</span>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: 'Foundations/Design tokens',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Pretendard typography scale와 Dashboard Filter Foundations color token의 현재 값을 확인합니다. 실제 컴포넌트는 이 semantic token을 사용합니다.',
      },
    },
  },
};

export default meta;

export const Colors = {
  render: () => (
    <section className="w-full max-w-[900px]">
      <div className="mb-4"><h2 className="text-[var(--font-size-headline2)] font-bold text-[var(--text-heading)]">Dashboard Filter Foundations</h2><p className="mt-1 text-[var(--font-size-description)] text-[var(--text-muted)]">원시 색상과 semantic 역할은 src/styles.css에서 관리합니다.</p></div>
      <PaletteGrid />
    </section>
  ),
  parameters: {
    docs: {
      source: {
        code: `<div style={{ backgroundColor: 'var(--color-main)' }}>
  main #27B06E
</div>
<div style={{ backgroundColor: 'var(--color-sub-cyan)' }}>
  sub-cyan #00B0D7
</div>
<div style={{ backgroundColor: 'var(--color-sub-orange)' }}>
  sub-orange #FDA643
</div>`,
      },
    },
  },
};

export const Typography = {
  render: () => (
    <section className="w-full max-w-[900px]">
      <div className="mb-4"><h2 className="text-[var(--font-size-headline2)] font-bold text-[var(--text-heading)]">Pretendard</h2><p className="mt-1 text-[var(--font-size-description)] text-[var(--text-muted)]">Bold · Semibold · Regular · rem token</p></div>
      <TypographyScale />
    </section>
  ),
  parameters: {
    docs: {
      source: {
        code: `<p className="text-[var(--font-size-headline1)]">Headline1 · 22px</p>
<p className="text-[var(--font-size-headline2)]">Headline2</p>
<p className="text-[var(--font-size-subtitle1)]">Subtitle1</p>
<p className="text-[var(--font-size-body1)]">Body1</p>
<p className="text-[var(--font-size-description)]">Description</p>`,
      },
    },
  },
};

export const InteractiveTheme = {
  args: {
    mainColor: '#27B06E',
    infoColor: '#00B0D7',
    warningColor: '#FDA643',
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
      <div><h2 className="text-[var(--font-size-headline2)] font-bold text-[var(--text-heading)]">Token preview</h2><p className="mt-1 text-[var(--font-size-description)] text-[var(--text-muted)]">Controls에서 main·info·warning 색상을 변경하면 아래 컴포넌트가 함께 변합니다.</p></div>
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
