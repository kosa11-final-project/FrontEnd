import { useState } from 'react';
import { Box, Building, Database, Store } from 'reicon-react';
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
  title: 'Entities/Inventory/Cards',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '재고 범위, 위험 상태, FEFO LOT 정보를 표현하는 재고 엔티티 카드 모음입니다.',
      },
    },
  },
};

function InteractiveScopeCardStory() {
  const [selectedScope, setSelectedScope] = useState('online');
  const cards = [
    { id: 'all', title: '전체 판매처', icon: Database, accent: 'main' },
    { id: 'online', title: '그리팅몰 온라인', icon: Store, accent: 'cyan' },
    { id: 'offline', title: '백화점 점포', icon: Building, accent: 'orange', status: 'CAUTION' },
    { id: 'center', title: '경기 광주 냉동센터', icon: Box, accent: 'mint', status: 'SAFE' },
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
}

export default scopeMeta;

export const ScopeCards = {
  render: () => (
    <div className="grid w-full max-w-[1040px] grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <InventoryScopeCard title="전체 계열사" icon={Database} selected metrics={scopeMetrics} />
      <InventoryScopeCard title="현대그린푸드" icon={Building} accent="mint" metrics={scopeMetrics} />
      <InventoryScopeCard title="현대웰니스" icon={Store} accent="cyan" status="SAFE" metrics={scopeMetrics} />
      <InventoryScopeCard title="현대리바트" icon={Box} accent="orange" status="CAUTION" metrics={scopeMetrics} />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<InventoryScopeCard
  title="현대그린푸드"
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
      <InventoryScopeCard title="전체 판매처" icon={Database} selected metrics={scopeMetrics} />
      <InventoryScopeCard title="그리팅몰 온라인" icon={Store} accent="cyan" metrics={scopeMetrics} />
      <InventoryScopeCard title="백화점 점포" icon={Building} accent="orange" status="CAUTION" metrics={scopeMetrics} />
      <InventoryScopeCard title="경기 광주 냉동센터" icon={Box} accent="mint" status="SAFE" metrics={scopeMetrics} />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<InventoryScopeCard title="전체 판매처" selected metrics={metrics} />
<InventoryScopeCard title="그리팅몰 온라인" accent="cyan" metrics={metrics} />
<InventoryScopeCard title="백화점 점포" accent="orange" status="CAUTION" metrics={metrics} />
<InventoryScopeCard title="경기 광주 냉동센터" accent="mint" status="SAFE" metrics={metrics} />`,
      },
    },
  },
};

export const InteractiveScopeCard = {
  render: InteractiveScopeCardStory,
  parameters: {
    docs: {
      source: {
        code: `const [selectedScope, setSelectedScope] = useState('online');

<InventoryScopeCard
  title="그리팅몰 온라인"
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
        icon={Building}
        accent="mint"
        status="DANGER"
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
  status="DANGER"
  metrics={longMetrics}
/>`,
      },
    },
  },
};

export const Statuses = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-4">
      <InventoryStatusBadge status="SAFE" showDot />
      <InventoryStatusBadge status="CAUTION" showDot />
      <InventoryStatusBadge status="DANGER" showDot />
      <InventoryStatusBadge status="UNASSESSED" showIcon />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<InventoryStatusBadge status="SAFE" showDot />
<InventoryStatusBadge status="CAUTION" showDot />
<InventoryStatusBadge status="DANGER" showDot />
<InventoryStatusBadge status="UNASSESSED" showIcon />`,
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
        status="CAUTION"
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
        status="SAFE"
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
  status="CAUTION"
/>`,
      },
    },
  },
};
