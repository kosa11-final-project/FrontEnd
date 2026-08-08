import { DetailLayout } from '@/shared/ui';

const meta = {
  title: 'Shared UI/DetailLayout',
  component: DetailLayout,
  tags: ['autodocs'],
  argTypes: {
    aside: {
      description: '좌측 정보 영역의 기준 너비를 선택합니다.',
      control: 'select',
      options: ['narrow', 'regular', 'wide'],
      table: { defaultValue: { summary: 'regular' } },
    },
    asideContent: { control: false },
    children: { control: false },
  },
  parameters: { layout: 'fullscreen' },
};

export default meta;

export const ProductDetailShell = {
  render: () => (
    <div className="min-h-[520px] w-full bg-[var(--background)] p-6">
      <DetailLayout
        asideContent={
          <div className="grid gap-3">
            <div className="h-48 rounded-[var(--radius-panel)] bg-[var(--primary-soft)]" />
            <div className="h-32 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)]" />
          </div>
        }
      >
        <div className="h-96 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)]" />
      </DetailLayout>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<DetailLayout
  asideContent={<ProductSummary />}
>
  <InventoryDetailPanel />
</DetailLayout>`,
      },
    },
  },
};
