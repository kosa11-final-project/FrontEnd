import { Input } from '@/shared/ui/Input.jsx';
import { Select } from '@/shared/ui/Select.jsx';

const meta = {
  title: 'Shared UI/Form controls',
  tags: ['autodocs'],
};

export default meta;

export const SearchInput = {
  render: () => (
    <div style={{ width: '360px' }}>
      <label htmlFor="storybook-search" className="mb-2 block text-[var(--font-size-meta)] font-semibold text-[var(--text-heading)]">
        상품 검색
      </label>
      <Input id="storybook-search" placeholder="상품명, SKU, 판매처 검색" />
    </div>
  ),
};

export const ValidationStates = {
  render: () => (
    <div className="grid w-[560px] gap-3 sm:grid-cols-2">
      <Input aria-label="오류 상태" defaultValue="잘못된 SKU" tone="error" />
      <Input aria-label="정상 상태" defaultValue="GF-LUNCH-350" tone="success" />
    </div>
  ),
};

export const FilterSelect = {
  render: () => (
    <div style={{ width: '240px' }}>
      <label htmlFor="storybook-channel" className="mb-2 block text-[var(--font-size-meta)] font-semibold text-[var(--text-heading)]">
        판매채널
      </label>
      <Select id="storybook-channel" defaultValue="all">
        <option value="all">전체 판매채널</option>
        <option value="online">온라인</option>
        <option value="offline">오프라인</option>
      </Select>
    </div>
  ),
};
