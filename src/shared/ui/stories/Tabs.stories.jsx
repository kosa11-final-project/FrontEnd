import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/Tabs.jsx';

const meta = {
  title: 'Shared UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;

export const InventoryViews = {
  render: () => (
    <Tabs defaultValue="summary" className="w-[480px]">
      {({ value, setValue }) => (
        <TabsList aria-label="재고 보기">
          <TabsTrigger value="summary" activeValue={value} onSelect={setValue}>
            요약
          </TabsTrigger>
          <TabsTrigger value="lots" activeValue={value} onSelect={setValue}>
            LOT 재고
          </TabsTrigger>
          <TabsTrigger value="history" activeValue={value} onSelect={setValue}>
            전략 이력
          </TabsTrigger>
        </TabsList>
      )}
    </Tabs>
  ),
};
