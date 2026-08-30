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

  const rawRiskGrade = dto.riskGrade || dto.risk_grade || dto.dbRiskGrade || dto.db_risk_grade || null;
  const normalizedRiskGrade = normalizeRiskGrade(rawRiskGrade);
  const rawAssessmentStatus = dto.assessmentStatus || dto.assessment_status || null;
  const assessmentStatus =
    rawAssessmentStatus === 'ASSESSED' || rawAssessmentStatus === 'UNASSESSED'
      ? rawAssessmentStatus
      : rawAssessmentStatus == null && normalizedRiskGrade
        ? 'ASSESSED'
        : null;
  const legacyStatusOmitted = rawAssessmentStatus == null;
  // 판정이 없을 때 서버 응답에 잔존한 등급·사유를 화면에 노출해
  // 정상으로 오인시키지 않습니다. canonical API의 UNASSESSED 계약은
  // 등급·사유·판정시각을 모두 null로 취급합니다.
  const isAssessed = assessmentStatus === 'ASSESSED';
  const riskGrade = isAssessed ? normalizedRiskGrade : null;
  const dbRiskGrade = isAssessed ? normalizeRiskGrade(dto.dbRiskGrade || dto.db_risk_grade || rawRiskGrade) : null;
  const reasonMessage = isAssessed ? dto.reasonMessage || dto.reason_message || dto.primaryReason || null : null;
  const ruleVersion = isAssessed ? dto.ruleVersion || dto.rule_version || null : null;
  const assessedAt = isAssessed ? dto.assessedAt || dto.assessed_at || null : null;
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
  const versionMatch = typeof ruleVersion === 'string' && ruleVersion.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  const canonicalReason =
    Boolean(versionMatch) &&
    (Number(versionMatch[1]) > 1 || (Number(versionMatch[1]) === 1 && Number(versionMatch[2]) >= 7));
  const shortageYn =
    !isAssessed && (!legacyStatusOmitted || canonicalReason)
      ? null
      : canonicalReason
        ? rawShortageYn == null || rawShortageYn === ''
          ? null
          : rawShortageYn
        : rawShortageYn == null || rawShortageYn === ''
          ? availableQty == null || availableQty === 0
            ? 'Y'
            : safetyStockQty == null
              ? null
              : availableQty < safetyStockQty
                ? 'Y'
                : 'N'
          : rawShortageYn;

  const rawReasons = dto.reasons || [];
  const reasons =
    isAssessed && Array.isArray(rawReasons)
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
