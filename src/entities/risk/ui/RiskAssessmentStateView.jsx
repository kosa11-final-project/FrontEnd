import { StateView } from '@/shared/ui';
import { ASSESSMENT_STATUS_LABELS } from '../model/risk.js';

/**
 * 위험도 판정 상태 안내 뷰
 * @param {object} props
 * @param {string} props.status - 판정 상태 코드 (ASSESSED, UNASSESSED, FAILED 등)
 * @param {() => void} [props.onRetry] - 재시도 콜백
 */
export function RiskAssessmentStateView({ status, onRetry }) {
  if (!status || status === 'ASSESSED') return null;

  const isError = status === 'FAILED' || status === 'ERROR';
  const isLoading = status === 'LOADING' || status === 'REASSESSING';
  const state = isError ? 'error' : isLoading ? 'loading' : 'empty';

  return (
    <StateView
      state={state}
      compact
      title={ASSESSMENT_STATUS_LABELS[status] || '위험 판정 정보를 확인할 수 없습니다.'}
      description={
        isLoading
          ? '서버가 현재 재고·안전재고·수요예측·LOT 데이터를 기준으로 판정 중입니다.'
          : isError
            ? '위험 판정 API를 다시 시도해 주세요. 기존 재고와 LOT 정보는 유지됩니다.'
            : '필수 데이터가 적재되면 위험 등급을 판정할 수 있습니다.'
      }
      actionLabel={isError && onRetry ? '다시 시도' : undefined}
      onAction={onRetry}
    />
  );
}
