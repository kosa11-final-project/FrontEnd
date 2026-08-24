import { Alert } from '@/shared/ui';

/**
 * 안전재고 도달 시점과 보충 조치 권고를 동일한 문구로 보여주는 안내 배너입니다.
 * 차트 본문과 상세 화면에서 같은 알림을 재사용할 수 있도록 분리합니다.
 *
 * @param {object} props
 * @param {object|null} props.crossing - forecastTimeline의 안전재고 교차점
 */
export function DemandForecastReplenishmentAlert({ crossing }) {
  const recommendation = crossing?.recommendation;
  if (!recommendation) return null;

  const timingLabel = crossing.expectedLabel === '현재' ? '즉시 조치' : `${crossing.expectedLabel}일 후`;

  return (
    <Alert
      variant={recommendation.variant}
      title={`${recommendation.title} · ${timingLabel}`}
      className="text-xs"
      data-testid="demand-forecast-replenishment-alert"
    >
      <p>{recommendation.message}</p>
      <p className="mt-1 font-semibold text-[color:var(--text-heading)]">
        권장 조치: {recommendation.actions.join(' · ')}
      </p>
    </Alert>
  );
}
