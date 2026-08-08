import { useState } from 'react';
import { Box, Building, Database, Store } from 'reicon-react';
import { DetailLayout, MetricCard, Tabs, TabsList, TabsTrigger } from '@/shared/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card.jsx';
import { InventoryScopeCard } from './InventoryScopeCard.jsx';
import { InventoryStatusBadge } from './InventoryStatusBadge.jsx';
import { LotInventoryRow } from './LotInventoryRow.jsx';

const scopeMetrics = [
  { label: '전체 재고', value: '4,752개' },
  { label: '판매 가능', value: '4,402개', tone: 'good' },
  { label: '위험 SKU', value: '12개', tone: 'warning' },
  { label: '상품 / SKU', value: '9 / 27' },
];

const scopeMeta = {
  title: 'Entities / Inventory cards',
  tags: ['autodocs'],
};

export default scopeMeta;

export const ScopeCards = {
  render: () => (
    <div className="grid w-full max-w-[1040px] grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <InventoryScopeCard title="전체 계열사" eyebrow="ALL AFFILIATES" icon={Database} selected metrics={scopeMetrics} />
      <InventoryScopeCard title="현대그린푸드" eyebrow="GREEN FOOD" icon={Building} accent="mint" metrics={scopeMetrics} />
      <InventoryScopeCard title="현대웰니스" eyebrow="WELLNESS" icon={Store} accent="cyan" status="normal" metrics={scopeMetrics} />
      <InventoryScopeCard title="현대리바트" eyebrow="LIVART" icon={Box} accent="orange" status="caution" metrics={scopeMetrics} />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<InventoryScopeCard
  title="현대그린푸드"
  eyebrow="GREEN FOOD"
  icon={Building}
  accent="mint"
  metrics={metrics}
  onClick={() => setScope('green-food')}
/>`,
      },
    },
  },
};

export const ChannelScopes = {
  render: () => (
    <div className="grid w-full max-w-[1040px] grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <InventoryScopeCard title="전체 판매처" eyebrow="ALL CHANNELS" icon={Database} selected metrics={scopeMetrics} />
      <InventoryScopeCard title="그리팅몰 온라인" eyebrow="ONLINE" icon={Store} accent="cyan" metrics={scopeMetrics} />
      <InventoryScopeCard title="백화점 점포" eyebrow="OFFLINE STORES" icon={Building} accent="orange" status="caution" metrics={scopeMetrics} />
      <InventoryScopeCard title="경기 광주 냉동센터" eyebrow="LOGISTICS CENTER" icon={Box} accent="mint" status="normal" metrics={scopeMetrics} />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<InventoryScopeCard title="전체 판매처" eyebrow="ALL CHANNELS" selected metrics={metrics} />
<InventoryScopeCard title="그리팅몰 온라인" eyebrow="ONLINE" accent="cyan" metrics={metrics} />
<InventoryScopeCard title="백화점 점포" eyebrow="OFFLINE STORES" accent="orange" status="caution" metrics={metrics} />
<InventoryScopeCard title="경기 광주 냉동센터" eyebrow="LOGISTICS CENTER" accent="mint" status="normal" metrics={metrics} />`,
      },
    },
  },
};

export const InteractiveScopeCard = {
  render: () => {
    const [selectedScope, setSelectedScope] = useState('online');
    const cards = [
      { id: 'all', title: '전체 판매처', eyebrow: 'ALL CHANNELS', icon: Database, accent: 'main' },
      { id: 'online', title: '그리팅몰 온라인', eyebrow: 'ONLINE', icon: Store, accent: 'cyan' },
      { id: 'offline', title: '백화점 점포', eyebrow: 'OFFLINE STORES', icon: Building, accent: 'orange', status: 'caution' },
      { id: 'center', title: '경기 광주 냉동센터', eyebrow: 'LOGISTICS CENTER', icon: Box, accent: 'mint', status: 'normal' },
    ];

    return (
      <div className="grid w-full max-w-[1040px] grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <InventoryScopeCard
            key={card.id}
            {...card}
            selected={selectedScope === card.id}
            metrics={scopeMetrics}
            onClick={() => setSelectedScope(card.id)}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      source: {
        code: `const [selectedScope, setSelectedScope] = useState('online');

<InventoryScopeCard
  title="그리팅몰 온라인"
  eyebrow="ONLINE"
  selected={selectedScope === 'online'}
  metrics={metrics}
  onClick={() => setSelectedScope('online')}
/>`,
      },
    },
  },
};

export const LongContent = {
  render: () => (
    <div className="w-full max-w-[520px]">
      <InventoryScopeCard
        title="현대그린푸드 온라인·오프라인 통합 재고 운영 범위"
        eyebrow="GREEN FOOD / MULTI CHANNEL INVENTORY"
        icon={Building}
        accent="mint"
        status="risk"
        metrics={[
          { label: '전체 재고', value: '12,480개' },
          { label: '판매 가능', value: '10,924개', tone: 'good' },
          { label: '위험 SKU', value: '184개', tone: 'danger' },
          { label: '상품 / SKU', value: '124 / 396' },
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<InventoryScopeCard
  title="현대그린푸드 온라인·오프라인 통합 재고 운영 범위"
  eyebrow="GREEN FOOD / MULTI CHANNEL INVENTORY"
  status="risk"
  metrics={longMetrics}
/>`,
      },
    },
  },
};

export const Statuses = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <InventoryStatusBadge status="good" />
      <InventoryStatusBadge status="normal" />
      <InventoryStatusBadge status="caution" />
      <InventoryStatusBadge status="risk" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<InventoryStatusBadge status="good" />
<InventoryStatusBadge status="normal" />
<InventoryStatusBadge status="caution" />
<InventoryStatusBadge status="risk" />`,
      },
    },
  },
};

