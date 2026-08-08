import { Badge, DataTable } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';

const meta = {
  title: 'Shared UI/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    density: {
      description: '행 높이와 본문 글자 크기입니다.',
      control: 'select',
      options: ['compact', 'default', 'comfortable'],
    },
    surface: {
      description: '표 바깥 작업 표면입니다.',
      control: 'select',
      options: ['plain', 'bordered'],
    },
    layout: {
      description: '컬럼 너비 계산 방식입니다.',
      control: 'select',
      options: ['auto', 'fixed'],
    },
    loading: { control: 'boolean' },
  },
};

export default meta;

const strategyResultColumns = [
  {
    accessorKey: 'item',
    header: '결과 항목',
    meta: { cellClassName: 'font-semibold text-[color:var(--text-heading)]' },
  },
  { accessorKey: 'recommended', header: 'AI 추천값', meta: { align: 'right' } },
  {
    accessorKey: 'adjusted',
    header: '현재 조정값',
    meta: { align: 'right', cellClassName: 'font-semibold text-[color:var(--text-heading)]' },
  },
];

const strategyResultRows = [
  { item: '예상 판매량', recommended: '178개', adjusted: '178개' },
  { item: '예상 매출', recommended: '₩6,408만원', adjusted: '₩6,408만원' },
  { item: '예상 이익', recommended: '₩1,120만원', adjusted: '₩1,120만원' },
  { item: '예상 마진율', recommended: '17.5%', adjusted: '17.5%' },
  { item: '예상 재고 소진기간', recommended: '17일', adjusted: '17일' },
  { item: '행사 후 예상 잔여재고', recommended: '32개', adjusted: '32개' },
];

function StrategyCell({ type, title, detail, sales, sellThrough, revenue, profit }) {
  return (
    <div className="min-w-0 space-y-2 py-1">
      <Badge variant="neutral" className="bg-[var(--color-gray-200)] text-[color:var(--text-heading)]">
        {type}
      </Badge>
      <p className="break-words font-semibold text-[color:var(--text-heading)]">{title}</p>
      <p className="break-words text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">{detail}</p>
      <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] p-2 text-[length:var(--font-size-meta)]">
        <span>
          <strong className="block text-[color:var(--text-heading)]">예상 판매 {sales}</strong>매출 {revenue}
        </span>
        <span>
          <strong className="block text-[color:var(--text-heading)]">소진율 {sellThrough}</strong>이익 {profit}
        </span>
      </div>
    </div>
  );
}

const strategyMatrixColumns = [
  {
    accessorKey: 'rank',
    header: '순위',
    meta: { align: 'center', width: '6.5rem', cellClassName: 'bg-[var(--surface-subtle)] align-top' },
    cell: ({ getValue }) => (
      <div className="flex flex-col items-center gap-2 pt-1">
        <strong className="text-[length:var(--font-size-subtitle2)] text-[color:var(--text-heading)]">
          {getValue()}
        </strong>
        {getValue() === '1안' ? <Badge variant="info">AI 추천</Badge> : null}
      </div>
    ),
  },
  {
    accessorKey: 'fastSell',
    header: '빠른 완판',
    cell: ({ getValue }) => <StrategyCell {...getValue()} />,
  },
  {
    accessorKey: 'marginMax',
    header: '마진 극대화',
    cell: ({ getValue }) => <StrategyCell {...getValue()} />,
  },
  {
    accessorKey: 'maxRevenue',
    header: '최대 매출',
    cell: ({ getValue }) => <StrategyCell {...getValue()} />,
  },
];

