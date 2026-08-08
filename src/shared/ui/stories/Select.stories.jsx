import { Select } from '@/shared/ui/Select.jsx';

const options = (
  <>
    <option value="all">전체 계열사</option>
    <option value="green-food">현대그린푸드</option>
    <option value="wellness">현대웰니스</option>
    <option value="livart">현대리바트</option>
  </>
);

const meta = {
  title: 'Shared UI/Select',
  component: Select,
  tags: ['autodocs'],
  args: {
    children: options,
    defaultValue: 'all',
  },
  argTypes: {
    children: {
      description: 'native option 목록입니다. 각 화면의 필터 의미에 맞게 호출부에서 제공합니다.',
      control: false,
      table: { type: { summary: 'ReactNode' } },
    },
    size: {
      description: '필터 바와 표면에 맞는 컨트롤 높이를 선택합니다.',
      control: 'select',
      options: ['sm', 'md', 'lg'],
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'md' },
      },
    },
    tone: {
      description: '입력 검증 상태를 표현합니다.',
      control: 'select',
      options: ['default', 'error'],
      table: {
        type: { summary: 'default | error' },
        defaultValue: { summary: 'default' },
      },
    },
    disabled: {
      description: '사용자 선택을 잠그고 chevron도 비활성 상태로 표시합니다.',
      control: 'boolean',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    containerClassName: {
      description: 'chevron을 포함하는 외부 wrapper에 추가할 className입니다.',
      control: false,
      table: { type: { summary: 'string' } },
    },
  },
};

export default meta;

export const AffiliateFilter = {};

export const CategoryFilter = {
  args: {
    children: (
      <>
        <option value="all">전체 카테고리</option>
        <option value="meal">그리팅 영양균형식</option>
        <option value="soup">국·탕·찌개</option>
        <option value="side">반찬·간편식</option>
      </>
    ),
  },
};

export const ErrorState = {
  args: {
    tone: 'error',
    'aria-invalid': true,
  },
};

export const Disabled = {
  args: { disabled: true },
};
