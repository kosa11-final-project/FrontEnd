import { Avatar } from '@/shared/ui/Avatar.jsx';
import { Badge } from '@/shared/ui/Badge.jsx';
import { StatusDot } from '@/shared/ui/StatusDot.jsx';

const meta = {
  title: 'Shared UI/Feedback',
  tags: ['autodocs'],
};

export default meta;

export const Statuses = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="neutral">정상 동기화</Badge>
      <Badge variant="good">양호</Badge>
      <Badge variant="warning">주의</Badge>
      <Badge variant="danger">위험</Badge>
    </div>
  ),
};

export const StatusDots = {
  render: () => (
    <div className="flex items-center gap-5 text-[length:var(--font-size-body-sm)] text-[color:var(--text-body)]">
      <span className="flex items-center gap-2"><StatusDot tone="ready" /> 준비됨</span>
      <span className="flex items-center gap-2"><StatusDot tone="warning" /> 확인 필요</span>
      <span className="flex items-center gap-2"><StatusDot tone="danger" /> 오류</span>
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
