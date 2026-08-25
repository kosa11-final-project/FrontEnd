import { Button } from '@/shared/ui/Button.jsx';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/shared/ui/Toast.jsx';
import { toast, useToast } from '@/shared/ui/use-toast.js';

const meta = {
  title: 'Shared UI/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '동기화 완료·실패처럼 전역 상태 변화를 짧게 안내하는 Toast 컴포넌트입니다.',
      },
    },
  },
};

export default meta;

function ToastPreview() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() =>
            toast({
              title: '재고 동기화 완료',
              description: '3만 3,358건의 통합 재고가 최신 상태로 반영되었습니다.',
              duration: Infinity,
            })
          }
        >
          성공 알림 띄우기
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            toast({
              title: '동기화 실패',
              description: '위험 판정 저장 중 오류가 발생했습니다.',
              variant: 'destructive',
              duration: Infinity,
            })
          }
        >
          실패 알림 띄우기
        </Button>
      </div>
      {toasts.map(({ id, title, description, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title ? <ToastTitle>{title}</ToastTitle> : null}
            {description ? <ToastDescription>{description}</ToastDescription> : null}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

export const Interactive = {
  render: () => <ToastPreview />,
};