export const LotRows = {
  render: () => (
    <div className="grid w-full max-w-[920px] gap-3">
      <LotInventoryRow
        rank={1}
        lot="LOT-GF-LUNCH-BEEF-350-01"
        location="경기 광주 냉동센터 F-01"
        inboundDate="2026.07.29"
        expiryDate="2026.09.14"
        expiryLabel="D-43"
        currentStock="120개"
        scheduledShipment="13개"
        availableStock="107개"
        status="caution"
      />
      <LotInventoryRow
        rank={2}
        lot="LOT-GF-LUNCH-BEEF-350-02"
        location="경기 광주 냉동센터 F-01-2"
        inboundDate="2026.08.01"
        expiryDate="2026.09.21"
        expiryLabel="D-50"
        currentStock="164개"
        scheduledShipment="21개"
        availableStock="143개"
        status="normal"
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<LotInventoryRow
  rank={1}
  lot="LOT-GF-LUNCH-BEEF-350-01"
  expiryLabel="D-43"
  currentStock="120개"
  scheduledShipment="13개"
  availableStock="107개"
  status="caution"
/>`,
      },
    },
  },
};

export const ProductDetailPreview = {
  render: () => (
    <div className="w-full max-w-[1160px] bg-[var(--background)] p-6">
      <header className="mb-5 flex items-start justify-between border-b border-[var(--border)] pb-5">
        <div>
          <p className="text-[var(--font-size-meta)] font-bold uppercase tracking-[0.12em] text-[var(--text-label)]">GF-LUNCH-BEEF-350 · 최근 동기화 2026.08.02 09:00</p>
          <h1 className="mt-2 text-[var(--font-size-page-title)] font-bold text-[var(--text-heading)]">소불고기 도시락 · 350g</h1>
          <p className="mt-1 text-[var(--font-size-body)] text-[var(--text-muted)]">그리팅 영양균형 도시락 · 그리팅 · 케어푸드/도시락</p>
        </div>
      </header>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="현재고" value="284개" icon={Database} />
        <MetricCard label="판매 가능" value="250개" tone="good" icon={Box} />
        <MetricCard label="출고 예정" value="34개" tone="info" icon={Store} />
        <MetricCard label="SKU 위험도" value="주의" tone="warning" icon={Building} />
      </div>
      <DetailLayout
        asideContent={(
          <div className="grid gap-3">
            <Card padding="none" className="overflow-hidden"><div className="h-44 bg-[var(--primary-soft)]" /><CardContent className="p-4"><CardTitle>옵션·가격</CardTitle><p className="mt-4 text-[var(--font-size-body)] font-bold">판매가 ₩8,900</p></CardContent></Card>
            <Card><CardHeader><CardTitle>상품 설명</CardTitle><CardDescription>영양 균형을 고려한 냉동 도시락 제품군입니다.</CardDescription></CardHeader></Card>
          </div>
        )}
      >
        <Card padding="none">
          <CardHeader className="border-b border-[var(--border)] px-5 py-4">
            <Tabs defaultValue="lot">
              {({ value, setValue }) => (
                <TabsList>
                  <TabsTrigger value="lot" activeValue={value} onSelect={setValue}>LOT 재고</TabsTrigger>
                  <TabsTrigger value="forecast" activeValue={value} onSelect={setValue}>수요예측·위험분석</TabsTrigger>
                  <TabsTrigger value="history" activeValue={value} onSelect={setValue}>지난 전략이력</TabsTrigger>
                </TabsList>
              )}
            </Tabs>
          </CardHeader>
          <CardContent className="grid gap-3 p-5"><div><CardTitle>LOT별 재고 현황</CardTitle><CardDescription>기한과 출고 순서가 다른 재고를 LOT별로 비교합니다.</CardDescription></div><LotInventoryRow rank={1} lot="LOT-GF-LUNCH-BEEF-350-01" location="경기 광주 냉동센터 F-01" inboundDate="2026.07.29" expiryDate="2026.09.14" expiryLabel="D-43" currentStock="120개" scheduledShipment="13개" availableStock="107개" status="caution" /><LotInventoryRow rank={2} lot="LOT-GF-LUNCH-BEEF-350-02" location="경기 광주 냉동센터 F-01-2" inboundDate="2026.08.01" expiryDate="2026.09.21" expiryLabel="D-50" currentStock="164개" scheduledShipment="21개" availableStock="143개" status="normal" /></CardContent>
        </Card>
      </DetailLayout>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<DetailLayout asideContent={<ProductSummary />}>
  <Card>
    <Tabs>...</Tabs>
    <LotInventoryRow status="caution" />
    <LotInventoryRow status="normal" />
  </Card>
</DetailLayout>`,
      },
    },
  },
};
