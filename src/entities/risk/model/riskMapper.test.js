import { describe, expect, it } from 'vitest';
import { mapRiskAssessmentResponse } from './riskMapper.js';

describe('riskMapper', () => {
  it('정상적인 위험도 응답을 프론트엔드 뷰 모델로 정규화한다', () => {
    const rawDto = {
      assessmentStatus: 'ASSESSED',
      riskGrade: 'DANGER',
      dbRiskGrade: 'CRITICAL',
      reasonMessage: '소비기한 30일 이하 임박 (22일 남음)',
      ruleVersion: 'v1.0.0',
      assessedAt: '2026-08-16T09:00:00Z',
      baseDate: '2026-08-16',
      availableQty: 110,
      shortageQty30: 0,
      safetyGapQty: 0,
      projectedD7: 60,
      safetyStockQty: 30,
      nearestExpiryDays: 22,
      maxHoldingDays: 14,
      reasons: [
        {
          code: 'EXPIRY_CRITICAL',
          message: '소비기한 30일 이하 임박 (22일 남음)',
          severity: 'CRITICAL',
          evidence: 'nearestExpiryDays=22',
        },
      ],
    };

    const result = mapRiskAssessmentResponse({ data: rawDto });

    expect(result).not.toBeNull();
    expect(result.assessmentStatus).toBe('ASSESSED');
    expect(result.riskGrade).toBe('DANGER');
    expect(result.dbRiskGrade).toBe('CRITICAL');
    expect(result.dailySalesVelocity).toBeUndefined();
    expect(result.stockDays).toBeUndefined();
    expect(result.nearestExpiryDays).toBe(22);
    expect(result.reasons).toHaveLength(1);
  });

  it('빈 입력 또는 null 전달 시 안전하게 처리한다', () => {
    expect(mapRiskAssessmentResponse(null)).toBeNull();
    const result = mapRiskAssessmentResponse({});
    expect(result).not.toBeNull();
    expect(result.ruleVersion).toBeNull();
    expect(result.riskGrade).toBeNull();
  });

  it('앞선 별칭이 빈 문자열일 때 후속 별칭으로 숫자를 정상 파싱한다', () => {
    const rawDto = {
      availableQty: '',
      available_qty: 150,
      shortageQty30: '',
      shortage_qty_30: 0,
      safetyStockQty: '',
      safety_stock_qty: '',
    };

    const result = mapRiskAssessmentResponse({ data: rawDto });
    expect(result.availableQty).toBe(150);
    expect(result.shortageQty30).toBe(0);
    expect(result.safetyStockQty).toBeNull();
  });
});
