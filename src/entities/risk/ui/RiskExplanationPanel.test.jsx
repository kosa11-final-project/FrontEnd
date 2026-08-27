import { beforeAll, describe, expect, it } from 'vitest';
import { render as renderBase, screen } from '@testing-library/react';
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

function render(ui) {
  return renderBase(<TooltipProvider>{ui}</TooltipProvider>);
}

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
    expect(
      screen.getByText('D+30 수요예측 기준으로 재고 부족이 예상되는 상황입니다. (14개 부족 예상)'),
    ).toBeInTheDocument();
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

  it('uses the server disposal quantity, rate, and nearest sale end date as one assessment result', () => {
    render(
      <RiskExplanationPanel
        expectedDisposalQuantity={99}
        data={{
          assessmentStatus: 'ASSESSED',
          riskGrade: 'CAUTION',
          availableQty: 80,
          safetyStockQty: 10,
          expectedDisposalQty30: 13,
          expectedDisposalRate30: 16.25,
          nearestSaleEndDays: 11,
          reasonMessage:
            '판매 종료까지 11일 남았고, 30일 예상 폐기수량은 13개(현재 판매 가능 재고의 16.25%)인 상황입니다.',
          reasons: [],
        }}
      />,
    );

    expect(screen.getByText('13개')).toBeInTheDocument();
    expect(screen.queryByText('99개')).not.toBeInTheDocument();
    expect(screen.getByText('폐기율 16.25% · 종료까지 11일')).toBeInTheDocument();
    expect(screen.getAllByText(/16\.25%/)).toHaveLength(2);
  });

  it('shows criteria from a live structured assessment without a persisted calculation string', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <RiskExplanationPanel
          data={{
            assessmentStatus: 'ASSESSED',
            riskGrade: 'CAUTION',
            availableQty: 80,
            shortageQty30: 0,
            projectedD7: 60,
            safetyStockQty: 10,
            expectedDisposalQty30: 13,
            expectedDisposalRate30: 16.25,
            nearestSaleEndDays: 11,
            reasonMessage:
              '판매 종료까지 11일 남았고, 30일 예상 폐기수량은 13개(현재 판매 가능 재고의 16.25%)인 상황입니다.',
            reasons: [],
          }}
        />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole('button', { name: '판정 기준 보기' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      '사용 기준 데이터: 현재 판매 가능 재고, D+7·D+14·D+30 누적 수요예측, 30일 예상 폐기수량·폐기율, 안전재고 기준, 소비기한·판매중지·소진 로트',
    );
  });

  it('does not claim demand forecasting for a live unassigned assessment without a forecast', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <RiskExplanationPanel
          data={{
            assessmentStatus: 'ASSESSED',
            riskGrade: 'DANGER',
            availableQty: 40,
            expectedDisposalQty30: 40,
            expectedDisposalRate30: 100,
            nearestSaleEndDays: 12,
            reasonMessage:
              '판매 종료까지 12일 남았고, 30일 예상 폐기수량은 40개(현재 판매 가능 재고의 100%)인 상황입니다.',
            reasons: [
              {
                code: 'FORECAST_UNAVAILABLE',
                severity: 'INFO',
                message: '수요예측을 확인할 수 없는 상황입니다.',
              },
            ],
          }}
        />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole('button', { name: '판정 기준 보기' }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(
      '사용 기준 데이터: 현재 판매 가능 재고, 30일 예상 폐기수량·폐기율, 소비기한·판매중지·소진 로트',
    );
    expect(tooltip).not.toHaveTextContent('D+7·D+14·D+30 누적 수요예측');
  });

  it('shows Korean criteria data without exposing calculation details', async () => {
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

    expect(
      screen.getByText('D+30 수요예측 기준으로 재고 부족이 예상되는 상황입니다. (14개 부족 예상)'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        '가용 재고: 48개, 7일 후 예상 잔고: 32개, 30일 부족 수량: 14개, 안전 재고 부족: 0개, 소비기한과 로트 규칙도 함께 적용했습니다.',
      ),
    ).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: '판정 기준 보기' }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(
      '사용 기준 데이터: 현재 판매 가능 재고, D+7·D+14·D+30 누적 수요예측, 안전재고 기준, 소비기한·판매중지·소진 로트',
    );
    expect(tooltip).not.toHaveTextContent(/반영한 값|on_hand_qty|예측D|predictedQty|max\(/);
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

    await user.click(screen.getByRole('button', { name: '판정 기준 보기' }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('사용 기준 데이터: 현재 판매 가능 재고, 안전재고 기준');
    expect(tooltip).not.toHaveTextContent(/반영한 값|가용 재고 =|안전 재고 부족 =/);
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
