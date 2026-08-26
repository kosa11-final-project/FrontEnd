import { fn } from 'storybook/test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mapInventoryItem } from '@/entities/inventory';
import { mockRawInventoryItems } from '@/entities/inventory/testing/fixtures.js';
import { StrategyRequestModal } from './StrategyRequestModal.jsx';

const meta = {
  title: 'Widgets/Strategy/Request Modal',
  component: StrategyRequestModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    selectedItems: mockRawInventoryItems.slice(0, 2).map(mapInventoryItem),
    onClose: fn(),
    onCreated: fn(),
    createCase: fn(async (payload) => ({
      strategyCaseId: payload.skuId,
      caseName: payload.caseName || '기본 제목',
      caseStatus: 'GENERATING',
      generationStage: null,
      createdAt: '2026-08-24T10:00:00',
    })),
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export default meta;

export const Default = {};

export const SingleProduct = {
  args: {
    selectedItems: [mapInventoryItem(mockRawInventoryItems[0])],
  },
};

export const FiveProducts = {
  args: {
    selectedItems: mockRawInventoryItems.slice(0, 5).map(mapInventoryItem),
  },
};
