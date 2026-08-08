import { Button } from '@/shared/ui/Button.jsx';

const meta = {
  title: 'Shared UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: '재고 상세 보기',
  },
  argTypes: {
    children: {
      description: '버튼에 표시할 콘텐츠입니다. 아이콘과 텍스트를 함께 사용할 수 있습니다.',
      control: false,
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    variant: {
      description: '업무 의미에 맞는 버튼 시각 표현을 선택합니다.',
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      table: {
        type: { summary: 'primary | secondary | ghost | danger' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      description: '버튼의 높이와 내부 여백을 선택합니다.',
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      table: {
        type: { summary: 'sm | md | lg | icon' },
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

export const Primary = {};

export const Secondary = {
  args: { variant: 'secondary' },
};

export const Danger = {
  args: { variant: 'danger', children: '위험 재고 확인' },
};

export const Disabled = {
  args: { disabled: true },
};

export const ContrastMatrix = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">main · 흰색 글자</Button>
      <Button variant="secondary">white · 검정 글자</Button>
      <Button variant="danger">danger · 흰색 글자</Button>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Button variant="primary">main · 흰색 글자</Button>
<Button variant="secondary">white · 검정 글자</Button>
<Button variant="danger">danger · 흰색 글자</Button>`,
      },
    },
  },
};
