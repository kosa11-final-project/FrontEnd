import { normalizeRiskGrade } from './risk.js';

function unwrapApiResponse(response = {}) {
  return response && typeof response === 'object' && response.data !== undefined ? response.data : response;
}

function nullableNumber(...values) {
  const value = values.find((candidate) => candidate !== undefined && candidate !== null && candidate !== '');
  if (value === undefined || value === null || value === '') return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * 백엔드 RiskAssessmentDetailResponse를 프론트엔드 뷰 모델로 매핑합니다.
 * @param {Record<string, any>} response
 * @returns {Record<string, any>|null}
 */
export function mapRiskAssessmentResponse(response) {
  const dto = unwrapApiResponse(response);
  if (!dto || typeof dto !== 'object') {
    return null;
  }

  const assessmentStatus = dto.assessmentStatus || dto.assessment_status || 'UNASSESSED';
  // 판정이 없을 때 정상 등급으로 오인시키지 않습니다.
  const riskGrade = normalizeRiskGrade(dto.riskGrade || dto.risk_grade || null);
  const dbRiskGrade = dto.dbRiskGrade || dto.db_risk_grade || null;
  const reasonMessage = dto.reasonMessage || dto.reason_message || dto.primaryReason || '판정 사유 없음';
  const ruleVersion = dto.ruleVersion || dto.rule_version || null;
  const assessedAt = dto.assessedAt || dto.assessed_at || null;
  const baseDate = dto.baseDate || dto.base_date || null;

  const availableQty = nullableNumber(dto.availableQty, dto.available_qty);
  const shortageQty30 = nullableNumber(dto.shortageQty30, dto.shortage_qty_30);
  const safetyGapQty = nullableNumber(dto.safetyGapQty, dto.safety_gap_qty);
  const projectedD7 = nullableNumber(dto.projectedD7, dto.projected_d7);
  const safetyStockQty = nullableNumber(dto.safetyStockQty, dto.safety_stock_qty);
  const expectedDisposalQty30 = nullableNumber(dto.expectedDisposalQty30, dto.expected_disposal_qty_30);
  const expectedDisposalRate30 = nullableNumber(dto.expectedDisposalRate30, dto.expected_disposal_rate_30);
  const nearestSaleEndDays = nullableNumber(dto.nearestSaleEndDays, dto.nearest_sale_end_days);
  const nearestExpiryDays = nullableNumber(dto.nearestExpiryDays, dto.nearest_expiry_days);
  const maxHoldingDays = nullableNumber(dto.maxHoldingDays, dto.max_holding_days);
  const stockCoverageDays = nullableNumber(
    dto.stockCoverageDays,
    dto.stock_coverage_days,
    dto.stockDays,
    dto.stock_days,
  );
  const rawShortageYn = dto.shortageYn ?? dto.shortage_yn;
  const shortageYn =
    rawShortageYn == null || rawShortageYn === ''
      ? availableQty == null || availableQty === 0
        ? 'Y'
        : safetyStockQty == null
          ? null
          : availableQty < safetyStockQty
            ? 'Y'
            : 'N'
      : rawShortageYn;

  const rawReasons = dto.reasons || [];
  const reasons = Array.isArray(rawReasons)
    ? rawReasons.map((r) => ({
        code: r.code || 'UNKNOWN',
        message: r.message || '',
        severity: r.severity || 'INFO',
        evidence: r.evidence || '',
      }))
    : [];

  return {
    assessmentStatus,
    riskGrade,
    dbRiskGrade,
    reasonMessage,
    ruleVersion,
    assessedAt,
    baseDate,
    availableQty,
    shortageQty30,
    safetyGapQty,
    projectedD7,
    safetyStockQty,
    expectedDisposalQty30,
    expectedDisposalRate30,
    nearestSaleEndDays,
    nearestExpiryDays,
    maxHoldingDays,
    stockCoverageDays,
    shortageYn,
    reasons,
  };
}
