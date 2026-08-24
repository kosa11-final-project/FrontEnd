const REPLENISHMENT_ACTIONS = Object.freeze(['발주', '이관', '입고요청']);

const RECOMMENDATION_COPY = Object.freeze({
  actions: REPLENISHMENT_ACTIONS,
});

function toFiniteNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getPointOffsetDays(point) {
  const explicitOffset = toFiniteNumber(point?.offsetDays);
  if (explicitOffset != null) return explicitOffset;

  if (point?.type === 'CURRENT') return 0;

  const match = String(point?.label || '').match(/^D\+(\d+)$/);
  return match ? Number(match[1]) : null;
}

function addDaysToDate(baseDate, daysAfterBase) {
  if (!baseDate || !/^\d{4}-\d{2}-\d{2}$/.test(baseDate)) return null;

  const date = new Date(`${baseDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  date.setUTCDate(date.getUTCDate() + daysAfterBase);
  return date.toISOString().slice(0, 10);
}

function roundUpDay(value) {
  return Math.max(0, Math.ceil(value - Number.EPSILON));
}

function createRecommendation({ status, daysAfterBase, expectedLabel, expectedDate }) {
  const isBelow = status === 'BELOW';
  const dateText = expectedDate ? ` (${expectedDate})` : '';
  const timingText = isBelow ? '현재' : `${expectedLabel}일 후`;

  return {
    ...RECOMMENDATION_COPY,
    variant: isBelow ? 'danger' : 'warning',
    title: isBelow ? '안전재고 미달' : '안전재고 도달 예정',
    message: isBelow
      ? '현재 안전재고 미만입니다. 발주·이관·입고요청이 필요합니다.'
      : `${timingText}${dateText} 안전재고에 도달할 것으로 예상됩니다. 발주·이관·입고요청을 검토하세요.`,
    timingText,
    daysAfterBase,
    expectedLabel,
    expectedDate,
  };
}

/**
 * 예상 가용재고가 안전재고 기준을 처음 하회하는 시점을 계산합니다.
 * 두 예측 시점 사이의 직선 구간을 선형 보간하고, 실제 조치 안내일은 올림합니다.
 *
 * @param {object} params
 * @param {Array<object>} params.chartPoints - offsetDays/projectedQty를 포함한 타임라인 점
 * @param {number|null} params.safetyStockQty - 안전재고 기준
 * @param {string|null} [params.baseDate] - 기준일(YYYY-MM-DD)
 * @returns {object|null}
 */
export function getSafetyStockCrossing({ chartPoints = [], safetyStockQty = null, baseDate = null } = {}) {
  const safety = toFiniteNumber(safetyStockQty);
  if (safety == null || !Array.isArray(chartPoints)) return null;

  const points = chartPoints
    .map((point) => ({
      point,
      offsetDays: getPointOffsetDays(point),
      projectedQty: toFiniteNumber(point?.projectedQty),
    }))
    .filter(({ offsetDays, projectedQty }) => offsetDays != null && projectedQty != null)
    .sort((a, b) => a.offsetDays - b.offsetDays);

  if (points.length === 0) return null;

  const first = points[0];
  if (first.offsetDays === 0 && first.projectedQty <= safety) {
    const expectedDate = addDaysToDate(baseDate, 0);
    return {
      status: 'BELOW',
      exactDaysAfterBase: 0,
      daysAfterBase: 0,
      expectedLabel: '현재',
      expectedDate,
      safetyStockQty: safety,
      projectedQty: first.projectedQty,
      pointBefore: first.point,
      pointAfter: first.point,
      recommendation: createRecommendation({
        status: 'BELOW',
        daysAfterBase: 0,
        expectedLabel: '현재',
        expectedDate,
      }),
    };
  }

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];

    if (previous.projectedQty <= safety || current.projectedQty > safety) continue;

    const quantityDrop = previous.projectedQty - current.projectedQty;
    const ratio = quantityDrop > 0 ? (previous.projectedQty - safety) / quantityDrop : 0;
    const exactDaysAfterBase = previous.offsetDays + ratio * (current.offsetDays - previous.offsetDays);
    const daysAfterBase = roundUpDay(exactDaysAfterBase);
    const expectedLabel = `D+${daysAfterBase}`;
    const expectedDate = addDaysToDate(baseDate, daysAfterBase);

    return {
      status: 'CROSSING',
      exactDaysAfterBase: Number(exactDaysAfterBase.toFixed(3)),
      daysAfterBase,
      expectedLabel,
      expectedDate,
      safetyStockQty: safety,
      projectedQty: safety,
      pointBefore: previous.point,
      pointAfter: current.point,
      recommendation: createRecommendation({
        status: 'CROSSING',
        daysAfterBase,
        expectedLabel,
        expectedDate,
      }),
    };
  }

  return null;
}

export { REPLENISHMENT_ACTIONS };
