import { fn } from 'storybook/test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mapInventoryItem } from '@/entities/inventory';
import { mockRawInventoryItems } from '@/entities/inventory/testing/fixtures.js';
import { StrategyRequestModal } from './StrategyRequestModal.jsx';

const meta = {
  title: 'Widgets/Strategy/RequestModal',
  component: StrategyRequestModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    selectedItems: mockRawInventoryItems.slice(0, 2).map(mapInventoryItem),
    onClose: fn(),
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
