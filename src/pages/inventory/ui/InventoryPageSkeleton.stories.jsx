import { InventoryPageSkeleton } from './InventoryPageSkeleton.jsx';

const meta = {
  title: 'Pages/Loading States/Integrated Inventory',
  component: InventoryPageSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '통합재고 라우트가 지연 로딩되는 동안 동기화 바·KPI·필터·테이블의 실제 레이아웃을 유지하는 스켈레톤입니다.',
      },
    },
  },
};

export default meta;

export const Loading = {
  render: () => (
    <div className="min-h-screen bg-[var(--background)] p-6 sm:p-8">
      <div className="content-wrap">
        <InventoryPageSkeleton />
      </div>
    </div>
  ),
};
