import { InventoryOverviewSkeleton } from './InventoryOverviewSkeleton.jsx';

const meta = {
  title: 'Widgets/Inventory/Detail Drawer/Overview Skeleton',
  component: InventoryOverviewSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '판매처를 전환하는 동안 재고 개요 영역의 레이아웃을 유지하는 로딩 스켈레톤입니다.',
      },
    },
  },
};

export default meta;

export const Loading = {
  render: () => (
    <div className="mx-auto min-h-[680px] w-full max-w-[760px] bg-[#F9FAFB] p-5">
      <InventoryOverviewSkeleton />
    </div>
  ),
};
