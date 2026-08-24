import { fn } from 'storybook/test';
import { RESULT_STATE } from '@/entities/inventory';
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
    onGenerateStrategy: fn(),
  },
};

export default meta;

const items = [
  {
    rowId: 'SKU-MANDU-01',
    skuCode: 'SKU-MANDU-01',
    skuName: '1.05kg 단품팩',
    productName: '비비고 왕교자',
    categoryPathLabel: '식품 > 냉동식품 > 만두',
    storageType: 'FROZEN',
    storageName: '냉동',
    currentQuantity: 450,
    availableQuantity: 420,
    reservedQuantity: 30,
    safetyQuantity: 100,
    riskGrade: 'SAFE',
    assessmentStatus: 'ASSESSED',
    nearestExpiryDays: 43,
    salesPoints: [
      {
        salesPointCode: 'STORE-SEOUL',
        salesPointName: '더현대 서울점',
        channelType: 'HYUNDAI_DEPT',
        currentQuantity: 200,
        availableQuantity: 180,
        riskGrade: 'SAFE',
      },
      {
        salesPointCode: 'GREETING',
        salesPointName: '그리팅 공식몰',
        channelType: 'GREETING',
        currentQuantity: 250,
        availableQuantity: 240,
        riskGrade: 'SAFE',
      },
    ],
    ownerSalesPointCount: 2,
  },
];

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

export const Empty = {
  args: {
    items: [],
    totalCount: 0,
    resultState: RESULT_STATE.NO_DATA,
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
