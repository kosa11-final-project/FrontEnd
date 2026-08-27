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
      expectedDisposalQty30: 13,
      expectedDisposalRate30: 11.82,
      nearestSaleEndDays: 11,
      nearestExpiryDays: 22,
      maxHoldingDays: 14,
      stockCoverageDays: 37.5,
      shortageYn: 'Y',
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
    expect(result.stockCoverageDays).toBe(37.5);
    expect(result.shortageYn).toBe('Y');
    expect(result.expectedDisposalQty30).toBe(13);
    expect(result.expectedDisposalRate30).toBe(11.82);
    expect(result.nearestSaleEndDays).toBe(11);
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

  it('부족 여부 fallback은 D+30 예측이 아니라 안전재고 미달을 사용한다', () => {
    const result = mapRiskAssessmentResponse({
      availableQty: 10,
      predictedQtyD30: 20,
      safetyStockQty: 1,
    });

    expect(result.shortageYn).toBe('N');
  });
});
