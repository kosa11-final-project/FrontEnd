import { Avatar } from '@/shared/ui/Avatar.jsx';
import { Alert } from '@/shared/ui/Alert.jsx';
import { Badge } from '@/shared/ui/Badge.jsx';
import { Checkbox } from '@/shared/ui/Checkbox.jsx';
import { LoadingMedia } from '@/shared/ui/LoadingMedia.jsx';
import { LottieLoader } from '@/shared/ui/LottieLoader.jsx';
import { Skeleton } from '@/shared/ui/Skeleton.jsx';
import { StateView } from '@/shared/ui/StateView.jsx';
import { StatusDot } from '@/shared/ui/StatusDot.jsx';

const meta = {
  title: 'Shared UI/Feedback',
  tags: ['autodocs'],
};

export default meta;

export const Statuses = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="neutral">기본 중립</Badge>
        <Badge variant="good">양호</Badge>
        <Badge variant="info">보통</Badge>
        <Badge variant="warning">주의</Badge>
        <Badge variant="danger">위험</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="good" size="sm">
          양호 (SM)
        </Badge>
        <Badge variant="info" size="md">
          보통 (MD)
        </Badge>
        <Badge variant="warning" size="lg">
          주의 (LG)
        </Badge>
      </div>
    </div>
  ),
};

export const StatusDots = {
  render: () => (
    <div className="flex items-center gap-5 text-[length:var(--font-size-body-sm)] text-[color:var(--text-body)]">
      <span className="flex items-center gap-2">
        <StatusDot tone="ready" /> 준비됨
      </span>
      <span className="flex items-center gap-2">
        <StatusDot tone="warning" /> 확인 필요
      </span>
      <span className="flex items-center gap-2">
        <StatusDot tone="danger" /> 오류
      </span>
    </div>
  ),
};

export const Avatars = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="sm">김</Avatar>
      <Avatar>박</Avatar>
      <Avatar size="lg">이</Avatar>
    </div>
  ),
};

export const StateViews = {
  render: () => (
    <div className="grid w-full gap-4 lg:grid-cols-2">
      <StateView state="loading" compact />
      <StateView state="empty" compact actionLabel="필터 초기화" onAction={() => {}} />
      <StateView state="error" compact actionLabel="다시 시도" onAction={() => {}} />
      <StateView state="forbidden" compact />
      <div className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton shape="text" className="w-full" />
        <Skeleton shape="text" className="w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" className="size-10" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  ),
};

export const LoadingMediaReference = {
  render: () => (
    <div className="w-full max-w-2xl overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)]">
      <div className="aspect-video bg-[var(--surface-subtle)]">
        <LoadingMedia
          src="/animations/heendi-loader-reference.mp4"
          poster="/animations/heendi-loader-reference-poster.png"
          label="흰디 MP4 로딩 레퍼런스"
          controls
        />
      </div>
    </div>
  ),
};

export const LottieLoadingSpinner = {
  render: () => (
    <div className="grid min-h-48 place-items-center rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)]">
      <LottieLoader label="재고 데이터를 불러오는 중입니다." />
    </div>
  ),
};

export const AlertsAndCheckboxes = {
  render: () => (
    <div className="grid w-full max-w-2xl gap-3">
      <Alert variant="good" title="정상 동기화">
        최근 데이터가 정상적으로 반영되었습니다.
      </Alert>
      <Alert variant="warning" title="주의">
        소비기한이 가까운 LOT가 있습니다.
      </Alert>
      <Alert variant="danger" title="위험">
        우선 확인이 필요한 재고가 있습니다.
      </Alert>
      <label className="flex items-center gap-2 text-[length:var(--font-size-body-sm)] text-[color:var(--text-body)]">
        <Checkbox aria-label="재고 행 선택" /> 재고 행 선택
      </label>
    </div>
  ),
};
