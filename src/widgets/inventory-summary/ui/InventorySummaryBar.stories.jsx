import { fn } from 'storybook/test';
import { InventorySummaryBar } from './InventorySummaryBar.jsx';

const meta = {
  title: 'Widgets/Inventory/Summary Bar',
  component: InventorySummaryBar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    onRetry: fn(),
  },
};

export default meta;

const summary = {
  totalCurrentQuantity: 125000,
  totalAvailableQuantity: 118000,
  totalReservedQuantity: 7000,
  underSafetyCount: 14,
  dangerRiskCount: 5,
  cautionRiskCount: 9,
};

export const Loaded = {
  args: { summary, isLoading: false, isError: false },
};

export const Loading = {
  args: { summary: undefined, isLoading: true, isError: false },
};

export const Error = {
  args: { summary: undefined, isLoading: false, isError: true },
};

export const EmptySummary = {
  args: {
    summary: undefined,
    isLoading: false,
    isError: false,
  },
};
