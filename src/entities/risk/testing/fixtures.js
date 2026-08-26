/**
 * 위험도 로컬 개발 및 테스트용 결정적 Mock DTO
 */
export function getMockRiskAssessmentDto(_skuCode = 'SKU_MANDU_001_105', _salesPointCode = 'GREETING_ONLINE') {
  return {
    assessmentStatus: 'ASSESSED',
    riskGrade: 'CAUTION',
    dbRiskGrade: 'WARNING',
    reasonMessage: 'D+30 누적 예측 수요(1,200개)가 가용재고(900개)를 초과하여 부족이 예상됩니다.',
    ruleVersion: 'v1.0.0',
    assessedAt: '2026-08-16T10:00:00Z',
    baseDate: '2026-08-16',
    availableQty: 900,
    shortageQty30: 300,
    safetyGapQty: 0,
    projectedD7: 620,
    safetyStockQty: 200,
    nearestExpiryDays: 60,
    maxHoldingDays: 45,
    reasons: [
      {
        code: 'PREDICTED_SHORTAGE',
        message: 'D+30 예측수요(1,200개)가 현재 가용재고(900개)를 초과합니다 (부족량: 300개).',
        severity: 'WARNING',
        evidence: 'shortageQty30=300, availableQty=900, predictedQtyD30=1200',
      },
      {
        code: 'EXPIRY_WARNING',
        message: '소비기한 90일 이하 임박 LOT가 존재합니다 (60일 남음).',
        severity: 'WARNING',
        evidence: 'nearestExpiryDays=60',
      },
    ],
  };
}
