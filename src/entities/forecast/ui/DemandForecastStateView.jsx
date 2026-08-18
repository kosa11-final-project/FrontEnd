import { Danger, Refresh } from 'reicon-react';
import { FORECAST_STATUS, FORECAST_STATUS_LABELS } from '../model/forecast.js';
import { Button } from '@/shared/ui';

/**
 * 수요예측 상태 안내 뷰 (오류, 과거 데이터, 미적재 등)
 * @param {object} props
 * @param {string} props.status - 상태 코드 (ERROR, STALE, NO_DATA 등)
 * @param {string} [props.message] - 상태 상세 안내 메시지
 * @param {() => void} [props.onRetry] - 재시도 콜백 핸들러
 */
export function DemandForecastStateView({ status, message, onRetry }) {
  if (!status || status === FORECAST_STATUS.AVAILABLE) {
    return null;
  }

  const isError = status === FORECAST_STATUS.ERROR;
  const isWarning = status === FORECAST_STATUS.STALE;

  const bgClass = isError
    ? 'bg-rose-50 border-rose-200 text-rose-800'
    : isWarning
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-slate-50 border-slate-200 text-slate-700';

  const iconColor = isError ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-500';

  return (
    <div className={`flex items-start justify-between rounded-lg border p-4 text-xs ${bgClass}`}>
      <div className="flex items-start gap-2.5">
        <Danger size={16} className={`mt-0.5 shrink-0 ${iconColor}`} />
        <div>
          <h4 className="font-semibold">{FORECAST_STATUS_LABELS[status] || '알림'}</h4>
          <p className="mt-0.5 opacity-90">{message || '상태 정보를 확인해주세요.'}</p>
        </div>
      </div>

      {onRetry && (
        <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
          <Refresh size={12} />
          다시 시도
        </Button>
      )}
    </div>
  );
}
