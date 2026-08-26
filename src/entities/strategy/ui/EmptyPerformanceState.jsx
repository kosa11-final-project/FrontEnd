import { StateView } from '@/shared/ui';

export function EmptyPerformanceState({
  title = '수집된 성과 데이터가 없습니다.',
  description = '성과 동기화 전이거나 원천 시스템에 신규 데이터가 없습니다.',
}) {
  return <StateView state="empty" compact title={title} description={description} />;
}
