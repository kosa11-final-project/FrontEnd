import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui';

const meta = {
  title: 'Shared UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      description: '표면의 계층과 선택 상태를 결정합니다.',
      control: 'select',
      options: ['default', 'subtle', 'selected', 'flat'],
      table: { defaultValue: { summary: 'default' } },
    },
    padding: {
      description: '카드 내부 여백을 결정합니다.',
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      table: { defaultValue: { summary: 'md' } },
    },
  },
};

export default meta;

export const SurfaceVariants = {
  render: () => (
    <div className="grid w-full max-w-[760px] gap-3 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>기본 작업 표면</CardTitle><CardDescription>표와 필터를 담는 기본 카드입니다.</CardDescription></CardHeader>
        <CardContent className="mt-4 text-[var(--font-size-body-sm)]">border와 흰색 surface를 사용합니다.</CardContent>
      </Card>
      <Card variant="subtle">
        <CardHeader><CardTitle>보조 표면</CardTitle><CardDescription>설명과 보조 정보를 묶습니다.</CardDescription></CardHeader>
        <CardFooter className="mt-4 text-[var(--font-size-meta)] text-[var(--text-muted)]">gray-50 surface</CardFooter>
      </Card>
      <Card variant="selected">
        <CardHeader><CardTitle>선택된 표면</CardTitle><CardDescription>현재 범위나 필터가 선택된 상태입니다.</CardDescription></CardHeader>
      </Card>
      <Card variant="flat">
        <CardHeader><CardTitle>무경계 표면</CardTitle><CardDescription>레이아웃 그룹을 위한 얇은 껍데기입니다.</CardDescription></CardHeader>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Card variant="selected" padding="md">
  <CardHeader>
    <CardTitle>선택된 표면</CardTitle>
    <CardDescription>현재 범위나 필터가 선택된 상태입니다.</CardDescription>
  </CardHeader>
</Card>`,
      },
    },
  },
};

export const CompoundStructure = {
  render: () => (
    <Card className="w-full max-w-[420px]">
      <CardHeader>
        <CardTitle>상품 설명</CardTitle>
        <CardDescription>도메인에 맞는 콘텐츠는 호출부에서 조합합니다.</CardDescription>
      </CardHeader>
      <CardContent className="mt-4 text-[var(--font-size-body-sm)] text-[var(--text-body)]">
        카드 primitive는 제목, 설명, 본문, 하단 영역의 책임을 나눠 재사용합니다.
      </CardContent>
      <CardFooter className="mt-5 border-t border-[var(--border)] pt-4 text-[var(--font-size-meta)] text-[var(--text-muted)]">
        shared/ui/Card
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Card>
  <CardHeader>
    <CardTitle>상품 설명</CardTitle>
    <CardDescription>도메인에 맞는 콘텐츠는 호출부에서 조합합니다.</CardDescription>
  </CardHeader>
  <CardContent>본문 콘텐츠</CardContent>
  <CardFooter>하단 메타데이터</CardFooter>
</Card>`,
      },
    },
  },
};
