import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TooltipProvider } from '@/shared/ui';
import { RiskExplanationPanel } from './RiskExplanationPanel.jsx';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('RiskExplanationPanel', () => {
  it('renders the compact risk explanation panel with core reason and details', () => {
    const { container } = render(
      <RiskExplanationPanel
        expectedDisposalQuantity={18}
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
    expect(container.querySelector('span.rounded-full')).not.toBeInTheDocument();
    expect(screen.queryByText('규칙 v1.1.0')).not.toBeInTheDocument();
    expect(screen.getByText('기준일 2026-08-22')).toBeInTheDocument();
    expect(screen.getByText('안전재고 기준 1개')).toBeInTheDocument();
    expect(screen.getByText('30일 예상 폐기수량')).toBeInTheDocument();
    expect(screen.getByText('18개')).toBeInTheDocument();
    expect(screen.getByTestId('risk-metric-grid')).toHaveClass('grid-cols-3');
    expect(screen.getByText('30일 예상 폐기수량')).toHaveClass('whitespace-nowrap');
    expect(screen.getByText('+9개 충족')).toBeInTheDocument();
    expect(screen.getByText('세부 평가 내역 (1건)')).toBeInTheDocument();
    expect(screen.getByText('predictedQtyD30=154, availableQty=140')).toBeInTheDocument();
  });

  it('does not render a separate projected safety stock shortage banner', () => {
    render(
      <RiskExplanationPanel
        data={{
          assessmentStatus: 'ASSESSED',
          riskGrade: 'CAUTION',
          availableQty: 10,
          safetyStockQty: 12,
          safetyGapQty: 10,
          shortageYn: 'Y',
          reasonMessage: '안전재고 기준 미달',
          reasons: [],
        }}
      />,
    );

    expect(screen.queryByText(/안전재고 목표치 대비/)).not.toBeInTheDocument();
  });

  it('formats calculation evidence with cleaned decimals', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <RiskExplanationPanel
          data={{
            assessmentStatus: 'ASSESSED',
            riskGrade: 'CAUTION',
            reasonMessage:
              '[ASSESSED/v1.1.0/PREDICTED_SHORTAGE] D+30 수요예측 대비 재고 부족 예상 (14.456개 부족) | 산식: 가용재고=on_hand_qty(48), D+7예상잔고=max(0, 가용재고-예측D7)=32.179, D+30부족량=max(0, 예측D30-가용재고)=14.456, 안전재고부족=max(0, 안전재고-D+7예상잔고)=0, 소비기한/LOT 규칙을 함께 적용했습니다.',
            reasons: [],
          }}
        />
      </TooltipProvider>,
    );

    expect(screen.getByText('D+30 수요예측 대비 재고 부족 예상 (14개 부족)')).toBeInTheDocument();
    expect(
      screen.queryByText(
        '가용 재고: 48개, 7일 후 예상 잔고: 32개, 30일 부족 수량: 14개, 안전 재고 부족: 0개, 소비기한과 로트 규칙도 함께 적용했습니다.',
      ),
    ).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: '계산 근거 보기' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      '가용 재고: 48개, 7일 후 예상 잔고: 32개, 30일 부족 수량: 14개, 안전 재고 부족: 0개, 소비기한과 로트 규칙도 함께 적용했습니다.',
    );
  });

  it('opens calculation evidence when the trigger is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <RiskExplanationPanel
          data={{
            assessmentStatus: 'ASSESSED',
            riskGrade: 'CAUTION',
            reasonMessage: '재고 판정 결과 | 산식: 가용재고=48, 안전재고부족=max(0, 60-48)=12',
            reasons: [],
          }}
        />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole('button', { name: '계산 근거 보기' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('가용 재고: 48개, 안전 재고 부족: 12개');
  });

  it('shows the safety stock shortage amount when available stock is below the target', () => {
    render(
      <RiskExplanationPanel
        data={{
          assessmentStatus: 'ASSESSED',
          riskGrade: 'CAUTION',
          availableQty: 8,
          safetyStockQty: 12,
          shortageYn: 'Y',
          reasonMessage: '안전재고 기준 미달',
          reasons: [],
        }}
      />,
    );

    expect(screen.getByText('안전재고 기준 12개')).toBeInTheDocument();
    expect(screen.getByText('-4개 부족')).toBeInTheDocument();
  });
});
