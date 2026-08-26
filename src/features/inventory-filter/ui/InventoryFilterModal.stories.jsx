import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DEFAULT_INVENTORY_FILTERS, InventoryFilterModal } from '@/features/inventory-filter';

const filterOptions = {
  categories: [
    { code: '1', name: '간편식/메인요리', categoryLevel: 1 },
    { code: '2', name: '부침/전', categoryLevel: 2, parentCode: '1' },
    { code: '3', name: '부침', categoryLevel: 3, parentCode: '2' },
    { code: '6', name: '생활/주방', categoryLevel: 1 },
    { code: '7', name: '생활용품', categoryLevel: 2, parentCode: '6' },
    { code: '8', name: '수세미', categoryLevel: 3, parentCode: '7' },
  ],
  storageTypes: [
    { code: 'FROZEN', name: '냉동' },
    { code: 'COLD', name: '냉장' },
    { code: 'ROOM_TEMP', name: '상온' },
  ],
  riskGrades: [
    { code: 'SAFE', name: '양호' },
    { code: 'NORMAL', name: '보통' },
    { code: 'CAUTION', name: '주의' },
    { code: 'DANGER', name: '위험' },
  ],
  warehouses: [
    { code: 'GYEONGIN_1', name: '경인1센터' },
    { code: 'GYEONGIN_2', name: '경인2센터' },
    { code: 'HO-NAM', name: '호남센터' },
    { code: 'SUJI', name: '수지센터' },
    { code: 'YEONGNAM', name: '영남센터' },
  ],
  salesPoints: [
    { code: 'PANGYO', name: '판교점' },
    { code: 'SUJI_STORE', name: '수지점' },
    { code: 'BUSAN', name: '압구정본점' },
    { code: 'CONNECT_BUSAN', name: '커넥트현대 부산' },
  ],
  regions: [],
  assessmentStatuses: [],
};

const selectedFilters = {
  ...DEFAULT_INVENTORY_FILTERS,
  categoryIds: ['3', '8'],
  categoryId: '3',
  storageType: ['FROZEN', 'COLD'],
  riskGrade: ['CAUTION', 'DANGER'],
  warehouseCode: ['GYEONGIN_1', 'GYEONGIN_2'],
  salesPointCode: ['PANGYO', 'SUJI_STORE'],
  shortageYn: 'Y',
};

const applyFilters = fn();

function FilterModalStory({ initialFilters = DEFAULT_INVENTORY_FILTERS }) {
  const [open, setOpen] = useState(true);
  const [filters, setFilters] = useState(initialFilters);

  return (
    <div className="min-h-[760px] bg-slate-50">
      {open ? (
        <InventoryFilterModal
          open
          filters={filters}
          filterOptions={filterOptions}
          onClose={() => setOpen(false)}
          onApply={(nextFilters) => {
            setFilters(nextFilters);
            applyFilters(nextFilters);
            setOpen(false);
          }}
        />
      ) : (
        <div className="flex min-h-[760px] items-center justify-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg bg-[#27B06E] px-4 py-2 text-sm font-bold text-white"
          >
            상세 필터 다시 열기
          </button>
        </div>
      )}
    </div>
  );
}

const meta = {
  title: 'Features/Inventory/Filter Modal',
  component: InventoryFilterModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '재고 조회의 상세 필터 모달입니다. 카테고리·보관유형·위험등급·안전재고·물류센터·상세 판매처를 다중 선택하고 선택된 조건을 한 영역에서 확인합니다.',
      },
    },
  },
};

export default meta;

export const Empty = {
  render: () => <FilterModalStory />,
};

export const SelectedFilters = {
  render: () => <FilterModalStory initialFilters={selectedFilters} />,
};

export const SalesPointDropdownOpen = {
  render: () => <FilterModalStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '상세 판매처 선택' }));
    await expect(canvas.getByRole('listbox', { name: '상세 판매처 목록' })).toBeVisible();
  },
};