const strategyMatrixRows = [
  {
    rank: '1안',
    fastSell: {
      type: '복합 전략',
      title: '미아점 → 판교점 이동 후 10% 할인',
      detail: '이동 80개 · 행사 10일 · 냉동차량 1회',
      sales: '196개',
      sellThrough: '98.0%',
      revenue: '₩1,420만원',
      profit: '₩1,060만원',
    },
    marginMax: {
      type: '재고 이동',
      title: '판교 · 더현대서울 무할인 물량 집중',
      detail: '2개 점포 · 이동 120개 · 할인 없음',
      sales: '169개',
      sellThrough: '84.5%',
      revenue: '₩1,610만원',
      profit: '₩1,320만원',
    },
    maxRevenue: {
      type: '다채널 판촉',
      title: '3개 채널 동시 프로모션',
      detail: '백화점 · 그리팅몰 · 모두의 맛집 · 12일',
      sales: '214개',
      sellThrough: '93.0%',
      revenue: '₩1,890만원',
      profit: '₩1,280만원',
    },
  },
  {
    rank: '2안',
    fastSell: {
      type: '온라인 프로모션',
      title: '모두의 맛집 15% 타임딜',
      detail: '7일 · 쿠폰 5% · 무료배송',
      sales: '187개',
      sellThrough: '93.5%',
      revenue: '₩1,360만원',
      profit: '₩930만원',
    },
    marginMax: {
      type: '저할인 판매',
      title: '그리팅몰 저할인 장기 판매',
      detail: '할인 5% · 21일 · 배너 미사용',
      sales: '153개',
      sellThrough: '76.5%',
      revenue: '₩1,540만원',
      profit: '₩1,250만원',
    },
    maxRevenue: {
      type: '번들 전략',
      title: '프리미엄 국·탕 번들 구성',
      detail: '3종 세트 · 객단가 23% 상승 · 14일',
      sales: '181개',
      sellThrough: '90.5%',
      revenue: '₩1,760만원',
      profit: '₩1,210만원',
    },
  },
  {
    rank: '3안',
    fastSell: {
      type: '오프라인 집약',
      title: '저판매 점포 재고 집약 후 특설 행사',
      detail: '5개 점포 → 1개 행사점 · 할인 20% · 5일',
      sales: '176개',
      sellThrough: '88.0%',
      revenue: '₩1,240만원',
      profit: '₩840만원',
    },
    marginMax: {
      type: '교차판매',
      title: '연관상품 교차판매 쿠폰',
      detail: '국·탕 구매 시 8% 쿠폰 · 18일',
      sales: '148개',
      sellThrough: '74.0%',
      revenue: '₩1,480만원',
      profit: '₩1,170만원',
    },
    maxRevenue: {
      type: '오프라인 판촉',
      title: '주말 백화점 집중 타임딜',
      detail: '상위 4개점 · 할인 18% · 주말 2회',
      sales: '192개',
      sellThrough: '96.0%',
      revenue: '₩1,720만원',
      profit: '₩1,090만원',
    },
  },
];

export const StrategyResults = {
  render: () => (
    <div className="w-full max-w-[980px] space-y-3">
      <div>
        <h2 className="text-[length:var(--font-size-headline2)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
          현재 전략 예상 결과 · 25% 기간 한정 할인
        </h2>
        <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
          AI 추천 원본과 현재 조정값을 비교합니다.
        </p>
      </div>
      <DataTable
        caption="현재 전략 예상 결과"
        columns={strategyResultColumns}
        data={strategyResultRows}
        density="comfortable"
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `const columns = [
  { accessorKey: 'item', header: '결과 항목' },
  { accessorKey: 'recommended', header: 'AI 추천값', meta: { align: 'right' } },
  { accessorKey: 'adjusted', header: '현재 조정값', meta: { align: 'right' } },
];

<DataTable columns={columns} data={rows} density="comfortable" />`,
      },
    },
  },
};

