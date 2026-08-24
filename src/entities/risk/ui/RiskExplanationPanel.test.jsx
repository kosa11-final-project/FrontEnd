import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskExplanationPanel } from './RiskExplanationPanel.jsx';

describe('RiskExplanationPanel', () => {
  it('renders the compact risk explanation panel with core reason and details', () => {
    render(
      <RiskExplanationPanel
        data={{
          assessmentStatus: 'ASSESSED',
          riskGrade: 'CAUTION',
          availableQty: 10,
          safetyStockQty: 1,
          stockCoverageDays: 20.4,
          shortageYn: 'N',
          reasonMessage: 'D+30 수요예측 대비 재고 부족 예상 (14.456개 부족)',
          ruleVersion: 'v1.1.0',
          baseDate: '2026-08-22',
          safetyGapQty: 15,
          reasons: [
            {
              code: 'PREDICTED_SHORTAGE',
              severity: 'WARNING',
              message: 'D+30 수요예측 대비 재고 부족 예상 (14.456개 부족)',
              evidence: 'predictedQtyD30=154.456, availableQty=140',
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('서버 위험 판정 결과')).toBeInTheDocument();
    expect(screen.getByText('규칙 v1.1.0')).toBeInTheDocument();
    expect(screen.getByText(/안전재고 목표치 대비/)).toBeInTheDocument();
    expect(screen.getByText('15개')).toBeInTheDocument();
    expect(screen.getByText('세부 평가 내역 (1건)')).toBeInTheDocument();
    expect(screen.getByText('predictedQtyD30=154, availableQty=140')).toBeInTheDocument();
  });

  it('formats calculation evidence with cleaned decimals', () => {
    render(
      <RiskExplanationPanel
        data={{
          assessmentStatus: 'ASSESSED',
          riskGrade: 'CAUTION',
          reasonMessage:
            '[ASSESSED/v1.1.0/PREDICTED_SHORTAGE] D+30 수요예측 대비 재고 부족 예상 (14.456개 부족) | 산식: 가용재고=on_hand_qty(48), D+7예상잔고=max(0, 가용재고-예측D7)=32.179, D+30부족량=max(0, 예측D30-가용재고)=14.456, 안전재고부족=max(0, 안전재고-D+7예상잔고)=0, 소비기한/LOT 규칙을 함께 적용했습니다.',
          reasons: [],
        }}
      />,
    );

    expect(screen.getByText('D+30 수요예측 대비 재고 부족 예상 (14개 부족)')).toBeInTheDocument();
    expect(
      screen.getByText(
        '가용 재고: 48개, 7일 후 예상 잔고: 32개, 30일 부족 수량: 14개, 안전 재고 부족: 0개, 소비기한과 로트 규칙도 함께 적용했습니다.',
      ),
    ).toBeInTheDocument();
  });
});
