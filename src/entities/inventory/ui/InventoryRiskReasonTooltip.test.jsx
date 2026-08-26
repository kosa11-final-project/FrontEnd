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
      primaryReason: 'D+30 예상 수요가 가용재고를 초과합니다.',
      calculationEvidence: '가용 재고: 100개, 30일 부족 수량: 40개',
    });
  });

  it('translates the full server sync formula into Korean calculation evidence', () => {
    expect(
      parseInventoryRiskReason(
        '[ASSESSED/v1.1.0/PREDICTED_SHORTAGE] D+30 수요예측 대비 재고 부족 예상 (14.456개 부족) | 산식: 가용재고=on_hand_qty(48), D+7예상잔고=max(0, 가용재고-예측D7)=32.179, D+30부족량=max(0, 예측D30-가용재고)=14.456, 안전재고부족=max(0, 안전재고-D+7예상잔고)=0, 소비기한/LOT 규칙을 함께 적용했습니다.',
      ),
    ).toMatchObject({
      primaryReason: 'D+30 수요예측 대비 재고 부족 예상 (14개 부족)',
      calculationEvidence:
        '가용 재고: 48개, 7일 후 예상 잔고: 32개, 30일 부족 수량: 14개, 안전 재고 부족: 0개, 소비기한과 로트 규칙도 함께 적용했습니다.',
    });
  });

  it('explains sellable stock after excluding stopped or expired lots', () => {
    expect(
      parseInventoryRiskReason(
        '[ASSESSED/v1.4.0/OPTIMAL_STOCK] 적정 재고 및 유효기한 유지 상태 | 산식: 판매가능재고=on_hand_qty(100)-판매제외LOT(40)=60, D+7예상잔고=max(0, 판매가능재고-예측D7)=50, 판매 제외 LOT=40, 소비기한/LOT 규칙을 함께 적용했습니다.',
      ),
    ).toMatchObject({
      ruleVersion: 'v1.4.0',
      primaryReason: '적정 재고 및 유효기한 유지 상태',
      calculationEvidence:
        '판매 가능 재고: 60개 (전체 가용 100개 중 판매 제외 40개), 7일 후 예상 잔고: 50개, 판매 제외 LOT: 40개, 소비기한과 로트 규칙도 함께 적용했습니다.',
    });
  });

  it('shows legacy sale-stop arrival wording as imminent', () => {
    expect(
      parseInventoryRiskReason('[ASSESSED/v1.3.0/LOT_SALE_STOPPED] 판매중지일 도래 LOT 존재 (LOT-SKU002569-02)'),
    ).toMatchObject({
      primaryReason: '판매중지일 임박 LOT 존재 (LOT-SKU002569-02)',
    });
  });

  it('shows the DB-persisted reason and formula from an accessible trigger', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <InventoryRiskReasonTooltip reason="[ASSESSED/v1.1.0/PREDICTED_SHORTAGE] D+30 수요예측 대비 재고 부족 예상 (14.456개 부족) | 산식: 가용재고=48, D+7예상잔고=max(0, 가용재고-예측D7)=32.179, D+30부족량=max(0, 예측D30-가용재고)=14.456" />
      </TooltipProvider>,
    );

    const trigger = screen.getByRole('button', { name: '재고 위험 판정 이유 보기' });
    await user.hover(trigger);

    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('D+30 수요예측 대비 재고 부족 예상 (14개 부족)')).toBeInTheDocument();
    expect(screen.getByText('가용 재고: 48개, 7일 후 예상 잔고: 32개, 30일 부족 수량: 14개')).toBeInTheDocument();
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
    expect(screen.queryByText('계산 근거')).not.toBeInTheDocument();
  });

  it('opens from a tap-compatible click', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <InventoryRiskReasonTooltip reason="동기화 저장 사유" />
      </TooltipProvider>,
    );

    const trigger = screen.getByRole('button', { name: '재고 위험 판정 이유 보기' });
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
