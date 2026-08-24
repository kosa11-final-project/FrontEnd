import { fn } from 'storybook/test';
import { mapInventoryItem, RESULT_STATE } from '@/entities/inventory';
import { mockRawInventoryItems } from '@/entities/inventory/testing/fixtures.js';
import { InventoryTable } from './InventoryTable.jsx';

const meta = {
  title: 'Widgets/Inventory/Table',
  component: InventoryTable,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    onPageChange: fn(),
    onSizeChange: fn(),
    onSortChange: fn(),
    onResetFilters: fn(),
    onRowClick: fn(),
    onRetry: fn(),
    onToggleSelectSku: fn(),
    onSelectAllSkus: fn(),
    onClearSelectedSkus: fn(),
    onGenerateStrategy: fn(),
    selectedSkuCodes: [],
  },
};

export default meta;

const items = mockRawInventoryItems.slice(0, 3).map((rawItem) => ({
  ...mapInventoryItem(rawItem),
  // 원격 이미지 상태에 따라 시각 회귀가 흔들리지 않도록 Storybook에서는 No Img 상태로 고정합니다.
  imageUrl: null,
}));

export const Loaded = {
  args: {
    items,
    totalCount: 42,
    page: 1,
    size: 20,
    totalPages: 3,
    sort: 'updatedAt,desc',
  },
};

export const SelectedForStrategy = {
  args: {
    ...Loaded.args,
    selectedSkuCodes: items.slice(0, 2).map((item) => item.skuCode),
  },
};

export const UnassessedRisk = {
  args: {
    ...Loaded.args,
    items: [
      {
        ...items[0],
        riskGrade: null,
        assessmentStatus: 'UNASSESSED',
        riskReason: '수요예측 데이터 적재 후 위험도를 판정합니다.',
      },
    ],
    totalCount: 1,
    totalPages: 1,
  },
};

export const Empty = {
  args: {
    items: [],
    totalCount: 0,
    resultState: RESULT_STATE.NO_DATA,
  },
};

export const FilterEmpty = {
  args: {
    items: [],
    totalCount: 0,
    resultState: RESULT_STATE.FILTER_EMPTY,
  },
};

export const Error = {
  args: {
    items: [],
    totalCount: 0,
    isError: true,
  },
};

export const Loading = {
  args: {
    items: [],
    totalCount: 0,
    isLoading: true,
  },
};

export const Mobile = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  args: {
    ...Loaded.args,
    totalCount: items.length,
    totalPages: 1,
  },
};
