import { Bell, Refresh } from 'reicon-react';
import { Icon } from '@/shared/ui/Icon.jsx';
import { IconButton } from '@/shared/ui/IconButton.jsx';

const meta = {
  title: 'Shared UI/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    label: '데이터 동기화',
    children: <Icon icon={Refresh} size={18} />,
  },
  argTypes: {
    label: {
      description: '아이콘의 의미를 전달하는 접근성 이름이자 hover tooltip입니다.',
      control: 'text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '-' },
      },
    },
    children: {
      description: 'Reicon 기반 아이콘 요소입니다. 화면에서 직접 편집하지 않고 story variant에서 지정합니다.',
      control: false,
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    variant: {
      description: '아이콘 버튼의 강조 수준을 선택합니다.',
      control: 'select',
      options: ['default', 'primary', 'ghost'],
      table: {
        type: { summary: 'default | primary | ghost' },
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      description: '아이콘 버튼의 고정 크기를 선택합니다.',
      control: 'select',
      options: ['sm', 'md', 'lg'],
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'md' },
      },
    },
    disabled: {
      description: '사용자 입력을 잠그고 비활성 상태로 표시합니다.',
      control: 'boolean',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;

export const Default = {};

export const Primary = {
  args: {
    label: '알림 열기',
    children: <Icon icon={Bell} size={18} />,
    variant: 'primary',
  },
};

export const Disabled = {
  args: { disabled: true },
};
