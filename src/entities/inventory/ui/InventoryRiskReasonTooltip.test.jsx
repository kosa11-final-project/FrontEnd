import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TooltipProvider } from '@/shared/ui';
import { InventoryRiskReasonTooltip, parseInventoryRiskReason } from './InventoryRiskReasonTooltip.jsx';

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('InventoryRiskReasonTooltip', () => {
  it('translates persisted formula identifiers into Korean calculation evidence', () => {
    expect(
      parseInventoryRiskReason(
        '[ASSESSED/v1.1.0/SHORTAGE_D30] D+30 예상 수요가 가용재고를 초과합니다. | 산식: 가용재고=100, D+30부족량=max(0, 140-100)=40',
      ),
    ).toEqual({
      ruleVersion: 'v1.1.0',
      ruleCode: 'SHORTAGE_D30',
      primaryReason: 'D+30 수요예측 기준으로 재고 부족이 예상되는 상황입니다.',
      calculationEvidence:
        '가용 재고 = 100개, 30일 부족 수량 = 30일 누적 예상 수요에서 판매 가능 재고를 뺀 값(최소 0개) = 40개',
      calculationCriteria: ['현재 판매 가능 재고', 'D+7·D+14·D+30 누적 수요예측'],
    });
  });

  it('translates the full server sync formula into Korean calculation evidence', () => {
    expect(
      parseInventoryRiskReason(
        '[ASSESSED/v1.1.0/PREDICTED_SHORTAGE] D+30 수요예측 대비 재고 부족 예상 (14.456개 부족) | 산식: 가용재고=on_hand_qty(48), D+7예상잔고=max(0, 가용재고-예측D7)=32.179, D+30부족량=max(0, 예측D30-가용재고)=14.456, 안전재고부족=max(0, 안전재고-D+7예상잔고)=0, 소비기한/LOT 규칙을 함께 적용했습니다.',
      ),
    ).toMatchObject({
      primaryReason: 'D+30 수요예측 기준으로 재고 부족이 예상되는 상황입니다. (14개 부족 예상)',
      calculationEvidence:
        '가용 재고 = 전체 가용 재고 48개, 7일 후 예상 잔고 = 판매 가능 재고에서 7일 누적 예상 수요를 뺀 값(최소 0개) = 32개, 30일 부족 수량 = 30일 누적 예상 수요에서 판매 가능 재고를 뺀 값(최소 0개) = 14개, 안전 재고 부족 = 안전 재고 기준에서 7일 후 예상 잔고를 뺀 값(최소 0개) = 0개, 소비기한·로트 규칙을 함께 적용했습니다.',
      calculationCriteria: [
        '현재 판매 가능 재고',
        'D+7·D+14·D+30 누적 수요예측',
        '안전재고 기준',
        '소비기한·판매중지·소진 로트',
      ],
    });
  });

  it('explains sellable stock after excluding stopped or expired lots', () => {
    expect(
      parseInventoryRiskReason(
        '[ASSESSED/v1.4.0/OPTIMAL_STOCK] 적정 재고 및 유효기한 유지 상태 | 산식: 판매가능재고=on_hand_qty(100)-판매제외LOT(40)=60, D+7예상잔고=max(0, 판매가능재고-예측D7)=50, 판매 제외 LOT=40, 소비기한/LOT 규칙을 함께 적용했습니다.',
      ),
    ).toMatchObject({
      ruleVersion: 'v1.4.0',
      primaryReason: '현재 가용재고와 LOT 상태가 양호해 안정적인 재고 상태입니다.',
      calculationEvidence:
        '판매 가능 재고 = 전체 가용 재고 100개 - 판매 제외 로트 40개 = 60개, 7일 후 예상 잔고 = 판매 가능 재고에서 7일 누적 예상 수요를 뺀 값(최소 0개) = 50개, 판매 제외 로트 = 40개, 소비기한·로트 규칙을 함께 적용했습니다.',
      calculationCriteria: ['현재 판매 가능 재고', 'D+7·D+14·D+30 누적 수요예측', '소비기한·판매중지·소진 로트'],
    });
  });

  it('explains the expected disposal quantity, rate, and nearest sale-end date from the persisted rule', () => {
    expect(
      parseInventoryRiskReason(
        '[ASSESSED/v1.6.0/EXPECTED_DISPOSAL_CAUTION] 판매 종료까지 11일 남았고, 30일 예상 폐기수량은 13개(현재 판매 가능 재고의 16.25%)인 상황입니다. | 산식: 가용재고=on_hand_qty(80), D+7예상잔고=max(0, 판매가능재고-예측D7)=60, D+30부족량=max(0, 예측D30-판매가능재고)=0, 30일예상폐기=13, 예상폐기율=16.25%, 최근판매종료일=D+11, 소비기한/LOT 규칙을 함께 적용했습니다.',
      ),
    ).toMatchObject({
      primaryReason: '판매 종료까지 11일 남았고, 30일 예상 폐기수량은 13개(현재 판매 가능 재고의 16.25%)인 상황입니다.',
      calculationCriteria: [
        '현재 판매 가능 재고',
        'D+7·D+14·D+30 누적 수요예측',
        '30일 예상 폐기수량·폐기율',
        '소비기한·판매중지·소진 로트',
      ],
    });
  });

  it('does not claim demand forecast usage for zero-demand unassigned disposal evidence', () => {
    expect(
      parseInventoryRiskReason(
        '[ASSESSED/v1.6.0/EXPECTED_DISPOSAL_DANGER] 미할당 재고의 30일 예상 폐기수량은 10개입니다. | 산식: 가용재고=on_hand_qty(10), 30일예상폐기=10, 예상폐기율=100%, 최근판매종료일=D+5, 소비기한/LOT 규칙을 함께 적용했습니다.',
      ).calculationCriteria,
    ).toEqual(['현재 판매 가능 재고', '30일 예상 폐기수량·폐기율', '소비기한·판매중지·소진 로트']);
  });

  it.each([
    [
      'DATA_MISSING',
      '가용재고 데이터가 없어 재고 0개로 간주하여 위험 판정했습니다.',
      '현재 가용재고 정보를 확인할 수 없어 부족 위험이 높은 상황입니다.',
    ],
    [
      'ZERO_AVAILABLE_STOCK',
      '판매 가능한 가용재고가 0개입니다.',
      '현재 판매 가능한 가용재고가 없어 부족한 상황입니다.',
    ],
    [
      'FORECAST_WITHOUT_SAFETY_POLICY',
      '수요예측과 안전재고 정책이 모두 없어 양호 여부를 확정할 기준이 부족합니다.',
      '수요예측과 안전재고 기준이 없어 재고 상태를 확정하기 어려운 상황입니다.',
    ],
    [
      'CURRENT_UNDER_SAFETY',
      '현재 가용재고(18)가 안전재고(38) 미만',
      '현재 가용재고(18개)가 안전재고(38개)보다 적어 부족한 상황입니다.',
    ],
    [
      'PROJECTED_UNDER_SAFETY',
      'D+7 예상잔고(18)가 안전재고(38) 미만',
      '7일 후 예상 재고(18개)가 안전재고(38개)보다 적어 부족이 예상되는 상황입니다.',
    ],
    [
      'EXPIRY_CRITICAL',
      '소비기한 30일 이하 임박 (22일 남음)',
      '소비기한까지 22일 남아 기한 내 소진 관리가 필요한 상황입니다.',
    ],
    [
      'SALE_STOP_WARNING',
      '판매중지일까지 30일 이하 남았습니다 (18일 남음)',
      '판매중지일까지 18일 남아 판매·소진 일정 관리가 필요한 상황입니다.',
    ],
  ])('normalizes %s to the unified situation tone', (ruleCode, legacyReason, expected) => {
    expect(parseInventoryRiskReason(`[ASSESSED/v1.5.0/${ruleCode}] ${legacyReason}`)?.primaryReason).toBe(expected);
  });

  it('shows legacy sale-stop arrival wording as imminent', () => {
    expect(
      parseInventoryRiskReason('[ASSESSED/v1.3.0/LOT_SALE_STOPPED] 판매중지일 도래 LOT 존재 (LOT-SKU002569-02)'),
    ).toMatchObject({
      primaryReason: '판매중지된 LOT가 있어 판매 가능한 재고가 줄어든 상황입니다.',
    });
  });

  it('shows the DB-persisted reason and criteria data from an accessible trigger', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <InventoryRiskReasonTooltip reason="[ASSESSED/v1.1.0/PREDICTED_SHORTAGE] D+30 수요예측 대비 재고 부족 예상 (14.456개 부족) | 산식: 가용재고=48, D+7예상잔고=max(0, 가용재고-예측D7)=32.179, D+30부족량=max(0, 예측D30-가용재고)=14.456" />
      </TooltipProvider>,
    );

    const trigger = screen.getByRole('button', { name: '판정 기준 보기' });
    await user.hover(trigger);

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(
      screen.getByText('D+30 수요예측 기준으로 재고 부족이 예상되는 상황입니다. (14개 부족 예상)'),
    ).toBeInTheDocument();
    expect(screen.getByText('사용 기준 데이터: 현재 판매 가능 재고, D+7·D+14·D+30 누적 수요예측')).toBeInTheDocument();
    expect(tooltip).not.toHaveTextContent(/반영한 값|on_hand_qty|예측D|predictedQty|max\(/);
    expect(screen.getByText('규칙 v1.1.0 · PREDICTED_SHORTAGE')).toBeInTheDocument();
  });

  it('keeps a legacy reason readable without inventing a formula', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <InventoryRiskReasonTooltip reason="안전재고 목표치보다 12개 부족합니다." />
      </TooltipProvider>,
    );

    await user.tab();

    expect(await screen.findByRole('tooltip')).toHaveTextContent('안전재고 목표치보다 12개 부족합니다.');
    expect(screen.queryByText('판정 기준')).not.toBeInTheDocument();
  });

  it('opens from a tap-compatible click', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <InventoryRiskReasonTooltip reason="동기화 저장 사유" />
      </TooltipProvider>,
    );

    const trigger = screen.getByRole('button', { name: '판정 기준 보기' });
    await user.click(trigger);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('동기화 저장 사유');
  });

  it('does not render an empty explanation control', () => {
    const { container } = render(
      <TooltipProvider>
        <InventoryRiskReasonTooltip reason="   " />
      </TooltipProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