export const StrategyMatrix = {
  render: () => (
    <div className="w-full max-w-[1200px] space-y-3">
      <div>
        <h2 className="text-[length:var(--font-size-headline2)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
          AI 추천 전략
        </h2>
        <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
          목표별 추천 전략을 비교하고 실행할 항목을 선택합니다.
        </p>
      </div>
      <DataTable
        caption="AI 추천 전략"
        columns={strategyMatrixColumns}
        data={strategyMatrixRows}
        density="comfortable"
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<DataTable
  columns={[
    { accessorKey: 'rank', header: '순위' },
    { accessorKey: 'fastSell', header: '빠른 완판', cell: ({ getValue }) => <StrategyCell {...getValue()} /> },
    { accessorKey: 'marginMax', header: '마진 극대화', cell: ({ getValue }) => <StrategyCell {...getValue()} /> },
  ]}
  data={strategyRows}
/>`,
      },
    },
  },
};

const performanceRows = [
  { metric: '소진 판매량', target: '120개', actual: '103개', variance: '-17개  (-14.2%)', tone: 'danger' },
  { metric: '소진 기간', target: '12일 완판', actual: '15일 소요', variance: '+3일  (지연)', tone: 'warning' },
  { metric: '증분 기여현금이익', target: '₩2,912만원', actual: '₩2,640만원', variance: '₩-272만원', tone: 'danger' },
  { metric: '전략 후 잔여재고', target: '-42개', actual: '42개', variance: '+84개  (잔존)', tone: 'danger' },
  { metric: '총 매출액', target: '₩4,608만원', actual: '₩3,955만원', variance: '-₩653만원  (-14.2%)', tone: 'danger' },
];

const performanceToneClasses = {
  good: 'text-[color:var(--good)]',
  warning: 'text-[color:var(--warning)]',
  danger: 'text-[color:var(--danger)]',
};

const performanceColumns = [
  {
    accessorKey: 'metric',
    header: '지표 구분',
    meta: { cellClassName: 'font-semibold text-[color:var(--text-heading)]' },
  },
  { accessorKey: 'target', header: '예상 전략 목표', meta: { align: 'right' } },
  {
    accessorKey: 'actual',
    header: '실제 전략 결과',
    meta: { align: 'right', cellClassName: 'font-semibold text-[color:var(--text-heading)]' },
  },
  {
    accessorKey: 'variance',
    header: '목표 대비 오차',
    meta: { align: 'right' },
    cell: ({ getValue, row }) => (
      <span className={cn('font-semibold tabular-nums', performanceToneClasses[row.original.tone])}>{getValue()}</span>
    ),
  },
];

export const PerformanceComparison = {
  render: () => (
    <div className="w-full max-w-[1100px] space-y-3">
      <div>
        <h2 className="text-[length:var(--font-size-headline2)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
          전략 성과 비교
        </h2>
        <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
          목표와 실제 결과의 차이를 의미 기반 색상으로 표시합니다.
        </p>
      </div>
      <DataTable caption="전략 성과 비교" columns={performanceColumns} data={performanceRows} density="comfortable" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<DataTable columns={[
  { accessorKey: 'metric', header: '지표 구분' },
  { accessorKey: 'target', header: '예상 전략 목표' },
  { accessorKey: 'actual', header: '실제 전략 결과' },
  { accessorKey: 'variance', header: '목표 대비 오차', cell: VarianceCell },
]} data={performanceRows} />`,
      },
    },
  },
};

const inventoryRows = [
  { channel: '그리팅몰 온라인', product: '두부버섯 도시락 · 350g', stock: 284, available: 250, risk: '주의' },
  { channel: '백화점 점포', product: '소고기 미역국 · 6팩', stock: 155, available: 145, risk: '양호' },
  { channel: '경기 광주 냉동센터', product: '버섯 들깨탕 · 6팩', stock: 120, available: 108, risk: '위험' },
];

const inventoryColumns = [
  { accessorKey: 'channel', header: '판매처' },
  {
    accessorKey: 'product',
    header: '상품명',
    meta: { cellClassName: 'font-semibold text-[color:var(--text-heading)]' },
  },
  { accessorKey: 'stock', header: '현재고', meta: { align: 'right' }, cell: ({ getValue }) => `${getValue()}개` },
  {
    accessorKey: 'available',
    header: '가용수량',
    meta: { align: 'right' },
    cell: ({ getValue }) => <span className="font-semibold text-[color:var(--good)]">{getValue()}개</span>,
  },
  {
    accessorKey: 'risk',
    header: '위험등급',
    meta: { align: 'center' },
    cell: ({ getValue }) => (
      <Badge variant={getValue() === '위험' ? 'danger' : getValue() === '주의' ? 'warning' : 'good'}>
        {getValue()}
      </Badge>
    ),
  },
];

export const InventorySortable = {
  render: () => (
    <div className="w-full max-w-[980px] space-y-3">
      <div>
        <h2 className="text-[length:var(--font-size-headline2)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
          통합 재고 조회
        </h2>
        <p className="mt-1 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
          헤더를 눌러 숫자 컬럼을 정렬할 수 있는 재고 표 예시입니다.
        </p>
      </div>
      <DataTable
        caption="통합 재고 조회"
        columns={inventoryColumns}
        data={inventoryRows}
        onRowClick={(row) => console.info('row selected', row)}
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<DataTable
  columns={inventoryColumns}
  data={inventoryRows}
  onRowClick={(row) => openInventoryDetail(row)}
/>`,
      },
    },
  },
};

export const States = {
  render: () => (
    <div className="grid w-full max-w-[1000px] gap-4 lg:grid-cols-3">
      <DataTable columns={strategyResultColumns} data={[]} emptyMessage="필터 조건에 맞는 결과가 없습니다." />
      <DataTable columns={strategyResultColumns} data={[]} loading />
      <DataTable columns={strategyResultColumns} data={[]} error="권한 범위에 해당하는 데이터를 불러올 수 없습니다." />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<DataTable columns={columns} data={[]} emptyMessage="필터 조건에 맞는 결과가 없습니다." />
<DataTable columns={columns} data={[]} loading />
<DataTable columns={columns} data={[]} error="데이터를 불러오지 못했습니다." />`,
      },
    },
  },
};
